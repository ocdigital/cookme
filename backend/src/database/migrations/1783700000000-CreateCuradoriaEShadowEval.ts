import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PLANO_PRECISAO_ENGINE.md §7 (fila de curadoria) e §11 A8 (shadow eval).
 * Produção roda com synchronize=false — sem esta migration as tabelas nunca
 * existiriam lá, só em dev (que usa synchronize=true).
 */
export class CreateCuradoriaEShadowEval1783700000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS curadoria_itens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        descricao_normalizada VARCHAR(255) NOT NULL UNIQUE,
        descricao_exemplo VARCHAR(255) NOT NULL,
        produto_proposto VARCHAR(255) NOT NULL,
        estagio VARCHAR(20) NOT NULL,
        confianca DECIMAL(5,4) NOT NULL,
        ocorrencias INTEGER NOT NULL DEFAULT 1,
        resolvido BOOLEAN NOT NULL DEFAULT false,
        criado_em TIMESTAMP NOT NULL DEFAULT now(),
        atualizado_em TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_curadoria_itens_confianca_ocorrencias
      ON curadoria_itens (confianca, ocorrencias);
    `);

    await qr.query(`
      CREATE TABLE IF NOT EXISTS shadow_eval_amostras (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lote_semana VARCHAR(10) NOT NULL,
        descricao_original VARCHAR(255) NOT NULL,
        produto_canonizado VARCHAR(255) NOT NULL,
        origem_estagio VARCHAR(20),
        rotulo_correto VARCHAR(255),
        acertou BOOLEAN,
        criado_em TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_shadow_eval_amostras_lote_semana
      ON shadow_eval_amostras (lote_semana);
    `);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS shadow_eval_amostras`);
    await qr.query(`DROP TABLE IF EXISTS curadoria_itens`);
  }
}
