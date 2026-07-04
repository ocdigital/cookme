import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OcrAliasService } from './ocr-alias.service';
import { AbbreviationService } from './abbreviation.service';
import { ProductKnowledgeBase } from '../entities/product-knowledge-base.entity';
import { IngredientNormalizerService } from '../../receitas/services/ingredient-normalizer.service';

/**
 * EAN como estágio 0 da canonização: uma vez aprendido EAN → ingrediente,
 * recompra do mesmo produto resolve com zero ambiguidade, sem heurística.
 */
describe('OcrAliasService — resolução por EAN', () => {
  let service: OcrAliasService;
  let knowledgeRepo: { findOne: jest.Mock; update: jest.Mock; query: jest.Mock };
  let abbreviation: { expand: jest.Mock };

  beforeEach(async () => {
    knowledgeRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      query: jest.fn().mockResolvedValue([]),
    };
    abbreviation = { expand: jest.fn().mockReturnValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrAliasService,
        { provide: getRepositoryToken(ProductKnowledgeBase), useValue: knowledgeRepo },
        { provide: AbbreviationService, useValue: abbreviation },
        {
          provide: IngredientNormalizerService,
          useValue: { normalizar: jest.fn().mockReturnValue(null) },
        },
      ],
    }).compile();

    service = module.get(OcrAliasService);
  });

  it('EAN conhecido resolve direto, sem passar pelos outros estágios', async () => {
    knowledgeRepo.findOne.mockImplementation(({ where }: any) =>
      where?.codigo_barras === '7891234567890'
        ? Promise.resolve({ id: 'kb1', canonical_ingredient: 'creme de leite' })
        : Promise.resolve(null),
    );

    // Nome completamente diferente do aprendido — EAN manda
    const canonical = await service.resolverNomeCanônico('CREME LEITE TRAD 200G', '7891234567890');

    expect(canonical).toBe('creme de leite');
    expect(abbreviation.expand).not.toHaveBeenCalled();
  });

  it('resolução com EAN presente aprende o EAN na knowledge base', async () => {
    abbreviation.expand.mockReturnValue({ expanded: 'creme de leite', is_ingredient: true });
    // linha da KB existe para o normalized_name (criada pela classificação)
    knowledgeRepo.findOne.mockImplementation(({ where }: any) => {
      if (where?.codigo_barras) return Promise.resolve(null); // EAN ainda não aprendido
      if (where?.normalized_name)
        return Promise.resolve({ id: 'kb1', canonical_ingredient: null, codigo_barras: null });
      return Promise.resolve(null);
    });

    const canonical = await service.resolverNomeCanônico('CR LEITE ITALAC 200GR', '7891234567890');

    expect(canonical).toBe('creme de leite');
    expect(knowledgeRepo.update).toHaveBeenCalledWith(
      'kb1',
      expect.objectContaining({ codigo_barras: '7891234567890' }),
    );
  });

  it('sem EAN, fluxo continua funcionando como antes', async () => {
    abbreviation.expand.mockReturnValue({ expanded: 'arroz', is_ingredient: true });

    const canonical = await service.resolverNomeCanônico('ARR BRANCO CAMIL 1KG');

    expect(canonical).toBe('arroz');
  });

  it('marca na frente não quebra o dicionário de abreviações', async () => {
    // "ITALAC CR LEITE 200GR": expand() por prefixo falha no nome cru
    // (ITALAC não é abreviação); após limpar marca/embalagem deve casar CR LEITE
    abbreviation.expand.mockImplementation((nome: string) =>
      nome.trim().toUpperCase().startsWith('CR LEITE')
        ? { expanded: 'creme de leite', is_ingredient: true }
        : null,
    );

    const canonical = await service.resolverNomeCanônico('ITALAC CR LEITE 200GR');

    expect(canonical).toBe('creme de leite');
  });
});
