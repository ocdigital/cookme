import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TipoPreferencia.RECEITA_URL_IGNORADA foi adicionado ao código (busca web
 * personalizada) sem migration — dev usa synchronize, mas produção quebrava
 * com 22P02 (invalid input value for enum) no POST /receitas/web/buscar.
 * Já aplicado manualmente em prod em 2026-07-05; migration formaliza.
 */
export class AddReceitaUrlIgnoradaEnum1783200000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TYPE preferencias_aprendidas_tipo_enum ADD VALUE IF NOT EXISTS 'receita_url_ignorada'`,
    );
  }

  async down(): Promise<void> {
    // Postgres não suporta remover valor de enum; no-op intencional.
  }
}
