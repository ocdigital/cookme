import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * receitas.ingredientes_texto — lista de exibição dos ingredientes (texto
 * original da IA, com quantidade/unidade). Separa a lista que o usuário LÊ da
 * ingredientes_chave (normalizada, para busca). Necessária para corrigir as
 * receitas do seed groq_seed que embutiram os ingredientes no modo_preparo.
 */
export class AddReceitaIngredientesTexto1783300000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE receitas ADD COLUMN IF NOT EXISTS ingredientes_texto TEXT[]`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE receitas DROP COLUMN IF EXISTS ingredientes_texto`);
  }
}
