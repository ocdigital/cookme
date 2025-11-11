import { DataSource } from 'typeorm';

/**
 * Verify food categories in database
 * Run with: npx ts-node src/database/seeds/verify-categories.ts
 */
async function verifyCategories(): Promise<void> {
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
    console.log('📊 Connected to database\n');

    const queryRunner = dataSource.createQueryRunner();

    // Get all categories
    const categories = await queryRunner.query(
      'SELECT id, nome, is_food, icone, descricao FROM categorias ORDER BY nome',
    );

    console.log('📋 Categories in database:\n');
    console.log('┌─────────────────────────────────────┬──────────┬────┐');
    console.log('│ Nome                                │ is_food  │ 🎭 │');
    console.log('├─────────────────────────────────────┼──────────┼────┤');

    for (const cat of categories) {
      const nome = (cat.nome || 'N/A').padEnd(35);
      const isFood = cat.is_food ? '✅ true ' : '❌ false';
      const icon = cat.icone || '';
      console.log(`│ ${nome} │ ${isFood} │ ${icon}  │`);
    }

    console.log('└─────────────────────────────────────┴──────────┴────┘\n');

    const foodCount = categories.filter((c) => c.is_food).length;
    const totalCount = categories.length;

    console.log(`✨ Summary:`);
    console.log(`   - Total categories: ${totalCount}`);
    console.log(`   - Food categories: ${foodCount}`);
    console.log(`   - Non-food categories: ${totalCount - foodCount}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

verifyCategories();
