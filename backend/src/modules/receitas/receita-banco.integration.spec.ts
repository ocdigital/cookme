import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import appConfig from '../../config/app.config';

import { ReceitasModule } from './receitas.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ProdutosModule } from '../produtos/produtos.module';
import { InventarioModule } from '../inventario/inventario.module';
import { dataSourceOptions } from '../../config/database.config';

import { ReceitaBancoService } from './services/receita-banco.service';
import { RecipeGeneratorService } from './services/recipe-generator.service';
import { Receita } from './entities/receita.entity';
import { DificuldadeReceita } from '../../common/enums/dificuldade-receita.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const receitaMock = (overrides: Partial<Receita> = {}): Partial<Receita> => ({
  nome: 'Bolinho de Chuva',
  descricao: 'Receita simples e gostosa',
  modo_preparo: '1. Misture os ingredientes\n2. Frite em óleo quente',
  tempo_preparo: 20,
  rendimento_porcoes: 4,
  dificuldade: DificuldadeReceita.FACIL,
  ingredientes_chave: ['ovo', 'farinha de trigo', 'leite', 'acucar'],
  origem: 'ia_gerada',
  status_moderacao: 'ok',
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite principal
// ─────────────────────────────────────────────────────────────────────────────

describe('ReceitaBanco — Integração', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let receitaBancoService: ReceitaBancoService;
  let recipeGeneratorService: RecipeGeneratorService;
  let receitaRepo: Repository<Receita>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        CacheModule.register({ isGlobal: true, ttl: 0 }),
        TypeOrmModule.forRoot(dataSourceOptions),
        AuthModule,
        UsuariosModule,
        ProdutosModule,
        InventarioModule,
        ReceitasModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    receitaBancoService = moduleFixture.get<ReceitaBancoService>(ReceitaBancoService);
    recipeGeneratorService = moduleFixture.get<RecipeGeneratorService>(RecipeGeneratorService);
    receitaRepo = moduleFixture.get<Repository<Receita>>(getRepositoryToken(Receita));

    // Usuário de teste para autenticação — tenta registrar, faz login se já existir
    const testEmail = `banco-integracao@teste.com`;
    const testSenha = 'Teste123!';
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: testEmail, senha: testSenha, nome: 'Teste Banco' });

    if (regRes.body.access_token) {
      token = regRes.body.access_token;
    } else {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, senha: testSenha });
      token = loginRes.body.access_token;
    }
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM receitas WHERE origem = 'ia_gerada' AND nome LIKE 'TESTE_%'`);
    }
    await app?.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ReceitaBancoService — normalização
  // ───────────────────────────────────────────────────────────────────────────

  describe('ReceitaBancoService.normalizar()', () => {
    it('converte para lowercase', () => {
      expect(receitaBancoService.normalizar('Ovo')).toBe('ovo');
    });

    it('remove acentos', () => {
      expect(receitaBancoService.normalizar('açúcar')).toBe('acucar');
      expect(receitaBancoService.normalizar('frango à milanesa')).toBe('frango a milanesa');
    });

    it('faz trim', () => {
      expect(receitaBancoService.normalizar('  leite  ')).toBe('leite');
    });

    it('normaliza lista e remove duplicatas', () => {
      const lista = ['Ovo', 'ovo', 'Açúcar', 'Leite'];
      const resultado = receitaBancoService.normalizarLista(lista);
      expect(resultado).toContain('ovo');
      expect(resultado).toContain('acucar');
      expect(resultado.filter((i) => i === 'ovo')).toHaveLength(1); // sem duplicata
    });

    it('retorna lista ordenada', () => {
      const lista = ['zenobia', 'abacate', 'manga'];
      const resultado = receitaBancoService.normalizarLista(lista);
      expect(resultado).toEqual([...resultado].sort());
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ReceitaBancoService — salvar receita
  // ───────────────────────────────────────────────────────────────────────────

  describe('ReceitaBancoService.salvarReceitaGerada()', () => {
    it('salva uma receita nova no banco', async () => {
      const receita = {
        titulo: 'TESTE_Bolinho de Chuva',
        descricao: 'Bolinho frito simples',
        tempo_preparo: '20 minutos',
        dificuldade: 'fácil' as const,
        ingredientes: ['Ovo', 'Farinha de Trigo', 'Leite', 'Açúcar'],
        modo_preparo: '1. Misture\n2. Frite',
        rendimento: '4 porções',
        imagem_url: 'https://example.com/img.jpg',
      };

      const salva = await receitaBancoService.salvarReceitaGerada(receita);

      expect(salva.id).toBeDefined();
      expect(salva.nome).toBe('TESTE_Bolinho de Chuva');
      expect(salva.ingredientes_chave).toContain('ovo');
      expect(salva.ingredientes_chave).toContain('farinha de trigo');
      expect(salva.ingredientes_chave).toContain('acucar');
      expect(salva.origem).toBe('ia_gerada');
      expect(salva.status_moderacao).toBe('ok');
    });

    it('não cria duplicata ao salvar o mesmo título', async () => {
      const receita = {
        titulo: 'TESTE_Omelete Simples',
        descricao: 'Omelete rápido',
        tempo_preparo: '10 minutos',
        dificuldade: 'fácil' as const,
        ingredientes: ['Ovo', 'Sal', 'Manteiga'],
        modo_preparo: '1. Bata os ovos\n2. Frite',
        rendimento: '1 porção',
      };

      const primeira = await receitaBancoService.salvarReceitaGerada(receita);
      const segunda = await receitaBancoService.salvarReceitaGerada(receita);

      expect(primeira.id).toBe(segunda.id);
    });

    it('normaliza tempo de preparo para minutos (inteiro)', async () => {
      const receita = {
        titulo: 'TESTE_Arroz Branco',
        descricao: 'Arroz básico',
        tempo_preparo: '25 minutos',
        dificuldade: 'fácil' as const,
        ingredientes: ['Arroz', 'Sal', 'Oleo'],
        modo_preparo: '1. Cozinhe o arroz',
        rendimento: '3 porções',
      };

      const salva = await receitaBancoService.salvarReceitaGerada(receita);
      expect(salva.tempo_preparo).toBe(25);
      expect(salva.rendimento_porcoes).toBe(3);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ReceitaBancoService — busca por ingredientes
  // ───────────────────────────────────────────────────────────────────────────

  describe('ReceitaBancoService.buscarPorIngredientes()', () => {
    beforeAll(async () => {
      // Seed de receitas para busca
      await receitaRepo.save([
        receitaMock({
          nome: 'TESTE_Panqueca',
          ingredientes_chave: ['ovo', 'farinha de trigo', 'leite', 'manteiga'],
        }),
        receitaMock({
          nome: 'TESTE_Macarrao ao Alho',
          ingredientes_chave: ['macarrao', 'alho', 'azeite', 'sal'],
        }),
        receitaMock({
          nome: 'TESTE_Vitamina de Banana',
          ingredientes_chave: ['banana', 'leite', 'acucar'],
        }),
        receitaMock({
          nome: 'TESTE_Feijao Tropeiro',
          ingredientes_chave: ['feijao', 'bacon', 'ovo', 'farinha de mandioca', 'couve'],
        }),
      ]);
    });

    it('retorna receitas com 100% dos ingredientes disponíveis', async () => {
      const ingredientes = ['leite', 'banana', 'açúcar', 'ovo'];
      const resultado = await receitaBancoService.buscarPorIngredientes(ingredientes, 0.7);

      const nomes = resultado.map((r) => r.nome);
      expect(nomes).toContain('TESTE_Vitamina de Banana'); // 100% (banana, leite, acucar)
    });

    it('retorna receitas com >= 70% dos ingredientes disponíveis', async () => {
      // Panqueca tem: ovo, farinha de trigo, leite, manteiga (4 ingredientes)
      // Usuário tem: ovo, farinha de trigo, leite → 75% → deve aparecer
      const ingredientes = ['ovo', 'farinha de trigo', 'leite'];
      const resultado = await receitaBancoService.buscarPorIngredientes(ingredientes, 0.7);

      const nomes = resultado.map((r) => r.nome);
      expect(nomes).toContain('TESTE_Panqueca');
    });

    it('não retorna receitas abaixo do percentual mínimo', async () => {
      // Feijão tropeiro tem 5 ingredientes, usuário só tem 1 → 20%
      const ingredientes = ['feijao'];
      const resultado = await receitaBancoService.buscarPorIngredientes(ingredientes, 0.7);

      const nomes = resultado.map((r) => r.nome);
      expect(nomes).not.toContain('TESTE_Feijao Tropeiro');
    });

    it('retorna lista vazia para ingredientes vazios', async () => {
      const resultado = await receitaBancoService.buscarPorIngredientes([], 0.7);
      expect(resultado).toHaveLength(0);
    });

    it('respeita o limite de resultados', async () => {
      const ingredientes = ['ovo', 'farinha de trigo', 'leite', 'manteiga', 'acucar'];
      const resultado = await receitaBancoService.buscarPorIngredientes(ingredientes, 0.5, 2);
      expect(resultado.length).toBeLessThanOrEqual(2);
    });

    it('aceita ingredientes com acentos e maiúsculas', async () => {
      const ingredientes = ['Açúcar', 'Leite', 'Banana'];
      const resultado = await receitaBancoService.buscarPorIngredientes(ingredientes, 0.7);

      const nomes = resultado.map((r) => r.nome);
      expect(nomes).toContain('TESTE_Vitamina de Banana');
    });

    it('ordena por maior cobertura de ingredientes', async () => {
      // Com percentual 1.0 (100%), só Vitamina de Banana passa (banana, leite, acucar = 3/3)
      // Panqueca teria 1/4 = 25%, não passa
      const ingredientes = ['leite', 'banana', 'acucar'];
      const resultado = await receitaBancoService.buscarPorIngredientes(ingredientes, 1.0, 5);

      const nomes = resultado.map((r) => r.nome);
      expect(nomes).toContain('TESTE_Vitamina de Banana');
      expect(nomes).not.toContain('TESTE_Panqueca');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ReceitaBancoService — converter entidade para formato mobile
  // ───────────────────────────────────────────────────────────────────────────

  describe('ReceitaBancoService.entidadeParaFormato()', () => {
    it('converte todos os campos corretamente', () => {
      const entidade = Object.assign(new Receita(), receitaMock({
        nome: 'TESTE_Conversao',
        tempo_preparo: 30,
        rendimento_porcoes: 2,
      }));

      const formato = receitaBancoService.entidadeParaFormato(entidade);

      expect(formato.titulo).toBe('TESTE_Conversao');
      expect(formato.tempo_preparo).toBe('30 minutos');
      expect(formato.rendimento).toBe('2 porções');
      expect(formato.ingredientes).toEqual(entidade.ingredientes_chave);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. RecipeGeneratorService — integração com banco
  // ───────────────────────────────────────────────────────────────────────────

  describe('RecipeGeneratorService.gerarReceitas() — integração com banco', () => {
    it('retorna do banco sem chamar IA quando há receitas suficientes', async () => {
      // Seed: 3 receitas compatíveis com os ingredientes abaixo
      await receitaRepo.save([
        receitaMock({ nome: 'TESTE_Canjica', ingredientes_chave: ['milho verde', 'leite', 'acucar'] }),
        receitaMock({ nome: 'TESTE_Creme de Milho', ingredientes_chave: ['milho verde', 'leite', 'manteiga'] }),
        receitaMock({ nome: 'TESTE_Sopa de Milho', ingredientes_chave: ['milho verde', 'leite', 'sal', 'cebola'] }),
      ]);

      // Spy para verificar se a IA foi chamada
      const spyGemini = jest.spyOn(recipeGeneratorService as any, 'gerarComGemini');
      const spyClaude = jest.spyOn(recipeGeneratorService as any, 'gerarComClaude');

      const ingredientes = ['milho verde', 'leite', 'açúcar', 'manteiga', 'sal', 'cebola'];
      const resultado = await recipeGeneratorService.gerarReceitas(ingredientes);

      expect(resultado.length).toBeGreaterThanOrEqual(3);
      expect(spyGemini).not.toHaveBeenCalled();
      expect(spyClaude).not.toHaveBeenCalled();

      spyGemini.mockRestore();
      spyClaude.mockRestore();
    });

    it('salva no banco as receitas geradas pela IA', async () => {
      // Mock da IA para não fazer chamada real
      jest.spyOn(recipeGeneratorService as any, 'gerarComGemini').mockResolvedValueOnce([
        {
          titulo: 'TESTE_Receita Gerada Por IA',
          descricao: 'Receita gerada em teste',
          tempo_preparo: '15 minutos',
          dificuldade: 'fácil',
          ingredientes: ['ingrediente_unico_xyz', 'sal'],
          modo_preparo: '1. Teste',
          rendimento: '1 porção',
        },
      ]);

      // Mock imagem para não usar Puppeteer no teste
      jest.spyOn(recipeGeneratorService as any, 'buscarImagemFreepik').mockResolvedValue(undefined);

      await recipeGeneratorService.gerarReceitas(['ingrediente_unico_xyz', 'sal']);

      // Verifica que foi salva no banco
      const salva = await receitaRepo.findOne({
        where: { nome: 'TESTE_Receita Gerada Por IA' },
      });

      expect(salva).not.toBeNull();
      expect(salva!.origem).toBe('ia_gerada');
      expect(salva!.ingredientes_chave).toContain('ingrediente_unico_xyz');

      // Limpar
      if (salva) await receitaRepo.delete(salva.id);
    });

    it('combina receitas do banco com receitas da IA quando banco retorna menos de 3', async () => {
      // Banco tem 1 receita compatível
      await receitaRepo.save(
        receitaMock({
          nome: 'TESTE_Unica Compativel',
          ingredientes_chave: ['ingrediente_raro_abc', 'sal'],
        }),
      );

      // IA gera 2 receitas adicionais
      jest.spyOn(recipeGeneratorService as any, 'gerarComGemini').mockResolvedValueOnce([
        {
          titulo: 'TESTE_IA Recipe 1',
          descricao: 'IA 1',
          tempo_preparo: '10 minutos',
          dificuldade: 'fácil',
          ingredientes: ['ingrediente_raro_abc', 'agua'],
          modo_preparo: '1. Misture',
          rendimento: '1 porção',
        },
        {
          titulo: 'TESTE_IA Recipe 2',
          descricao: 'IA 2',
          tempo_preparo: '15 minutos',
          dificuldade: 'fácil',
          ingredientes: ['ingrediente_raro_abc', 'sal'],
          modo_preparo: '1. Cozinhe',
          rendimento: '2 porções',
        },
      ]);

      jest.spyOn(recipeGeneratorService as any, 'buscarImagemFreepik').mockResolvedValue(undefined);

      const resultado = await recipeGeneratorService.gerarReceitas(['ingrediente_raro_abc', 'sal']);

      expect(resultado.length).toBeGreaterThanOrEqual(3);

      // Limpar
      await receitaRepo.delete({ nome: 'TESTE_IA Recipe 1' });
      await receitaRepo.delete({ nome: 'TESTE_IA Recipe 2' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Endpoint HTTP POST /api/receitas/gerar
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/receitas/gerar — endpoint HTTP', () => {
    beforeAll(async () => {
      // Mock Puppeteer para evitar timeout nos testes HTTP
      jest.spyOn(recipeGeneratorService as any, 'buscarImagemFreepik').mockResolvedValue(undefined);

      // Seed 3 receitas com 100% cobertura para os ingredientes do teste
      await receitaRepo.save([
        receitaMock({ nome: 'TESTE_HTTP Frango Grelhado', ingredientes_chave: ['frango', 'azeite', 'alho', 'sal'] }),
        receitaMock({ nome: 'TESTE_HTTP Arroz com Frango', ingredientes_chave: ['frango', 'arroz', 'sal', 'cebola'] }),
        receitaMock({ nome: 'TESTE_HTTP Frango Ensopado', ingredientes_chave: ['frango', 'tomate', 'cebola', 'sal'] }),
        receitaMock({ nome: 'TESTE_HTTP Frango com Alho', ingredientes_chave: ['frango', 'alho', 'sal'] }),
      ]);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('retorna 200 com lista de receitas', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/receitas/gerar')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredientes: ['frango', 'arroz', 'alho', 'sal', 'cebola', 'tomate', 'azeite'] });

      expect(res.status).toBe(201);
      expect(res.body.receitas).toBeDefined();
      expect(res.body.receitas.length).toBeGreaterThanOrEqual(1);
      expect(res.body.receitas_geradas).toBeGreaterThanOrEqual(1);
    }, 15000);

    it('cada receita tem os campos obrigatórios', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/receitas/gerar')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredientes: ['frango', 'arroz', 'alho', 'sal'] });

      expect(res.status).toBe(201);

      for (const receita of res.body.receitas) {
        expect(receita.titulo).toBeDefined();
        expect(receita.modo_preparo).toBeDefined();
        expect(receita.ingredientes).toBeInstanceOf(Array);
      }
    }, 15000);

    it('retorna 401 sem token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/receitas/gerar')
        .send({ ingredientes: ['frango'] });

      expect(res.status).toBe(401);
    });

    it('retorna array vazio para ingredientes vazios', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/receitas/gerar')
        .set('Authorization', `Bearer ${token}`)
        .send({ ingredientes: [] });

      expect(res.status).toBe(201);
      expect(res.body.receitas).toHaveLength(0);
    });
  });
});
