/**
 * Script de Seed - Dados de Teste para Integração Mobile
 * Executa diretamente com Node.js sem dependência de TypeORM
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🔄 Iniciando seed de dados de teste...\n');

    // 1. INSERIR CATEGORIAS
    console.log('📂 Inserindo 5 categorias...');
    await client.query(`
      INSERT INTO categorias (id, nome, descricao, icone, is_food, criado_em)
      VALUES
        (gen_random_uuid(), 'Grãos e Cereais', 'Arroz, feijão, macarrão e outros grãos', '🌾', true, NOW()),
        (gen_random_uuid(), 'Carnes e Peixes', 'Frango, bife, peixe e outros', '🍗', true, NOW()),
        (gen_random_uuid(), 'Laticínios', 'Leite, queijo, iogurte', '🧀', true, NOW()),
        (gen_random_uuid(), 'Frutas e Vegetais', 'Frutas frescas e legumes', '🥗', true, NOW()),
        (gen_random_uuid(), 'Condimentos', 'Sal, pimenta, açúcar e temperos', '🧂', true, NOW())
    `);
    console.log('✅ Categorias inseridas\n');

    // 2. INSERIR PRODUTOS
    console.log('🛒 Inserindo 8 produtos...');

    const produtos = [
      {
        nome: 'Arroz Integral',
        descricao: 'Arroz integral de alta qualidade',
        codigo_barras: '7891234567890',
        categoria: 'Grãos e Cereais',
        unidade: 'kg',
        dias_validade: 730,
        imagem: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
        tags: ['vegetariano', 'gluten-free'],
        nutricao: { calorias: 111, proteinas: 2.6, carboidratos: 24.3, gorduras: 0.9 },
      },
      {
        nome: 'Frango Peito',
        descricao: 'Peito de frango fresco',
        codigo_barras: '7891234567891',
        categoria: 'Carnes e Peixes',
        unidade: 'kg',
        dias_validade: 3,
        imagem: 'https://images.unsplash.com/photo-1633203777956-8f6530120795?w=200&h=200&fit=crop',
        tags: ['proteina-alta'],
        nutricao: { calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6 },
      },
      {
        nome: 'Queijo Meia Cura',
        descricao: 'Queijo fresco de qualidade premium',
        codigo_barras: '7891234567892',
        categoria: 'Laticínios',
        unidade: 'kg',
        dias_validade: 30,
        imagem: 'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=200&h=200&fit=crop',
        tags: ['vegetariano'],
        nutricao: { calorias: 402, proteinas: 25, carboidratos: 1.3, gorduras: 33 },
      },
      {
        nome: 'Tomate Caqui',
        descricao: 'Tomates frescos e saudáveis',
        codigo_barras: '7891234567893',
        categoria: 'Frutas e Vegetais',
        unidade: 'kg',
        dias_validade: 7,
        imagem: 'https://images.unsplash.com/photo-1583502282127-d0b88c4a5a7f?w=200&h=200&fit=crop',
        tags: ['vegetariano', 'vegan', 'low-carb'],
        nutricao: { calorias: 18, proteinas: 0.9, carboidratos: 3.9, gorduras: 0.2 },
      },
      {
        nome: 'Alface Crespa',
        descricao: 'Alface fresca para saladas',
        codigo_barras: '7891234567894',
        categoria: 'Frutas e Vegetais',
        unidade: 'un',
        dias_validade: 5,
        imagem: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
        tags: ['vegetariano', 'vegan', 'low-carb'],
        nutricao: { calorias: 15, proteinas: 1.2, carboidratos: 2.9, gorduras: 0.1 },
      },
      {
        nome: 'Leite Integral',
        descricao: 'Leite integral fresco',
        codigo_barras: '7891234567895',
        categoria: 'Laticínios',
        unidade: 'l',
        dias_validade: 7,
        imagem: 'https://images.unsplash.com/photo-1550583724-b2692f2a4c4b?w=200&h=200&fit=crop',
        tags: ['vegetariano'],
        nutricao: { calorias: 61, proteinas: 3.2, carboidratos: 4.8, gorduras: 3.3 },
      },
      {
        nome: 'Ovos Brancos',
        descricao: 'Ovos frescos de galinha',
        codigo_barras: '7891234567896',
        categoria: 'Carnes e Peixes',
        unidade: 'un',
        dias_validade: 21,
        imagem: 'https://images.unsplash.com/photo-1585985351026-38bbd3b2c9e2?w=200&h=200&fit=crop',
        tags: ['vegetariano', 'proteina-alta'],
        nutricao: { calorias: 155, proteinas: 13, carboidratos: 1.1, gorduras: 11 },
      },
      {
        nome: 'Iogurte Grego',
        descricao: 'Iogurte grego probiótico',
        codigo_barras: '7891234567897',
        categoria: 'Laticínios',
        unidade: 'un',
        dias_validade: 14,
        imagem: 'https://images.unsplash.com/photo-1488477181946-6b0b18676feb?w=200&h=200&fit=crop',
        tags: ['vegetariano'],
        nutricao: { calorias: 59, proteinas: 10, carboidratos: 3.3, gorduras: 0.4 },
      },
    ];

    // Obter IDs das categorias
    const catResult = await client.query(`
      SELECT id, nome FROM categorias WHERE nome IN (
        'Grãos e Cereais', 'Carnes e Peixes', 'Laticínios', 'Frutas e Vegetais'
      )
    `);
    const categoriaMap = {};
    catResult.rows.forEach(row => {
      categoriaMap[row.nome] = row.id;
    });

    // Inserir produtos
    for (const produto of produtos) {
      const catId = categoriaMap[produto.categoria];
      await client.query(
        `
        INSERT INTO produtos (
          id, nome, descricao, codigo_barras, tipo, unidade_padrao,
          validade_media_dias, imagem_url, tags, informacoes_nutricionais,
          origem, verificado, criado_em, atualizado_em, categoria_id
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW(), $11
        )
        ON CONFLICT (codigo_barras) DO NOTHING
        `,
        [
          produto.nome,
          produto.descricao,
          produto.codigo_barras,
          'ALIMENTO',
          produto.unidade,
          produto.dias_validade,
          produto.imagem,
          JSON.stringify(produto.tags),
          JSON.stringify(produto.nutricao),
          'usuario',
          catId,
        ],
      );
    }
    console.log('✅ 8 produtos inseridos\n');

    // 3. INSERIR RECEITAS
    console.log('👨‍🍳 Inserindo 3 receitas...');

    const receitas = [
      {
        nome: 'Arroz com Frango',
        descricao: 'Arroz integral suculento com peito de frango grelhado, tomate fresco e alface crocante.',
        modo_preparo: '1. Cozinhe o arroz integral conforme instruções da embalagem. 2. Tempere e grelhe o peito de frango até dourar. 3. Pique o tomate e alface. 4. Misture tudo em um prato fundo.',
        tempo_preparo: 35,
        porcoes: 4,
        imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
        ingredientes: [
          { nome: 'Arroz Integral', quantidade: 2, unidade: 'kg' },
          { nome: 'Frango Peito', quantidade: 0.5, unidade: 'kg' },
          { nome: 'Tomate Caqui', quantidade: 0.3, unidade: 'kg' },
          { nome: 'Alface Crespa', quantidade: 1, unidade: 'un' },
        ],
      },
      {
        nome: 'Omelete de Queijo',
        descricao: 'Omelete preparada com ovos frescos, queijo derretido, tomate e alface.',
        modo_preparo: '1. Bata os ovos em uma tigela com sal e pimenta. 2. Aquça uma panela com manteiga. 3. Despeje os ovos e deixe cozinhar. 4. Adicione o queijo ralado no meio. 5. Dobre e sirva.',
        tempo_preparo: 15,
        porcoes: 2,
        imagem: 'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=300&h=300&fit=crop',
        ingredientes: [
          { nome: 'Ovos Brancos', quantidade: 3, unidade: 'un' },
          { nome: 'Queijo Meia Cura', quantidade: 0.1, unidade: 'kg' },
          { nome: 'Tomate Caqui', quantidade: 0.1, unidade: 'kg' },
        ],
      },
      {
        nome: 'Salada Fresca',
        descricao: 'Salada leve com alface crocante, tomate suculento e iogurte grego como molho.',
        modo_preparo: '1. Pique a alface em tiras. 2. Corte o tomate em cubos pequenos. 3. Misture em uma tigela. 4. Adicione o iogurte grego como molho. 5. Tempere com sal e pimenta a gosto.',
        tempo_preparo: 10,
        porcoes: 2,
        imagem: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop',
        ingredientes: [
          { nome: 'Alface Crespa', quantidade: 1, unidade: 'un' },
          { nome: 'Tomate Caqui', quantidade: 0.2, unidade: 'kg' },
          { nome: 'Iogurte Grego', quantidade: 0.15, unidade: 'un' },
        ],
      },
    ];

    // Obter IDs dos produtos
    const prodResult = await client.query(`SELECT id, nome FROM produtos`);
    const produtoMap = {};
    prodResult.rows.forEach(row => {
      produtoMap[row.nome] = row.id;
    });

    for (const receita of receitas) {
      const recResult = await client.query(
        `
        INSERT INTO receitas (
          id, nome, descricao, modo_preparo, tempo_preparo,
          rendimento_porcoes, dificuldade, categoria_receita,
          imagem_url, tags_dieta, tags_preparo, informacoes_nutricionais,
          origem, avaliacao_media, vezes_executada,
          criado_em, atualizado_em
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        )
        RETURNING id
        `,
        [
          receita.nome,
          receita.descricao,
          receita.modo_preparo,
          receita.tempo_preparo,
          receita.porcoes,
          'facil',
          'almoco',
          receita.imagem,
          JSON.stringify(['low-carb']),
          JSON.stringify(['quick', 'easy']),
          JSON.stringify({ calorias: 450, proteinas: 25 }),
          'usuario',
          4.5 + Math.random() * 0.5,
          Math.floor(Math.random() * 10) + 1,
        ],
      );

      const receitaId = recResult.rows[0].id;

      // Inserir ingredientes
      for (const ing of receita.ingredientes) {
        const prodId = produtoMap[ing.nome];
        if (prodId) {
          await client.query(
            `
            INSERT INTO receita_ingredientes (
              id, receita_id, produto_id, quantidade, unidade
            )
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            `,
            [receitaId, prodId, ing.quantidade, ing.unidade],
          );
        }
      }
    }
    console.log('✅ 3 receitas com ingredientes inseridas\n');

    // EXIBIR RESUMO
    const catCount = await client.query(`SELECT COUNT(*) as count FROM categorias`);
    const prodCount = await client.query(`SELECT COUNT(*) as count FROM produtos`);
    const recCount = await client.query(`SELECT COUNT(*) as count FROM receitas`);
    const ingCount = await client.query(`SELECT COUNT(*) as count FROM receita_ingredientes`);

    console.log('📊 RESUMO:');
    console.log(`  📂 Categorias: ${catCount.rows[0].count}`);
    console.log(`  🛒 Produtos: ${prodCount.rows[0].count}`);
    console.log(`  👨‍🍳 Receitas: ${recCount.rows[0].count}`);
    console.log(`  🥘 Ingredientes: ${ingCount.rows[0].count}`);
    console.log('\n✅ SEED CONCLUÍDO!');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
