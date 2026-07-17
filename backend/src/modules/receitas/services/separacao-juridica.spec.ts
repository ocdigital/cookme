import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ReceitaBancoService } from './receita-banco.service';
import { RecipeRagService } from './recipe-rag.service';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { ReceitaClassificacaoService } from './receita-classificacao.service';

const repoStub = () => ({ findOne: jest.fn(), find: jest.fn(), createQueryBuilder: jest.fn() });
const bancoExtraProviders = () => [
  { provide: IngredientNormalizerService, useValue: { normalizar: jest.fn() } },
  { provide: ReceitaClassificacaoService, useValue: { classificar: jest.fn() } },
];

/**
 * Regressão da separação jurídica (Lei 9.610/98):
 * banco público = SOMENTE receitas geradas por IA (url_fonte IS NULL AND autor_id IS NULL).
 * Receitas importadas (autor_id preenchido) são biblioteca pessoal — nunca podem
 * aparecer em matching, RAG ou acesso direto de terceiros.
 */
describe('Separação jurídica — receitas importadas não vazam', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // buscarPorIngredientes (matching usado pela geração)
  // ───────────────────────────────────────────────────────────────────────────
  describe('ReceitaBancoService.buscarPorIngredientes', () => {
    let service: ReceitaBancoService;
    let andWhereCalls: string[];

    beforeEach(async () => {
      andWhereCalls = [];
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation((cond: string) => {
          andWhereCalls.push(cond);
          return qb;
        }),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReceitaBancoService,
          {
            provide: getRepositoryToken(Receita),
            useValue: {
              createQueryBuilder: jest.fn().mockReturnValue(qb),
              findOne: jest.fn(),
              find: jest.fn(),
            },
          },
          { provide: getRepositoryToken(ReceitaIngrediente), useValue: repoStub() },
          { provide: getRepositoryToken(Produto), useValue: repoStub() },
          ...bancoExtraProviders(),
        ],
      }).compile();

      service = module.get(ReceitaBancoService);
    });

    it('filtra estritamente banco público: url_fonte IS NULL E autor_id IS NULL', async () => {
      await service.buscarPorIngredientes(['frango', 'arroz']);

      const filtros = andWhereCalls.join(' && ');
      expect(filtros).toContain('r.url_fonte IS NULL');
      expect(filtros).toContain('r.autor_id IS NULL');
      // O filtro antigo (que vazava importadas) não pode voltar:
      expect(filtros).not.toContain('autor_id IS NOT NULL');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // buscarPorId com checagem de dono (GET /receitas/:id)
  // ───────────────────────────────────────────────────────────────────────────
  describe('ReceitaBancoService.buscarPorId — checagem de dono', () => {
    let service: ReceitaBancoService;
    let findOneMock: jest.Mock;

    beforeEach(async () => {
      findOneMock = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReceitaBancoService,
          {
            provide: getRepositoryToken(Receita),
            useValue: { findOne: findOneMock, createQueryBuilder: jest.fn(), find: jest.fn() },
          },
          { provide: getRepositoryToken(ReceitaIngrediente), useValue: repoStub() },
          { provide: getRepositoryToken(Produto), useValue: repoStub() },
          ...bancoExtraProviders(),
        ],
      }).compile();
      service = module.get(ReceitaBancoService);
    });

    it('receita importada é invisível para terceiros (404, não 403)', async () => {
      findOneMock.mockResolvedValue({
        id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
        autor_id: 'usuario-A',
        url_fonte: 'https://exemplo.com/receita',
      });

      await expect(service.buscarPorId('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'usuario-B')).rejects.toThrow(NotFoundException);
    });

    it('dono acessa a própria receita importada', async () => {
      const receita = { id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', autor_id: 'usuario-A', url_fonte: 'https://exemplo.com/x' };
      findOneMock.mockResolvedValue(receita);

      await expect(service.buscarPorId('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'usuario-A')).resolves.toEqual(receita);
    });

    it('receita pública é acessível por qualquer usuário', async () => {
      const receita = { id: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', autor_id: null, url_fonte: null };
      findOneMock.mockResolvedValue(receita);

      await expect(service.buscarPorId('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'usuario-B')).resolves.toEqual(receita);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // RAG buscarSimilares (contexto de geração)
  // ───────────────────────────────────────────────────────────────────────────
  describe('RecipeRagService.buscarSimilares', () => {
    let service: RecipeRagService;
    let queryMock: jest.Mock;

    beforeEach(async () => {
      queryMock = jest.fn().mockResolvedValue([]);
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RecipeRagService,
          {
            provide: getRepositoryToken(Receita),
            useValue: { createQueryBuilder: jest.fn(), findOne: jest.fn() },
          },
          { provide: DataSource, useValue: { query: queryMock } },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        ],
      }).compile();

      service = module.get(RecipeRagService);
      jest.spyOn(service, 'gerarEmbedding').mockResolvedValue([0.1, 0.2, 0.3]);
    });

    it('SQL do RAG exclui importadas INCONDICIONALMENTE', async () => {
      await service.buscarSimilares(['frango', 'arroz']);

      expect(queryMock).toHaveBeenCalled();
      const sql: string = queryMock.mock.calls[0][0];
      expect(sql).toContain('url_fonte IS NULL');
      expect(sql).toContain('autor_id IS NULL');
      expect(sql).not.toContain('autor_id IS NOT NULL');
    });
  });
});
