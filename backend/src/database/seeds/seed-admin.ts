import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@cookme.com';
const ADMIN_NOME = 'Administrador';
const ADMIN_SENHA_TEMP = 'Admin@123';

async function seedAdmin(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'cookme',
    password: process.env.DB_PASSWORD || 'cookme123',
    database: process.env.DB_DATABASE || 'cookme_db',
    synchronize: false,
    logging: false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('📊 Conectado ao banco de dados');

    const existing = await dataSource.query(
      `SELECT id, email FROM usuarios WHERE email = $1`,
      [ADMIN_EMAIL],
    );

    if (existing.length > 0) {
      // Garante que o usuário existente é admin e tem a flag ativa
      const senhaHash = await bcrypt.hash(ADMIN_SENHA_TEMP, 10);
      await dataSource.query(
        `UPDATE usuarios SET role = 'admin', deve_trocar_senha = true, senha = $1 WHERE email = $2`,
        [senhaHash, ADMIN_EMAIL],
      );
      console.log(`✅ Admin já existe — senha redefinida para temporária e flag ativada`);
    } else {
      const senhaHash = await bcrypt.hash(ADMIN_SENHA_TEMP, 10);
      await dataSource.query(
        `INSERT INTO usuarios (id, email, nome, senha, role, deve_trocar_senha, email_verificado, alertas_habilitados)
         VALUES (gen_random_uuid(), $1, $2, $3, 'admin', true, true, true)`,
        [ADMIN_EMAIL, ADMIN_NOME, senhaHash],
      );
      console.log(`✅ Usuário admin criado`);
    }

    console.log(`\n📋 Credenciais de acesso:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_SENHA_TEMP}`);
    console.log(`   ⚠️  Troca de senha obrigatória no primeiro login`);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin();
