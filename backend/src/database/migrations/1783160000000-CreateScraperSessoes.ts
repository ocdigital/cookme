import { MigrationInterface, QueryRunner } from 'typeorm';

/** Sessões de scraper persistentes (Fase 6.1 do PLANO_CORRECOES.md). */
export class CreateScraperSessoes1783160000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS scraper_sessoes (
        id UUID PRIMARY KEY,
        usuario_id UUID NOT NULL,
        qrcode_texto TEXT NOT NULL,
        status VARCHAR(30) NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        mensagem_erro TEXT,
        criado_em TIMESTAMP NOT NULL DEFAULT now(),
        atualizado_em TIMESTAMP NOT NULL DEFAULT now(),
        expira_em TIMESTAMP NOT NULL
      )
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_scraper_sessoes_usuario ON scraper_sessoes (usuario_id)`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_scraper_sessoes_status ON scraper_sessoes (status)`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS scraper_sessoes`);
  }
}
