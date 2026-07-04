import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * EAN ponta a ponta (Fase 3 do PLANO_CORRECOES.md):
 * - compra_itens.codigo_barras — EAN por item da nota (base p/ depleção estimada)
 * - product_knowledge_base.codigo_barras — EAN aprendido → canonização sem ambiguidade
 */
export class AddCodigoBarrasCompraItensEKb1783140000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE compra_itens
      ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(14)
    `);
    await qr.query(`
      ALTER TABLE product_knowledge_base
      ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(14)
    `);
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_pkb_codigo_barras
      ON product_knowledge_base (codigo_barras)
      WHERE codigo_barras IS NOT NULL
    `);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_pkb_codigo_barras`);
    await qr.query(`ALTER TABLE product_knowledge_base DROP COLUMN IF EXISTS codigo_barras`);
    await qr.query(`ALTER TABLE compra_itens DROP COLUMN IF EXISTS codigo_barras`);
  }
}
