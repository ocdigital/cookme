/**
 * Seed de usuários de teste com ingredientes e preferências
 * Run with: npx ts-node -r tsconfig-paths/register src/database/seeds/seed-usuarios-teste.ts
 */
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
});

const USUARIOS = [
  {
    email: 'joao@cookme.test',
    nome: 'João Silva',
    modo_alimentar: 'normal',
    ingredientes: [
      { nome: 'Frango', qtd: 1.5, unidade: 'kg' },
      { nome: 'Arroz', qtd: 2, unidade: 'kg' },
      { nome: 'Feijão', qtd: 1, unidade: 'kg' },
      { nome: 'Cebola', qtd: 5, unidade: 'un' },
      { nome: 'Alho', qtd: 1, unidade: 'un' },
      { nome: 'Tomate', qtd: 4, unidade: 'un' },
      { nome: 'Batata', qtd: 1, unidade: 'kg' },
      { nome: 'Cenoura', qtd: 3, unidade: 'un' },
      { nome: 'Ovo', qtd: 12, unidade: 'un' },
      { nome: 'Azeite', qtd: 500, unidade: 'ml' },
    ],
  },
  {
    email: 'ana@cookme.test',
    nome: 'Ana Fitness',
    modo_alimentar: 'fitness',
    ingredientes: [
      { nome: 'Frango', qtd: 2, unidade: 'kg' },
      { nome: 'Batata Doce', qtd: 1, unidade: 'kg' },
      { nome: 'Brócolis', qtd: 500, unidade: 'g' },
      { nome: 'Ovo', qtd: 18, unidade: 'un' },
      { nome: 'Aveia', qtd: 500, unidade: 'g' },
      { nome: 'Whey Protein', qtd: 900, unidade: 'g' },
      { nome: 'Banana', qtd: 6, unidade: 'un' },
      { nome: 'Azeite', qtd: 250, unidade: 'ml' },
      { nome: 'Peixe', qtd: 500, unidade: 'g' },
      { nome: 'Quinoa', qtd: 500, unidade: 'g' },
    ],
  },
  {
    email: 'carlos@cookme.test',
    nome: 'Carlos Vegetariano',
    modo_alimentar: 'vegetariano',
    ingredientes: [
      { nome: 'Tofu', qtd: 400, unidade: 'g' },
      { nome: 'Feijão', qtd: 1, unidade: 'kg' },
      { nome: 'Lentilha', qtd: 500, unidade: 'g' },
      { nome: 'Grão de Bico', qtd: 500, unidade: 'g' },
      { nome: 'Espinafre', qtd: 300, unidade: 'g' },
      { nome: 'Queijo Minas', qtd: 400, unidade: 'g' },
      { nome: 'Ovo', qtd: 12, unidade: 'un' },
      { nome: 'Arroz Integral', qtd: 1, unidade: 'kg' },
      { nome: 'Abobrinha', qtd: 3, unidade: 'un' },
      { nome: 'Cogumelo', qtd: 200, unidade: 'g' },
    ],
  },
  {
    email: 'maria@cookme.test',
    nome: 'Maria Vegana',
    modo_alimentar: 'vegano',
    ingredientes: [
      { nome: 'Feijão Preto', qtd: 1, unidade: 'kg' },
      { nome: 'Lentilha', qtd: 500, unidade: 'g' },
      { nome: 'Grão de Bico', qtd: 500, unidade: 'g' },
      { nome: 'Aveia', qtd: 500, unidade: 'g' },
      { nome: 'Banana', qtd: 8, unidade: 'un' },
      { nome: 'Maçã', qtd: 6, unidade: 'un' },
      { nome: 'Tomate', qtd: 4, unidade: 'un' },
      { nome: 'Cenoura', qtd: 4, unidade: 'un' },
      { nome: 'Arroz Integral', qtd: 1, unidade: 'kg' },
      { nome: 'Leite de Coco', qtd: 2, unidade: 'un' },
    ],
  },
  {
    email: 'pedro@cookme.test',
    nome: 'Pedro Normal',
    modo_alimentar: 'normal',
    ingredientes: [
      { nome: 'Carne Bovina', qtd: 1, unidade: 'kg' },
      { nome: 'Frango', qtd: 1, unidade: 'kg' },
      { nome: 'Arroz', qtd: 2, unidade: 'kg' },
      { nome: 'Feijão', qtd: 1, unidade: 'kg' },
      { nome: 'Macarrão', qtd: 500, unidade: 'g' },
      { nome: 'Molho de Tomate', qtd: 2, unidade: 'un' },
      { nome: 'Cebola', qtd: 4, unidade: 'un' },
      { nome: 'Alho', qtd: 1, unidade: 'un' },
      { nome: 'Queijo Parmesão', qtd: 200, unidade: 'g' },
      { nome: 'Manteiga', qtd: 200, unidade: 'g' },
    ],
  },
];

async function seed() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco');

    const senha = await bcrypt.hash('cookme123', 10);

    for (const u of USUARIOS) {
      // Verifica se já existe
      const exists = await client.query('SELECT id FROM usuarios WHERE email = $1', [u.email]);
      let userId: string;

      if (exists.rows.length > 0) {
        userId = exists.rows[0].id;
        console.log(`⏭  Usuário ${u.email} já existe (${userId})`);
      } else {
        const userResult = await client.query(
          `INSERT INTO usuarios (email, nome, senha_hash, email_verificado, role)
           VALUES ($1, $2, $3, true, 'user')
           RETURNING id`,
          [u.email, u.nome, senha],
        );
        userId = userResult.rows[0].id;
        console.log(`✓ Usuário ${u.nome} criado (${userId})`);
      }

      // Preferências
      await client.query(
        `INSERT INTO preferencias (usuario_id, modo_alimentar, refeicoes_planejamento)
         VALUES ($1, $2, 'almoco_jantar')
         ON CONFLICT (usuario_id) DO UPDATE SET modo_alimentar = $2`,
        [userId, u.modo_alimentar],
      );
      console.log(`  ✓ Preferência modo_alimentar=${u.modo_alimentar}`);

      // Inventário — busca ou cria produtos e insere no inventário
      for (const ing of u.ingredientes) {
        // Busca produto pelo nome (match parcial)
        const prod = await client.query(
          `SELECT id FROM produtos WHERE nome ILIKE $1 LIMIT 1`,
          [`%${ing.nome}%`],
        );

        let produtoId: string;
        if (prod.rows.length > 0) {
          produtoId = prod.rows[0].id;
        } else {
          // Cria produto básico
          const newProd = await client.query(
            `INSERT INTO produtos (nome, unidade_padrao, ingrediente_receita)
             VALUES ($1, $2, true)
             RETURNING id`,
            [ing.nome, ing.unidade],
          );
          produtoId = newProd.rows[0].id;
        }

        // Verifica se já tem no inventário
        const invExists = await client.query(
          `SELECT id FROM inventario WHERE usuario_id = $1 AND produto_id = $2`,
          [userId, produtoId],
        );

        if (invExists.rows.length === 0) {
          await client.query(
            `INSERT INTO inventario (usuario_id, produto_id, quantidade_disponivel, unidade, metodo_atualizacao)
             VALUES ($1, $2, $3, $4, 'manual')`,
            [userId, produtoId, ing.qtd, ing.unidade],
          );
        }
      }
      console.log(`  ✓ ${u.ingredientes.length} ingredientes no inventário`);
    }

    console.log('\n✅ Seed de usuários de teste concluído!');
    console.log('Usuários criados com senha: cookme123');
    console.log(USUARIOS.map(u => `  - ${u.email} (modo: ${u.modo_alimentar})`).join('\n'));

  } catch (err: any) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
