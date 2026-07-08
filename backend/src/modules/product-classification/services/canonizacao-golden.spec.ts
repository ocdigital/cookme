import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OcrAliasService } from './ocr-alias.service';
import { AbbreviationService, SEED_ABBREVIATIONS } from './abbreviation.service';
import { ProductKnowledgeBase } from '../entities/product-knowledge-base.entity';
import { AbbreviationExpansion } from '../entities/abbreviation-expansion.entity';
import { IngredientNormalizerService } from '../../receitas/services/ingredient-normalizer.service';
import { readFileSync } from 'fs';
import { join } from 'path';

const golden: { pares: Array<{ nome_ocr: string; esperado: string }> } = JSON.parse(
  readFileSync(join(__dirname, '../../../../test/fixtures/cupom-golden.json'), 'utf-8'),
);

/**
 * Golden set de canonização — mede acurácia dos estágios OFFLINE
 * (dicionário de abreviações, OCR_MAPA, normalizador linguístico, fallback).
 * Estágios de banco (EAN, KB exata, fuzzy) ficam mudos: mocks vazios.
 *
 * LIMIAR é uma catraca: só sobe. Se este teste quebrar após uma mudança,
 * a mudança piorou a canonização — não abaixe o limiar sem justificar.
 */
const LIMIAR = 0.9;

describe('Canonização — golden set de cupons reais', () => {
  let service: OcrAliasService;

  beforeAll(async () => {
    const seedRows = SEED_ABBREVIATIONS.map(([abbr, expanded, is_ingredient, categoria], i) => ({
      id: `seed-${i}`,
      abbr,
      expanded,
      is_ingredient,
      categoria,
      is_active: true,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrAliasService,
        AbbreviationService,
        IngredientNormalizerService,
        {
          provide: getRepositoryToken(AbbreviationExpansion),
          useValue: {
            find: jest.fn().mockResolvedValue(seedRows),
            upsert: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(ProductKnowledgeBase),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({}),
            query: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    const abbreviation = module.get(AbbreviationService);
    await abbreviation.onModuleInit();
    service = module.get(OcrAliasService);
  });

  it(`acurácia offline >= ${LIMIAR * 100}% no golden set (${golden.pares.length} casos)`, async () => {
    const erros: string[] = [];
    let acertos = 0;

    for (const { nome_ocr, esperado } of golden.pares) {
      const obtido = await service.resolverNomeCanônico(nome_ocr);
      if (obtido === esperado) {
        acertos++;
      } else {
        erros.push(`"${nome_ocr}" → obtido "${obtido}", esperado "${esperado}"`);
      }
    }

    const acuracia = acertos / golden.pares.length;
    // Log sempre (score é a métrica de venda da Engine); erros guiam a curadoria
    // eslint-disable-next-line no-console
    console.log(
      `Golden set: ${acertos}/${golden.pares.length} (${(acuracia * 100).toFixed(1)}%)` +
      (erros.length > 0 ? '\n' + erros.join('\n') : ''),
    );

    expect(acuracia).toBeGreaterThanOrEqual(LIMIAR);
  });
});
