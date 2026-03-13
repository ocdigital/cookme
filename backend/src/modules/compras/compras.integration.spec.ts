import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprasModule } from './compras.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ProdutosModule } from '../produtos/produtos.module';
import { InventarioModule } from '../inventario/inventario.module';
import { ReceitasModule } from '../receitas/receitas.module';
import { dataSourceOptions } from '../../config/database.config';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

describe('Compras Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;
  let usuarioId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        ComprasModule,
        AuthModule,
        UsuariosModule,
        ProdutosModule,
        InventarioModule,
        ReceitasModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Criar usuário de teste
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test-ocr@test.com',
        senha: 'Test123!',
        nome: 'Test OCR',
      });

    token = registerRes.body.access_token;
    usuarioId = registerRes.body.user.id;

    console.log('Token gerado:', token);
    console.log('Usuário criado:', usuarioId);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('TRUNCATE TABLE inventario CASCADE');
      await dataSource.query('TRUNCATE TABLE produtos CASCADE');
    }
    await app.close();
  });

  describe('POST /api/compras/ocr-cupom/salvar-itens', () => {
    it('deve salvar itens extraídos do cupom no inventário', async () => {
      const itens = [
        {
          nome: 'Frango Peito 1kg',
          quantidade: 2,
          valor: 25.99,
          codigo_barras: '7898765432109',
        },
        {
          nome: 'Arroz Integral 5kg',
          quantidade: 1,
          valor: 18.50,
          codigo_barras: '7891234567890',
        },
        {
          nome: 'Feijão Carioca 1kg',
          quantidade: 3,
          valor: 8.99,
        },
      ];

      const response = await request(app.getHttpServer())
        .post('/api/compras/ocr-cupom/salvar-itens')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itens,
          estabelecimento: {
            nome: 'Supermercado Teste',
          },
        });

      console.log('Response:', response.body);

      expect(response.status).toBe(201);
      expect(response.body.total).toBe(3);
      expect(response.body.salvos).toBeGreaterThan(0);
      expect(Array.isArray(response.body.itens)).toBe(true);

      // Verificar se itens foram salvos no BD
      if (response.body.salvos > 0) {
        const inventario = await dataSource.query(
          'SELECT * FROM inventario WHERE usuario_id = $1',
          [usuarioId],
        );

        expect(inventario.length).toBe(response.body.salvos);
        console.log('Itens salvos no inventário:', inventario.length);
      }
    });

    it('deve criar produtos automaticamente se não existirem', async () => {
      const itens = [
        {
          nome: 'Produto Novo Único',
          quantidade: 1,
          valor: 19.99,
          codigo_barras: '9999999999999',
        },
      ];

      const produtosAntes = await dataSource.query(
        'SELECT COUNT(*) FROM produtos WHERE nome = $1',
        ['Produto Novo Único'],
      );

      expect(parseInt(produtosAntes[0].count)).toBe(0);

      const response = await request(app.getHttpServer())
        .post('/api/compras/ocr-cupom/salvar-itens')
        .set('Authorization', `Bearer ${token}`)
        .send({ itens });

      expect(response.status).toBe(201);

      const produtosDepois = await dataSource.query(
        'SELECT COUNT(*) FROM produtos WHERE nome = $1',
        ['Produto Novo Único'],
      );

      expect(parseInt(produtosDepois[0].count)).toBe(1);
      console.log('✓ Produto criado automaticamente');
    });

    it('deve rejeitar requisição sem itens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/compras/ocr-cupom/salvar-itens')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itens: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('item');
      console.log('✓ Rejeição correta para itens vazios');
    });

    it('deve rejeitar requisição sem autenticação', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/compras/ocr-cupom/salvar-itens')
        .send({
          itens: [{ nome: 'Teste', quantidade: 1 }],
        });

      expect(response.status).toBe(401);
      console.log('✓ Rejeição correta sem token');
    });

    it('deve retornar itens com valores salvos corretamente', async () => {
      const itens = [
        {
          nome: 'Leite Integral 1L',
          quantidade: 2,
          valor: 4.50,
        },
      ];

      const response = await request(app.getHttpServer())
        .post('/api/compras/ocr-cupom/salvar-itens')
        .set('Authorization', `Bearer ${token}`)
        .send({ itens });

      expect(response.status).toBe(201);
      expect(response.body.itens).toBeDefined();

      const inventario = response.body.itens[0];
      expect(inventario.quantidade_disponivel).toBe(2);
      expect(inventario.metodo_atualizacao).toBe('ocr_nota');
      expect(inventario.usuario_id).toBe(usuarioId);
      console.log('✓ Valores salvos corretamente');
    });
  });
});
