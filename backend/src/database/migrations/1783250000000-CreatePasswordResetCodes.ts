import { MigrationInterface, QueryRunner } from 'typeorm';

/** Esqueci minha senha — códigos de recuperação (hash, TTL, single-use). */
export class CreatePasswordResetCodes1783250000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        codigo_hash VARCHAR(100) NOT NULL,
        expira_em TIMESTAMP NOT NULL,
        usado_em TIMESTAMP,
        tentativas INTEGER NOT NULL DEFAULT 0,
        criado_em TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_prc_usuario ON password_reset_codes (usuario_id)`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS password_reset_codes`);
  }
}
