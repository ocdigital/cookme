import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCronLogs1750400000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS cron_logs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job         VARCHAR(60) NOT NULL,
        status      VARCHAR(20) NOT NULL DEFAULT 'ok',
        receitas_salvas      INT NOT NULL DEFAULT 0,
        receitas_descartadas INT NOT NULL DEFAULT 0,
        detalhe     TEXT,
        duracao_ms  INT,
        criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(`CREATE INDEX idx_cron_logs_criado ON cron_logs (criado_em DESC)`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS cron_logs`);
  }
}
