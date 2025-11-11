import { DataSource } from 'typeorm';

/**
 * Main seed orchestrator
 * Run with: npm run seed
 */
async function runSeeds(): Promise<void> {
  // Create a temporary data source for seeding
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
    console.log('📊 Connected to database for seeding');

    // Run food categories seed using direct queries
    await seedFoodCategoriesDirectly(dataSource);

    console.log('\n🎉 All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

/**
 * Seed food categories using direct SQL queries
 */
async function seedFoodCategoriesDirectly(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  const defaultFoodCategories = [
    {
      nome: 'Grãos e Cereais',
      descricao: 'Arroz, feijão, milho, trigo e seus derivados',
      icone: '🌾',
    },
    {
      nome: 'Laticínios e Queijos',
      descricao: 'Leite, queijo, iogurte e produtos lácteos',
      icone: '🥛',
    },
    {
      nome: 'Carnes e Peixes',
      descricao: 'Carne vermelha, frango, peixes, ovos',
      icone: '🥩',
    },
    {
      nome: 'Frutas e Vegetais',
      descricao: 'Frutas frescas, vegetais e legumes',
      icone: '🥬',
    },
    {
      nome: 'Pão e Padaria',
      descricao: 'Pão, bolo, biscoito e produtos de padaria',
      icone: '🍞',
    },
    {
      nome: 'Bebidas',
      descricao: 'Suco, refrigerante, água, bebidas em geral',
      icone: '🥤',
    },
    {
      nome: 'Doces e Sobremesas',
      descricao: 'Chocolate, doces, sobremesas, sorvete',
      icone: '🍫',
    },
    {
      nome: 'Temperos e Condimentos',
      descricao: 'Sal, pimenta, molhos, temperos e especiarias',
      icone: '🧂',
    },
    {
      nome: 'Óleos e Gorduras',
      descricao: 'Óleo, manteiga, azeite e gorduras comestíveis',
      icone: '🫒',
    },
    {
      nome: 'Alimentos Congelados',
      descricao: 'Alimentos pré-preparados e congelados',
      icone: '❄️',
    },
  ];

  console.log('🌾 Starting food categories seed...');

  let created = 0;
  let updated = 0;

  for (const categoryData of defaultFoodCategories) {
    // Check if category exists
    const existing = await queryRunner.query(
      'SELECT id FROM categorias WHERE nome = $1',
      [categoryData.nome],
    );

    if (existing.length === 0) {
      // Create new category
      const uuid = require('uuid').v4();
      const now = new Date();
      await queryRunner.query(
        `INSERT INTO categorias (id, nome, descricao, icone, is_food, criado_em)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuid, categoryData.nome, categoryData.descricao, categoryData.icone, true, now],
      );
      console.log(`✅ Created category: ${categoryData.nome}`);
      created++;
    } else {
      // Update to mark as food if not already
      const result = await queryRunner.query(
        'UPDATE categorias SET is_food = true, icone = $1, descricao = $2 WHERE nome = $3 AND is_food = false',
        [categoryData.icone, categoryData.descricao, categoryData.nome],
      );
      if (result.affected > 0) {
        console.log(`✏️  Updated category: ${categoryData.nome}`);
        updated++;
      } else {
        console.log(`⏭️  Category already marked as food: ${categoryData.nome}`);
      }
    }
  }

  // Mark ALL existing categories that contain food-related keywords as food
  const foodKeywords = [
    'alimento',
    'comida',
    'alimentar',
    'alimentação',
    'alimentício',
    'alimentícia',
    'alimentos',
  ];

  let autoMarked = 0;

  // For each keyword, update categories
  for (const keyword of foodKeywords) {
    const result = await queryRunner.query(
      `UPDATE categorias
       SET is_food = true
       WHERE is_food = false
       AND (LOWER(nome) LIKE $1 OR LOWER(descricao) LIKE $1)`,
      [`%${keyword}%`],
    );
    autoMarked += result.affected || 0;
  }

  if (autoMarked > 0) {
    console.log(`🔄 Auto-marked ${autoMarked} categories as food`);
  }

  console.log('\n✨ Seed completed:');
  console.log(`   - Created: ${created} categories`);
  console.log(`   - Updated: ${updated} categories`);
  console.log(`   - Auto-marked: ${autoMarked} categories`);
}

runSeeds();
