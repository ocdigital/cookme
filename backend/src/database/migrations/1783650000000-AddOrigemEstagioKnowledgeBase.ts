import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A3 do PLANO_PRECISAO_ENGINE.md: sem esta coluna, um item resolvido por um
 * estágio fraco (normalizer 0.55) que fosse cacheado via kb_exato voltava com
 * confiança fixa 0.92 — lavagem de confiança. origem_estagio guarda a origem
 * real, e a releitura por kb_exato herda essa confiança honesta.
 */
export class AddOrigemEstagioKnowledgeBase1783650000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE product_knowledge_base ADD COLUMN IF NOT EXISTS origem_estagio VARCHAR(20)`,
    );
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE product_knowledge_base DROP COLUMN IF EXISTS origem_estagio`);
  }
}
