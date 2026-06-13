import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed de receitas com exemplos reais
 * Run with: npx ts-node src/database/seeds/seed-receitas.ts
 */
async function seedReceitas(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'cookme',
    password: process.env.DB_PASSWORD || 'cookme_new_pass',
    database: process.env.DB_DATABASE || 'cookme_db',
    entities: [],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📊 Connected to database for seeding recipes');

    const queryRunner = dataSource.createQueryRunner();

    // Primeiro, vamos criar alguns produtos básicos se não existirem
    const basicProducts = [
      { nome: 'Arroz Branco', codigo_barras: '7891234560001', categoria: 'Grãos e Cereais' },
      { nome: 'Feijão Preto', codigo_barras: '7891234560002', categoria: 'Grãos e Cereais' },
      { nome: 'Tomate', codigo_barras: '7891234560003', categoria: 'Frutas e Vegetais' },
      { nome: 'Cebola', codigo_barras: '7891234560004', categoria: 'Frutas e Vegetais' },
      { nome: 'Alho', codigo_barras: '7891234560005', categoria: 'Temperos e Condimentos' },
      { nome: 'Óleo de Soja', codigo_barras: '7891234560006', categoria: 'Óleos e Gorduras' },
      { nome: 'Sal', codigo_barras: '7891234560007', categoria: 'Temperos e Condimentos' },
      { nome: 'Frango - Peito', codigo_barras: '7891234560008', categoria: 'Carnes e Peixes' },
      { nome: 'Leite Integral', codigo_barras: '7891234560009', categoria: 'Laticínios e Queijos' },
      { nome: 'Queijo Mussarela', codigo_barras: '7891234560010', categoria: 'Laticínios e Queijos' },
      { nome: 'Massa Espaguete', codigo_barras: '7891234560011', categoria: 'Grãos e Cereais' },
      { nome: 'Molho de Tomate', codigo_barras: '7891234560012', categoria: 'Temperos e Condimentos' },
      { nome: 'Ovo', codigo_barras: '7891234560013', categoria: 'Carnes e Peixes' },
      { nome: 'Batata', codigo_barras: '7891234560014', categoria: 'Frutas e Vegetais' },
      { nome: 'Cenoura', codigo_barras: '7891234560015', categoria: 'Frutas e Vegetais' },
    ];

    console.log('🥬 Ensuring basic products exist...');
    const productIds: Record<string, string> = {};

    for (const product of basicProducts) {
      // Buscar categoria
      const categoria = await queryRunner.query(
        'SELECT id FROM categorias WHERE nome = $1 LIMIT 1',
        [product.categoria],
      );

      const categoriaId = categoria.length > 0 ? categoria[0].id : null;

      // Verificar se produto já existe
      const existing = await queryRunner.query(
        'SELECT id FROM produtos WHERE nome = $1',
        [product.nome],
      );

      if (existing.length === 0) {
        const productId = uuidv4();
        await queryRunner.query(
          `INSERT INTO produtos (id, nome, codigo_barras, categoria_id, criado_em, atualizado_em)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [productId, product.nome, product.codigo_barras, categoriaId],
        );
        productIds[product.nome] = productId;
        console.log(`✅ Created product: ${product.nome}`);
      } else {
        productIds[product.nome] = existing[0].id;
        console.log(`⏭️  Product already exists: ${product.nome}`);
      }
    }

    // Agora criar as receitas
    console.log('\n🍳 Creating recipes...');

    const receitas = [
      {
        nome: 'Arroz com Feijão Tradicional',
        descricao: 'O clássico arroz com feijão brasileiro, simples e delicioso',
        modo_preparo: `1. Refogue 2 dentes de alho picado em 2 colheres de óleo
2. Adicione o arroz e mexa por 1 minuto
3. Adicione água fervente (2 copos de água para 1 de arroz)
4. Tampe e deixe cozinhar em fogo baixo por 15-20 minutos
5. Para o feijão: Cozinhe o feijão em água com sal até ficar macio
6. Refogue cebola e alho, adicione o feijão cozido e tempere a gosto
7. Sirva quente`,
        tempo_preparo: 40,
        rendimento_porcoes: 4,
        dificuldade: 'facil',
        tags_dieta: ['vegetariano'],
        tags_preparo: ['tradicional', 'basico'],
        categoria_receita: 'almoco',
        origem: 'catalogo',
        ingredientes_chave: ['arroz', 'feijao', 'alho', 'oleo', 'cebola', 'sal'],
        ingredientes: [
          { produto: 'Arroz Branco', quantidade: 2, unidade: 'un', observacao: 'xícaras' },
          { produto: 'Feijão Preto', quantidade: 1, unidade: 'un', observacao: 'xícara' },
          { produto: 'Alho', quantidade: 4, unidade: 'dente' },
          { produto: 'Óleo de Soja', quantidade: 2, unidade: 'ml', observacao: 'colheres de sopa' },
          { produto: 'Cebola', quantidade: 1, unidade: 'un', observacao: 'picada' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
      {
        nome: 'Frango Grelhado com Legumes',
        descricao: 'Receita saudável e rápida de frango com legumes',
        modo_preparo: `1. Tempere o frango com sal, alho e deixe marinar por 15 minutos
2. Grelhe o frango em uma frigideira antiaderente até dourar dos dois lados
3. Corte os legumes (batata, cenoura, cebola) em cubos
4. Refogue os legumes com um fio de óleo até ficarem macios
5. Sirva o frango com os legumes`,
        tempo_preparo: 35,
        rendimento_porcoes: 2,
        dificuldade: 'facil',
        tags_dieta: ['low-carb', 'fit'],
        tags_preparo: ['rapido', 'saudavel'],
        categoria_receita: 'almoco',
        origem: 'catalogo',
        ingredientes_chave: ['frango', 'batata', 'cenoura', 'cebola', 'alho', 'oleo', 'sal'],
        ingredientes: [
          { produto: 'Frango - Peito', quantidade: 400, unidade: 'g' },
          { produto: 'Batata', quantidade: 2, unidade: 'un', observacao: 'médias' },
          { produto: 'Cenoura', quantidade: 2, unidade: 'un' },
          { produto: 'Cebola', quantidade: 1, unidade: 'un' },
          { produto: 'Alho', quantidade: 3, unidade: 'dente' },
          { produto: 'Óleo de Soja', quantidade: 1, unidade: 'ml', observacao: 'colher de sopa' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
      {
        nome: 'Espaguete ao Molho de Tomate',
        descricao: 'Macarrão clássico com molho de tomate caseiro',
        modo_preparo: `1. Cozinhe o espaguete em água fervente com sal por 10 minutos
2. Refogue alho picado em óleo
3. Adicione o molho de tomate e tomates picados
4. Tempere com sal e deixe cozinhar por 10 minutos
5. Escorra a massa e misture com o molho
6. Finalize com queijo ralado`,
        tempo_preparo: 25,
        rendimento_porcoes: 3,
        dificuldade: 'facil',
        tags_dieta: ['vegetariano'],
        tags_preparo: ['rapido', 'pratico'],
        categoria_receita: 'almoco',
        origem: 'catalogo',
        ingredientes_chave: ['espaguete', 'macarrao', 'tomate', 'alho', 'oleo', 'queijo', 'sal'],
        ingredientes: [
          { produto: 'Massa Espaguete', quantidade: 300, unidade: 'g' },
          { produto: 'Molho de Tomate', quantidade: 1, unidade: 'un', observacao: 'lata' },
          { produto: 'Tomate', quantidade: 2, unidade: 'un', observacao: 'picados' },
          { produto: 'Alho', quantidade: 3, unidade: 'dente' },
          { produto: 'Óleo de Soja', quantidade: 2, unidade: 'ml', observacao: 'colheres' },
          { produto: 'Queijo Mussarela', quantidade: 50, unidade: 'g', observacao: 'ralado' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
      {
        nome: 'Omelete Simples',
        descricao: 'Omelete rápido e nutritivo para qualquer refeição',
        modo_preparo: `1. Bata os ovos com sal em uma tigela
2. Aqueça uma frigideira com um fio de óleo
3. Despeje os ovos batidos
4. Adicione queijo picado por cima (opcional)
5. Dobre ao meio quando começar a firmar
6. Sirva quente`,
        tempo_preparo: 10,
        rendimento_porcoes: 1,
        dificuldade: 'facil',
        tags_dieta: ['low-carb', 'proteico'],
        tags_preparo: ['rapido', 'cafe-manha'],
        categoria_receita: 'cafe-manha',
        origem: 'catalogo',
        ingredientes_chave: ['ovo', 'ovos', 'oleo', 'sal', 'queijo'],
        ingredientes: [
          { produto: 'Ovo', quantidade: 3, unidade: 'un' },
          { produto: 'Óleo de Soja', quantidade: 1, unidade: 'ml', observacao: 'colher de chá' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
          { produto: 'Queijo Mussarela', quantidade: 30, unidade: 'g', opcional: true },
        ],
      },
      {
        nome: 'Frango Grelhado com Brócolis',
        descricao: 'Receita fitness clássica: peito de frango grelhado com brócolis no vapor, rico em proteína e baixo em carboidratos',
        modo_preparo: `1. Tempere o peito de frango com sal, pimenta e alho picado
2. Grelhe em frigideira antiaderente por 6-8 minutos de cada lado
3. Cozinhe o brócolis no vapor por 5 minutos (deve ficar al dente)
4. Tempere o brócolis com azeite e sal
5. Sirva o frango fatiado sobre o brócolis`,
        tempo_preparo: 25,
        rendimento_porcoes: 1,
        dificuldade: 'facil',
        tags_dieta: ['fitness', 'low-carb', 'proteico', 'sem-gluten'],
        tags_preparo: ['rapido', 'saudavel', 'grelhado'],
        categoria_receita: 'almoco',
        origem: 'catalogo',
        ingredientes_chave: ['frango', 'brocolis', 'alho', 'sal'],
        ingredientes: [
          { produto: 'Frango - Peito', quantidade: 200, unidade: 'g' },
          { produto: 'Alho', quantidade: 2, unidade: 'dente' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
      {
        nome: 'Omelete Proteico com Queijo',
        descricao: 'Omelete rico em proteínas, perfeito para café da manhã ou pós-treino',
        modo_preparo: `1. Bata 3 ovos inteiros com 2 claras, sal e pimenta
2. Aqueça frigideira antiaderente com spray de óleo
3. Despeje os ovos e deixe firmar por 2 minutos
4. Adicione queijo ralado no centro
5. Dobre ao meio e sirva imediatamente`,
        tempo_preparo: 10,
        rendimento_porcoes: 1,
        dificuldade: 'facil',
        tags_dieta: ['fitness', 'proteico', 'low-carb', 'sem-gluten'],
        tags_preparo: ['rapido', 'cafe-manha', 'pos-treino'],
        categoria_receita: 'cafe-manha',
        origem: 'catalogo',
        ingredientes_chave: ['ovo', 'ovos', 'queijo', 'sal'],
        ingredientes: [
          { produto: 'Ovo', quantidade: 3, unidade: 'un' },
          { produto: 'Queijo Mussarela', quantidade: 30, unidade: 'g' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
      {
        nome: 'Batata Doce com Frango Desfiado',
        descricao: 'Combinação pré-treino perfeita: carboidrato de baixo índice glicêmico com proteína magra',
        modo_preparo: `1. Cozinhe a batata doce em cubos por 20 minutos até amaciar
2. Cozinhe o peito de frango em água com sal por 25 minutos
3. Desfie o frango ainda quente com dois garfos
4. Tempere o frango com alho, sal e cebolinha
5. Monte o prato: batata doce ao lado do frango desfiado`,
        tempo_preparo: 40,
        rendimento_porcoes: 2,
        dificuldade: 'facil',
        tags_dieta: ['fitness', 'proteico', 'sem-gluten', 'hiperproteico'],
        tags_preparo: ['pre-treino', 'pos-treino', 'saudavel'],
        categoria_receita: 'almoco',
        origem: 'catalogo',
        ingredientes_chave: ['frango', 'alho', 'sal'],
        ingredientes: [
          { produto: 'Frango - Peito', quantidade: 300, unidade: 'g' },
          { produto: 'Alho', quantidade: 3, unidade: 'dente' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
      {
        nome: 'Sopa de Legumes',
        descricao: 'Sopa caseira reconfortante com legumes frescos',
        modo_preparo: `1. Refogue cebola e alho em um fio de óleo
2. Adicione todos os legumes picados (batata, cenoura, tomate)
3. Cubra com água e adicione sal
4. Cozinhe por 30 minutos até os legumes ficarem macios
5. Se desejar, bata parte da sopa no liquidificador para encorpar
6. Sirva quente`,
        tempo_preparo: 45,
        rendimento_porcoes: 4,
        dificuldade: 'facil',
        tags_dieta: ['vegetariano', 'vegano', 'light'],
        tags_preparo: ['saudavel', 'reconfortante'],
        categoria_receita: 'jantar',
        origem: 'catalogo',
        ingredientes_chave: ['batata', 'cenoura', 'tomate', 'cebola', 'alho', 'oleo', 'sal'],
        ingredientes: [
          { produto: 'Batata', quantidade: 3, unidade: 'un' },
          { produto: 'Cenoura', quantidade: 2, unidade: 'un' },
          { produto: 'Tomate', quantidade: 2, unidade: 'un' },
          { produto: 'Cebola', quantidade: 1, unidade: 'un' },
          { produto: 'Alho', quantidade: 2, unidade: 'dente' },
          { produto: 'Óleo de Soja', quantidade: 1, unidade: 'ml', observacao: 'colher' },
          { produto: 'Sal', quantidade: 1, unidade: 'g', observacao: 'a gosto' },
        ],
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const receitaData of receitas) {
      // Verificar se receita já existe
      const existing = await queryRunner.query(
        'SELECT id FROM receitas WHERE nome = $1',
        [receitaData.nome],
      );

      if (existing.length > 0) {
        console.log(`⏭️  Recipe already exists: ${receitaData.nome}`);
        skipped++;
        continue;
      }

      // Criar receita
      const receitaId = uuidv4();
      await queryRunner.query(
        `INSERT INTO receitas (
          id, nome, descricao, modo_preparo, tempo_preparo, rendimento_porcoes,
          dificuldade, tags_dieta, tags_preparo, categoria_receita, origem,
          ingredientes_chave, criado_em, atualizado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          receitaId,
          receitaData.nome,
          receitaData.descricao,
          receitaData.modo_preparo,
          receitaData.tempo_preparo,
          receitaData.rendimento_porcoes,
          receitaData.dificuldade,
          receitaData.tags_dieta,
          receitaData.tags_preparo,
          receitaData.categoria_receita,
          receitaData.origem,
          (receitaData as any).ingredientes_chave || null,
        ],
      );

      // Criar ingredientes
      for (let i = 0; i < receitaData.ingredientes.length; i++) {
        const ing = receitaData.ingredientes[i];
        const produtoId = productIds[ing.produto];

        if (!produtoId) {
          console.warn(`⚠️  Product not found: ${ing.produto}`);
          continue;
        }

        const ingredienteId = uuidv4();
        await queryRunner.query(
          `INSERT INTO receita_ingredientes (
            id, receita_id, produto_id, quantidade, unidade, opcional, observacao, ordem
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            ingredienteId,
            receitaId,
            produtoId,
            ing.quantidade,
            ing.unidade,
            ing.opcional || false,
            ing.observacao || null,
            i + 1,
          ],
        );
      }

      console.log(`✅ Created recipe: ${receitaData.nome}`);
      created++;
    }

    console.log('\n✨ Recipe seed completed:');
    console.log(`   - Created: ${created} recipes`);
    console.log(`   - Skipped: ${skipped} recipes (already exist)`);
  } catch (error) {
    console.error('❌ Error running recipe seed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seedReceitas();
