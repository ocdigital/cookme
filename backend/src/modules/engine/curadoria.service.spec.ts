import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CuradoriaService } from './curadoria.service';
import { CuradoriaItem } from './curadoria-item.entity';

/**
 * Fila de curadoria (PLANO_PRECISAO_ENGINE.md §7): o endpoint de correção
 * já existia, mas ninguém sabia O QUE corrigir. Esta fila acumula itens de
 * baixa confiança por frequência — corrigir o que aparece mais tem mais
 * impacto que corrigir um item visto uma vez só.
 */
describe('CuradoriaService', () => {
  let service: CuradoriaService;
  let repo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((x) => Promise.resolve({ id: 'novo', ...x })),
      create: jest.fn((x) => x),
      update: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CuradoriaService, { provide: getRepositoryToken(CuradoriaItem), useValue: repo }],
    }).compile();

    service = module.get(CuradoriaService);
  });

  describe('registrarOcorrencia — só entra na fila abaixo do limiar', () => {
    it('confiança ALTA (>= limiar) não entra na fila', async () => {
      await service.registrarOcorrencia({
        descricao: 'CR LEITE ITALAC 200GR',
        canonico: 'creme de leite',
        estagio: 'dicionario',
        confianca: 0.95,
      });
      expect(repo.save).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('confiança BAIXA (< limiar) entra na fila pela primeira vez', async () => {
      await service.registrarOcorrencia({
        descricao: 'PRODUTO ESQUISITO XYZ',
        canonico: 'produto esquisito',
        estagio: 'fallback',
        confianca: 0.3,
      });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ ocorrencias: 1, confianca: 0.3, resolvido: false }),
      );
    });

    it('item repetido incrementa ocorrencias em vez de duplicar', async () => {
      repo.findOne.mockResolvedValue({
        id: 'existente', ocorrencias: 4, descricao_normalizada: 'produto esquisito xyz',
      });
      await service.registrarOcorrencia({
        descricao: 'PRODUTO ESQUISITO XYZ',
        canonico: 'produto esquisito',
        estagio: 'fallback',
        confianca: 0.3,
      });
      expect(repo.update).toHaveBeenCalledWith('existente', expect.objectContaining({ ocorrencias: 5 }));
    });

    it('item já resolvido (corrigido) não volta pra fila mesmo com confiança baixa', async () => {
      repo.findOne.mockResolvedValue({
        id: 'existente', ocorrencias: 4, resolvido: true, descricao_normalizada: 'x',
      });
      await service.registrarOcorrencia({
        descricao: 'X', canonico: 'x', estagio: 'fallback', confianca: 0.3,
      });
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('marcarResolvido — sai da fila ativa ao ser corrigido', () => {
    it('marca resolvido=true pela descrição normalizada', async () => {
      repo.findOne.mockResolvedValue({ id: 'kb1', descricao_normalizada: 'x' });
      await service.marcarResolvido('X');
      expect(repo.update).toHaveBeenCalledWith('kb1', { resolvido: true });
    });
  });

  describe('listarFila — priorizada por frequência, só itens ativos', () => {
    it('delega ao repo com filtro resolvido=false e ordenação por ocorrencias desc', async () => {
      await service.listarFila(20);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resolvido: false },
          order: { ocorrencias: 'DESC' },
          take: 20,
        }),
      );
    });
  });
});
