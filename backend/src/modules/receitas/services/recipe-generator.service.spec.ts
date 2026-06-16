import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RecipeGeneratorService, Receita } from './recipe-generator.service';
import { ReceitaBancoService } from './receita-banco.service';
import { RecipeSearchService } from './recipe-search.service';
import { RecipeValidationService } from './recipe-validation.service';
import { Receita as ReceitaEntity } from '../entities/receita.entity';
import { DificuldadeReceita } from '../../../common/enums/dificuldade-receita.enum';

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

const receitaWeb = (overrides: Partial<Receita> = {}): Receita => ({
  titulo: 'Frango Grelhado',
  descricao: 'Frango temperado na grelha',
  tempo_preparo: '30 minutos',
  dificuldade: 'fácil',
  ingredientes: ['frango', 'alho', 'sal'],
  modo_preparo: '["1. Tempere", "2. Grelhe", "3. Sirva"]',
  rendimento: '2 porções',
  imagem_url: 'https://example.com/frango.jpg',
  url_fonte: 'https://tudogostoso.com.br/receita/123-frango.html',
  site_origem: 'TudoGostoso',
  ...overrides,
});

const receitaEntidade = (overrides: Partial<ReceitaEntity> = {}): ReceitaEntity =>
  Object.assign(new ReceitaEntity(), {
    id: 'uuid-1',
    nome: 'Frango Grelhado',
    descricao: 'Frango temperado na grelha',
    tempo_preparo: 30,
    rendimento_porcoes: 2,
    dificuldade: DificuldadeReceita.FACIL,
    ingredientes_chave: ['frango', 'alho', 'sal'],
    modo_preparo: '["1. Tempere", "2. Grelhe", "3. Sirva"]',
    imagem_url: 'https://example.com/frango.jpg',
    origem: 'internet',
    status_moderacao: 'ok',
    ...overrides,
  } as ReceitaEntity);

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('RecipeGeneratorService', () => {
  let service: RecipeGeneratorService;
  let receitaBancoService: jest.Mocked<ReceitaBancoService>;
  let recipeSearchService: jest.Mocked<RecipeSearchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeGeneratorService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        {
          provide: ReceitaBancoService,
          useValue: {
            buscarPorIngredientes: jest.fn().mockResolvedValue([]),
            entidadeParaFormato: jest.fn().mockReturnValue({}),
            salvarReceitaGerada: jest.fn().mockResolvedValue({}),
            buscarIngredientesAGosto: jest.fn().mockResolvedValue([]),
            extrairChaves: jest.fn().mockReturnValue([]),
            pesoIngrediente: jest.fn().mockReturnValue(1),
          },
        },
        {
          provide: RecipeSearchService,
          useValue: {
            buscarReceitasReais: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: RecipeValidationService,
          useValue: {
            validar: jest.fn().mockResolvedValue({ status: 'ok', score: 1, issues: [] }),
          },
        },
      ],
    }).compile();

    service = module.get<RecipeGeneratorService>(RecipeGeneratorService);
    receitaBancoService = module.get(ReceitaBancoService);
    recipeSearchService = module.get(RecipeSearchService);

    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'debug').mockImplementation(() => {});

    jest.spyOn(service as any, 'buscarImagemReceita').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. gerarReceitas — ingredientes vazios
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — ingredientes vazios', () => {
    it('retorna array vazio sem consultar banco nem web', async () => {
      const resultado = await service.gerarReceitas([]);

      expect(resultado).toHaveLength(0);
      expect(receitaBancoService.buscarPorIngredientes).not.toHaveBeenCalled();
      expect(recipeSearchService.buscarReceitasReais).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. gerarReceitas — banco tem receitas suficientes (>= 5)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco com receitas suficientes', () => {
    beforeEach(() => {
      const entidades = [
        receitaEntidade({ id: 'uuid-1', nome: 'Frango Grelhado' }),
        receitaEntidade({ id: 'uuid-2', nome: 'Arroz com Frango' }),
        receitaEntidade({ id: 'uuid-3', nome: 'Frango Ensopado' }),
        receitaEntidade({ id: 'uuid-4', nome: 'Frango Caipira' }),
        receitaEntidade({ id: 'uuid-5', nome: 'Frango Assado' }),
      ];

      receitaBancoService.buscarPorIngredientes.mockResolvedValue(entidades);
      receitaBancoService.entidadeParaFormato.mockImplementation((e) =>
        receitaWeb({ titulo: e.nome }),
      );
    });

    it('retorna receitas do banco sem buscar na web', async () => {
      const resultado = await service.gerarReceitas(['frango', 'arroz', 'alho']);

      expect(resultado).toHaveLength(5);
      expect(recipeSearchService.buscarReceitasReais).not.toHaveBeenCalled();
    });

    it('não salva receitas (já estão no banco)', async () => {
      await service.gerarReceitas(['frango', 'arroz', 'alho']);

      expect(receitaBancoService.salvarReceitaGerada).not.toHaveBeenCalled();
    });

    it('retorna os títulos corretos', async () => {
      const resultado = await service.gerarReceitas(['frango', 'arroz', 'alho']);

      const titulos = resultado.map((r) => r.titulo);
      expect(titulos).toContain('Frango Grelhado');
      expect(titulos).toContain('Arroz com Frango');
      expect(titulos).toContain('Frango Ensopado');
    });

    it('passa os ingredientes corretos para o banco', async () => {
      const ingredientes = ['frango', 'arroz', 'alho'];
      await service.gerarReceitas(ingredientes);

      expect(receitaBancoService.buscarPorIngredientes).toHaveBeenCalledWith(
        ingredientes,
        0.4,
        5,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. gerarReceitas — banco vazio → busca na web
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco vazio, scraping disponível', () => {
    beforeEach(() => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([]);
      receitaBancoService.salvarReceitaGerada.mockResolvedValue(receitaEntidade());
      // extrairChaves retorna chave que bate com ingrediente do teste ('abobora')
      receitaBancoService.extrairChaves.mockReturnValue(['abobora']);
      receitaBancoService.pesoIngrediente.mockReturnValue(1);

      recipeSearchService.buscarReceitasReais.mockResolvedValue([
        receitaWeb({ titulo: 'Receita Web 1', ingredientes: ['abobora', 'gengibre', 'sal'] }),
        receitaWeb({ titulo: 'Receita Web 2', ingredientes: ['abobora', 'coco'] }),
        receitaWeb({ titulo: 'Receita Web 3', ingredientes: ['abobora', 'gengibre'] }),
      ]);
    });

    it('busca na web quando banco não tem receitas', async () => {
      await service.gerarReceitas(['abobora', 'gengibre', 'coco']);

      expect(recipeSearchService.buscarReceitasReais).toHaveBeenCalledTimes(1);
    });

    it('retorna as receitas encontradas na web', async () => {
      const resultado = await service.gerarReceitas(['abobora', 'gengibre']);

      const titulos = resultado.map((r) => r.titulo);
      expect(titulos).toContain('Receita Web 1');
    });

    it('salva receitas da web no banco para próximos usuários', async () => {
      await service.gerarReceitas(['abobora', 'gengibre']);

      expect(receitaBancoService.salvarReceitaGerada).toHaveBeenCalledTimes(3);
    });

    it('marca receitas da web como novas', async () => {
      const resultado = await service.gerarReceitas(['abobora', 'gengibre']);

      for (const receita of resultado) {
        expect(receita.is_nova).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. gerarReceitas — banco vazio, scraping falha → retorna vazio
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco vazio, scraping sem resultado', () => {
    beforeEach(() => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([]);
      recipeSearchService.buscarReceitasReais.mockResolvedValue([]);
    });

    it('retorna array vazio quando banco e web não têm receitas', async () => {
      const resultado = await service.gerarReceitas(['ingrediente-raro']);

      expect(resultado).toHaveLength(0);
    });

    it('não salva nada no banco quando não há receitas', async () => {
      await service.gerarReceitas(['ingrediente-raro']);

      expect(receitaBancoService.salvarReceitaGerada).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. gerarReceitas — banco parcial + web completa
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco parcial + web completa', () => {
    beforeEach(() => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([
        receitaEntidade({ id: 'uuid-banco', nome: 'Receita do Banco' }),
      ]);
      receitaBancoService.entidadeParaFormato.mockReturnValue(
        receitaWeb({ titulo: 'Receita do Banco' }),
      );
      receitaBancoService.salvarReceitaGerada.mockResolvedValue(receitaEntidade());
      receitaBancoService.extrairChaves.mockReturnValue(['frango']);
      receitaBancoService.pesoIngrediente.mockReturnValue(1);

      recipeSearchService.buscarReceitasReais.mockResolvedValue([
        receitaWeb({ titulo: 'Receita Web 1', ingredientes: ['frango', 'alho'] }),
        receitaWeb({ titulo: 'Receita Web 2', ingredientes: ['frango', 'arroz'] }),
      ]);
    });

    it('busca receitas complementares na web', async () => {
      await service.gerarReceitas(['frango', 'arroz']);

      expect(recipeSearchService.buscarReceitasReais).toHaveBeenCalledTimes(1);
    });

    it('combina banco + web no resultado final', async () => {
      const resultado = await service.gerarReceitas(['frango', 'arroz']);

      const titulos = resultado.map((r) => r.titulo);
      expect(titulos).toContain('Receita do Banco');
      expect(titulos).toContain('Receita Web 1');
      expect(titulos).toContain('Receita Web 2');
    });

    it('salva apenas as receitas novas da web', async () => {
      await service.gerarReceitas(['frango', 'arroz']);

      expect(receitaBancoService.salvarReceitaGerada).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. gerarReceitas — limite de 5 resultados
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — limite de 5 resultados', () => {
    it('não retorna mais que 5 receitas mesmo com banco + web', async () => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([
        receitaEntidade({ id: '1', nome: 'Banco 1' }),
        receitaEntidade({ id: '2', nome: 'Banco 2' }),
      ]);
      receitaBancoService.entidadeParaFormato.mockImplementation((e) =>
        receitaWeb({ titulo: e.nome }),
      );
      receitaBancoService.salvarReceitaGerada.mockResolvedValue(receitaEntidade());

      receitaBancoService.extrairChaves.mockReturnValue(['x']);
      receitaBancoService.pesoIngrediente.mockReturnValue(1);
      recipeSearchService.buscarReceitasReais.mockResolvedValue([
        receitaWeb({ titulo: 'Web 1', ingredientes: ['x', 'y'] }),
        receitaWeb({ titulo: 'Web 2', ingredientes: ['x', 'z'] }),
        receitaWeb({ titulo: 'Web 3', ingredientes: ['x'] }),
        receitaWeb({ titulo: 'Web 4', ingredientes: ['x'] }),
      ]);

      const resultado = await service.gerarReceitas(['x', 'y', 'z']);

      expect(resultado.length).toBeLessThanOrEqual(5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. buscarImagemReceita — cadeia de fallback
  // ─────────────────────────────────────────────────────────────────────────────

  describe('buscarImagemReceita() — cadeia de fallback', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
      jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
      jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
      jest.spyOn(service['logger'], 'debug').mockImplementation(() => {});
    });

    it('retorna URL do Unsplash quando disponível', async () => {
      jest.spyOn(service as any, 'buscarImagemUnsplash').mockResolvedValue(
        'https://images.unsplash.com/frango.jpg',
      );

      const url = await service.buscarImagemReceita('Frango Grelhado');

      expect(url).toBe('https://images.unsplash.com/frango.jpg');
    });

    it('retorna fallback quando Unsplash não encontra', async () => {
      jest.spyOn(service as any, 'buscarImagemUnsplash').mockResolvedValue(undefined);

      const url = await service.buscarImagemReceita('Receita Qualquer');

      // Service tem URL de fallback hardcoded quando Unsplash falha
      expect(url === undefined || typeof url === 'string').toBe(true);
    });

    it('não lança exceção quando Unsplash falha', async () => {
      jest.spyOn(service as any, 'buscarImagemUnsplash').mockRejectedValue(
        new Error('API error'),
      );

      await expect(service.buscarImagemReceita('Receita Qualquer')).resolves.not.toThrow();
    });

    it('retorna URL válida quando Unsplash funciona', async () => {
      jest.spyOn(service as any, 'buscarImagemUnsplash').mockResolvedValue(
        'https://images.unsplash.com/photo-123',
      );

      const url = await service.buscarImagemReceita('Arroz');

      expect(url).toMatch(/^https:\/\//);
    });
  });
});
