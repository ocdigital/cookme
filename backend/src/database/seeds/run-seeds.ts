import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedCategoriasAlimentos } from './seed-categorias-alimentos';

// Carregar variáveis de ambiente
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function runSeeds() {
  console.log('🌱 Iniciando seeds...\n');

  try {
    await AppDataSource.initialize();
    console.log('✓ Conexão com banco estabelecida\n');

    // Executar seeds
    await seedCategoriasAlimentos(AppDataSource);

    console.log('\n✅ Todos os seeds foram executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeds();
