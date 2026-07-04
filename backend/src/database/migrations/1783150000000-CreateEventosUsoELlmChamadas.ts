import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Instrumentação (Fase 5 do PLANO_CORRECOES.md):
 * - eventos_uso: event log de produto → retenção D7/D30
 * - llm_chamadas: observabilidade da cadeia Haiku→Gemini→Groq
 */
export class CreateEventosUsoELlmChamadas1783150000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS eventos_uso (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        evento VARCHAR(40) NOT NULL,
        metadata JSONB,
        criado_em TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_eventos_uso_usuario_data ON eventos_uso (usuario_id, criado_em)`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_eventos_uso_evento_data ON eventos_uso (evento, criado_em)`);

    await qr.query(`
      CREATE TABLE IF NOT EXISTS llm_chamadas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contexto VARCHAR(30) NOT NULL,
        provider VARCHAR(20) NOT NULL,
        modelo VARCHAR(60),
        tokens_in INTEGER,
        tokens_out INTEGER,
        latencia_ms INTEGER,
        sucesso BOOLEAN NOT NULL DEFAULT true,
        erro TEXT,
        custo_estimado DECIMAL(10,6),
        criado_em TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_llm_chamadas_provider_data ON llm_chamadas (provider, criado_em)`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_llm_chamadas_contexto_data ON llm_chamadas (contexto, criado_em)`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS llm_chamadas`);
    await qr.query(`DROP TABLE IF EXISTS eventos_uso`);
  }
}
