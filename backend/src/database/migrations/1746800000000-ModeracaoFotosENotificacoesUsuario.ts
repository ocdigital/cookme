import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModeracaoFotosENotificacoesUsuario1746800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Campos de moderação de foto na tabela receitas
    await queryRunner.query(`
      ALTER TABLE receitas
        ADD COLUMN IF NOT EXISTS autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS foto_pendente_url VARCHAR,
        ADD COLUMN IF NOT EXISTS foto_pendente_autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS foto_pendente_motivo_rejeicao TEXT
    `);

    // Tabela de notificações para usuários mobile
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notificacoes_usuario (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        dados JSONB,
        lido BOOLEAN NOT NULL DEFAULT false,
        lido_em TIMESTAMP,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificacoes_usuario(usuario_id, lido)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notif_usuario_criado ON notificacoes_usuario(criado_em DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notificacoes_usuario`);
    await queryRunner.query(`
      ALTER TABLE receitas
        DROP COLUMN IF EXISTS autor_id,
        DROP COLUMN IF EXISTS foto_pendente_url,
        DROP COLUMN IF EXISTS foto_pendente_autor_id,
        DROP COLUMN IF EXISTS foto_pendente_motivo_rejeicao
    `);
  }
}
