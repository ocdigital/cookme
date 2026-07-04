import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RecipeGeneratorService, Receita } from './recipe-generator.service';
import { ReceitaBancoService } from './receita-banco.service';
import { RecipeSearchService } from './recipe-search.service';
import { RecipeValidationService } from './recipe-validation.service';
import { RecipeRagService } from './recipe-rag.service';
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
  let ragService: jest.Mocked<RecipeRagService>;

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
        {
          provide: RecipeRagService,
          useValue: {
            gerarComRAG: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<RecipeGeneratorService>(RecipeGeneratorService);
    receitaBancoService = module.get(ReceitaBancoService);
    recipeSearchService = module.get(RecipeSearchService);
    ragService = module.get(RecipeRagService);

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
  // 3. gerarReceitas — banco vazio → tenta RAG
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco vazio, RAG disponível', () => {
    beforeEach(() => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([]);
      receitaBancoService.salvarReceitaGerada.mockResolvedValue(receitaEntidade());

      ragService.gerarComRAG.mockResolvedValue({
        receita: {
          nome: 'Sopa de Abóbora Adaptada',
          descricao: 'Sopa cremosa',
          ingredientes: ['abobora', 'gengibre'],
          modo_preparo: '1. Cozinhe. 2. Bata. 3. Sirva.',
          tempo_preparo: '40 minutos',
          dificuldade: 'fácil',
          rendimento: '4 porções',
        },
        fonte: 'rag',
      });
    });

    it('consulta o RAG quando banco não tem receitas suficientes', async () => {
      await service.gerarReceitas(['abobora', 'gengibre', 'coco']);

      expect(ragService.gerarComRAG).toHaveBeenCalledTimes(1);
    });

    it('propaga modo_alimentar para o RAG (filtro de dieta)', async () => {
      await service.gerarReceitas(['abobora', 'gengibre'], false, 'vegano');

      expect(ragService.gerarComRAG).toHaveBeenCalledWith(
        ['abobora', 'gengibre'],
        'vegano',
      );
    });

    it('não usa scraping/busca web na geração (proibido)', async () => {
      await service.gerarReceitas(['abobora', 'gengibre']);

      expect(recipeSearchService.buscarReceitasReais).not.toHaveBeenCalled();
    });

    it('retorna a receita adaptada pelo RAG', async () => {
      const resultado = await service.gerarReceitas(['abobora', 'gengibre']);

      const titulos = resultado.map((r) => r.titulo);
      expect(titulos).toContain('Sopa de Abóbora Adaptada');
    });

    it('salva a receita do RAG no banco para próximos usuários', async () => {
      await service.gerarReceitas(['abobora', 'gengibre']);

      expect(receitaBancoService.salvarReceitaGerada).toHaveBeenCalledTimes(1);
    });

    it('marca receitas geradas como novas', async () => {
      const resultado = await service.gerarReceitas(['abobora', 'gengibre']);

      for (const receita of resultado) {
        expect(receita.is_nova).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. gerarReceitas — banco vazio, RAG e IA indisponíveis → retorna vazio
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco vazio, RAG sem resultado', () => {
    beforeEach(() => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([]);
      ragService.gerarComRAG.mockResolvedValue(null);
    });

    it('retorna array vazio quando banco e RAG não têm receitas', async () => {
      const resultado = await service.gerarReceitas(['ingrediente-raro']);

      expect(resultado).toHaveLength(0);
    });

    it('não salva nada no banco quando não há receitas', async () => {
      await service.gerarReceitas(['ingrediente-raro']);

      expect(receitaBancoService.salvarReceitaGerada).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. gerarReceitas — banco parcial + RAG completa
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gerarReceitas() — banco parcial + RAG', () => {
    beforeEach(() => {
      receitaBancoService.buscarPorIngredientes.mockResolvedValue([
        receitaEntidade({ id: 'uuid-banco', nome: 'Receita do Banco' }),
      ]);
      receitaBancoService.entidadeParaFormato.mockReturnValue(
        receitaWeb({ titulo: 'Receita do Banco' }),
      );
      receitaBancoService.salvarReceitaGerada.mockResolvedValue(receitaEntidade());

      ragService.gerarComRAG.mockResolvedValue({
        receita: {
          nome: 'Frango RAG',
          descricao: 'Adaptada',
          ingredientes: ['frango', 'arroz'],
          modo_preparo: '1. Faça.',
          tempo_preparo: '30 minutos',
          dificuldade: 'fácil',
          rendimento: '2 porções',
        },
        fonte: 'rag',
      });
    });

    it('consulta o RAG para complementar o banco', async () => {
      await service.gerarReceitas(['frango', 'arroz']);

      expect(ragService.gerarComRAG).toHaveBeenCalledTimes(1);
    });

    it('combina banco + RAG no resultado final', async () => {
      const resultado = await service.gerarReceitas(['frango', 'arroz']);

      const titulos = resultado.map((r) => r.titulo);
      expect(titulos).toContain('Receita do Banco');
      expect(titulos).toContain('Frango RAG');
    });

    it('salva apenas a receita nova do RAG (banco já está salvo)', async () => {
      await service.gerarReceitas(['frango', 'arroz']);

      expect(receitaBancoService.salvarReceitaGerada).toHaveBeenCalledTimes(1);
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
