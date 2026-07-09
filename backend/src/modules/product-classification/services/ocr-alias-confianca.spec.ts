import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OcrAliasService } from './ocr-alias.service';
import { AbbreviationService } from './abbreviation.service';
import { ProductKnowledgeBase } from '../entities/product-knowledge-base.entity';
import { IngredientNormalizerService } from '../../receitas/services/ingredient-normalizer.service';

/**
 * A3 do PLANO_PRECISAO_ENGINE.md: lavagem de confiança.
 *
 * Bug real (verificado no código antes do fix): um item resolvido por um
 * estágio FRACO (normalizer 0.55, fallback 0.3) era persistido via
 * persistirCanonical() sem registrar a origem. Na consulta seguinte, o MESMO
 * palpite fraco batia no bloco kb_exato e voltava com confiança 0.92 —
 * promovido de "chute" a "quase-certeza" só por estar em cache.
 *
 * Correção: a KB grava `origem_estagio` junto do canonical_ingredient. Ao
 * resolver por kb_exato, a Engine devolve a ORIGEM real (não um valor fixo),
 * preservando a confiança honesta. Estágios fracos (normalizer, fallback)
 * não persistem — para não contaminar a base com um chute revestido de cache.
 */
describe('OcrAliasService — A3: sem lavagem de confiança', () => {
  let service: OcrAliasService;
  let knowledgeRepo: {
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    query: jest.Mock;
  };
  let abbreviation: { expand: jest.Mock };
  let normalizer: { normalizar: jest.Mock };

  beforeEach(async () => {
    knowledgeRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({}),
      create: jest.fn((x) => x),
      query: jest.fn().mockResolvedValue([]),
    };
    abbreviation = { expand: jest.fn().mockReturnValue(null) };
    normalizer = { normalizar: jest.fn().mockReturnValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrAliasService,
        {
          provide: getRepositoryToken(ProductKnowledgeBase),
          useValue: knowledgeRepo,
        },
        { provide: AbbreviationService, useValue: abbreviation },
        { provide: IngredientNormalizerService, useValue: normalizer },
      ],
    }).compile();

    service = module.get(OcrAliasService);
  });

  it('estágio normalizer NÃO persiste na KB (não deve contaminar cache)', async () => {
    normalizer.normalizar.mockReturnValue({
      nomeCanônico: 'produto qualquer',
      aGosto: false,
    });

    const r = await service.resolverComEstagio('PRODUTO ESTRANHO XYZ 123');

    expect(r.estagio).toBe('normalizer');
    // persistirCanonical não deve ter sido chamado para este estágio fraco
    expect(knowledgeRepo.update).not.toHaveBeenCalled();
    expect(knowledgeRepo.save).not.toHaveBeenCalled();
  });

  it('estágio fallback NÃO persiste na KB', async () => {
    const r = await service.resolverComEstagio(
      'COISA TOTALMENTE DESCONHECIDA 999',
    );

    expect(r.estagio).toBe('fallback');
    expect(knowledgeRepo.update).not.toHaveBeenCalled();
    expect(knowledgeRepo.save).not.toHaveBeenCalled();
  });

  it('estágio regex (OCR_MAPA / compostos) PERSISTE com origem_estagio marcada', async () => {
    // Só persiste em linhas JÁ existentes na KB (criadas pelo fluxo de classificação
    // de produto, fora deste service) — sem canonical_ingredient ainda.
    knowledgeRepo.findOne.mockImplementation(({ where }: any) => {
      if (where?.normalized_name && !('corrigido_manual' in where)) {
        return Promise.resolve({
          id: 'kb1',
          canonical_ingredient: null,
          codigo_barras: null,
        });
      }
      return Promise.resolve(null);
    });

    // "merluza" bate no OCR_MAPA como peixe conhecido
    await service.resolverComEstagio('FILE MERLUZA IGLU 400G');

    expect(knowledgeRepo.update).toHaveBeenCalledWith(
      'kb1',
      expect.objectContaining({ origem_estagio: 'regex' }),
    );
  });

  it('kb_exato devolve a ORIGEM real gravada, não um valor fixo', async () => {
    // Simula item já cacheado que foi originalmente resolvido por regex (0.88),
    // não por dicionário. A releitura deve reportar 'regex', não 'kb_exato' cru.
    knowledgeRepo.findOne.mockImplementation(({ where }: any) => {
      if (where?.normalized_name && !('corrigido_manual' in where)) {
        return Promise.resolve({
          id: 'kb1',
          canonical_ingredient: 'filé de merluza',
          origem_estagio: 'regex',
        });
      }
      return Promise.resolve(null);
    });

    const r = await service.resolverComEstagio('FILE MERLUZA MARCA NOVA 500G');

    // A origem herdada deve ser a real (regex), preservando a confiança 0.88,
    // e não uma confiança de "kb" fixa (0.92) que mentiria sobre a certeza.
    expect(r.canonical).toBe('filé de merluza');
    expect(r.estagio).toBe('regex');
  });

  it('kb_exato SEM origem_estagio registrada (dado legado) cai no default seguro kb_exato', async () => {
    knowledgeRepo.findOne.mockImplementation(({ where }: any) => {
      if (where?.normalized_name && !('corrigido_manual' in where)) {
        return Promise.resolve({
          id: 'kb1',
          canonical_ingredient: 'arroz',
          origem_estagio: null,
        });
      }
      return Promise.resolve(null);
    });

    const r = await service.resolverComEstagio('ARROZ MARCA DESCONHECIDA XYZ');

    expect(r.canonical).toBe('arroz');
    expect(r.estagio).toBe('kb_exato');
  });
});
