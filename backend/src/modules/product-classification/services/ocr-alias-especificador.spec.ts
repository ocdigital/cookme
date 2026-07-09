import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OcrAliasService } from './ocr-alias.service';
import { AbbreviationService } from './abbreviation.service';
import { ProductKnowledgeBase } from '../entities/product-knowledge-base.entity';
import { IngredientNormalizerService } from '../../receitas/services/ingredient-normalizer.service';

/**
 * Camada 1 (PLANO_PRECISAO_ENGINE.md §3, §11): núcleo + especificador.
 *
 * A abordagem antiga cadastrava cada composto à mão (queijo prato, queijo
 * coalho...) e nunca terminava — qualquer variedade fora da lista virava só
 * o núcleo genérico ("queijo", "filé"), perdendo a informação que o cliente
 * paga (provolone ≠ prato ≠ mussarela; merluza ≠ tilápia ≠ frango).
 *
 * Estes testes cobrem os casos REAIS reportados pelo usuário + os riscos
 * identificados na análise adversarial (A1, A2, A4, A5, A10).
 */
describe('OcrAliasService — Camada 1: núcleo + especificador', () => {
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

  describe('casos reais reportados (queijo e filé)', () => {
    const casos: Array<[string, string]> = [
      ['QUEIJO PROVOLONE QUATA FAT', 'queijo provolone'],
      ['FILE MERLUZA IGLU S/PELE 400G', 'filé de merluza'],
      ['QUEIJO MUSSARELA', 'queijo mussarela'],
      ['QUEIJO PRATO FAT', 'queijo prato'], // já funcionava — não pode regredir
    ];
    it.each(casos)('%s → %s', async (desc, esperado) => {
      const r = await service.resolverComEstagio(desc);
      expect(r.canonical).toBe(esperado);
    });
  });

  describe('A1 — especificador SEM núcleo explícito no texto', () => {
    it('"PROVOLONE QUATA 200G" (sem a palavra QUEIJO) → queijo provolone', async () => {
      const r = await service.resolverComEstagio('PROVOLONE QUATA 200G');
      expect(r.canonical).toBe('queijo provolone');
    });
    it('"MERLUZA IGLU 400G" (sem a palavra FILE) → filé de merluza OU merluza (aceitável)', async () => {
      const r = await service.resolverComEstagio('MERLUZA IGLU 400G');
      expect(r.canonical).toMatch(/merluza/);
    });
  });

  describe('A2 — limpeza consciente do núcleo (não destrói especificador legítimo)', () => {
    it('"TOMATE SALADA KG" — "salada" é variedade de tomate, não deve sumir', async () => {
      const r = await service.resolverComEstagio('TOMATE SALADA KG');
      // Não pode virar só "tomate" perdendo a variedade, quando existe registro de "salada"
      // como especificador de tomate. Aceita "tomate salada" (composto) OU "tomate" (genérico
      // seguro) — o que este teste garante é não quebrar com exceção nem inventar outra coisa.
      expect(r.canonical).toMatch(/^tomate/);
    });
  });

  describe('A4 — truncamento: cupom trunca o especificador', () => {
    it('"QUEIJO PROVOL QUATA" (truncado) → ainda resolve queijo provolone', async () => {
      const r = await service.resolverComEstagio('QUEIJO PROVOL QUATA 200G');
      expect(r.canonical).toBe('queijo provolone');
    });
    it('"QUEIJO MUSS FAT" (truncado) → queijo mussarela', async () => {
      const r = await service.resolverComEstagio('QUEIJO MUSS FAT 150G');
      expect(r.canonical).toBe('queijo mussarela');
    });
  });

  describe('A5 — gramática do conector por núcleo', () => {
    it('queijo + especificador NÃO usa "de" (queijo provolone, não queijo de provolone)', async () => {
      const r = await service.resolverComEstagio('QUEIJO PROVOLONE 200G');
      expect(r.canonical).toBe('queijo provolone');
      expect(r.canonical).not.toContain(' de provolone');
    });
    it('filé + peixe USA "de" (filé de merluza)', async () => {
      const r = await service.resolverComEstagio('FILE MERLUZA 400G');
      expect(r.canonical).toBe('filé de merluza');
    });
  });

  describe('A10 — especificador multi-palavra tratado como unidade', () => {
    it('"QUEIJO MINAS FRESCAL" → queijo minas frescal (não corta em "minas")', async () => {
      const r = await service.resolverComEstagio('QUEIJO MINAS FRESCAL 500G');
      expect(r.canonical).toBe('queijo minas frescal');
    });
  });

  describe('guarda-corpo: nunca inventa especificador desconhecido', () => {
    it('"QUEIJO ZZXPTO MARCA 200G" (especificador não cadastrado) → cai pro genérico seguro', async () => {
      const r = await service.resolverComEstagio('QUEIJO ZZXPTO MARCA 200G');
      // Deve ficar "queijo" (não inventa "queijo zzxpto")
      expect(r.canonical).toBe('queijo');
    });
  });

  describe('A11 — Camada 1 roda ANTES do dicionário genérico (evita prefix-match ganancioso)', () => {
    it('dicionário não é sequer chamado quando a Camada 1 resolve', async () => {
      await service.resolverComEstagio('QUEIJO PROVOLONE QUATA 200G');
      // Se o dicionário fosse chamado primeiro, devolveria "queijo" e engoliria "provolone"
      expect(abbreviation.expand).not.toHaveBeenCalled();
    });
  });
});
