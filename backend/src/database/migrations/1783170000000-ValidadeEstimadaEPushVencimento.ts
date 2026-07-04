import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Validade estimada + push de vencimento (Fase 7 do PLANO_CORRECOES.md):
 * - produtos.validade_padrao_dias — prazo default por produto (precedência
 *   sobre a heurística por nome em validade-estimada.util)
 * - inventario.validade_avisada_em — anti-spam do push "vence em breve"
 */
export class ValidadeEstimadaEPushVencimento1783170000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS validade_padrao_dias INTEGER`);
    await qr.query(`ALTER TABLE inventario ADD COLUMN IF NOT EXISTS validade_avisada_em TIMESTAMP`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE inventario DROP COLUMN IF EXISTS validade_avisada_em`);
    await qr.query(`ALTER TABLE produtos DROP COLUMN IF EXISTS validade_padrao_dias`);
  }
}
