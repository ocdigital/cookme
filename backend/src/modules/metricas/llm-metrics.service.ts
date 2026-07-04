import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmChamada } from './entities/llm-chamada.entity';

// Preço por 1M tokens (USD) — atualizar quando os preços mudarem
const PRECO_POR_MILHAO: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5-20251001': { in: 1.0, out: 5.0 },
  'gemini-2.0-flash': { in: 0.1, out: 0.4 },
  'llama-3.3-70b-versatile': { in: 0, out: 0 }, // Groq free tier
};

export interface RegistroLlm {
  contexto: 'geracao' | 'rag_adaptacao' | 'validacao';
  provider: 'anthropic' | 'gemini' | 'groq';
  modelo?: string;
  tokens_in?: number;
  tokens_out?: number;
  latencia_ms?: number;
  sucesso: boolean;
  erro?: string;
}

@Injectable()
export class LlmMetricsService {
  private readonly logger = new Logger(LlmMetricsService.name);

  constructor(
    @InjectRepository(LlmChamada)
    private readonly repo: Repository<LlmChamada>,
  ) {}

  /** Registra uma chamada de LLM (sucesso OU falha). Nunca lança. */
  async registrar(r: RegistroLlm): Promise<void> {
    try {
      const preco = r.modelo ? PRECO_POR_MILHAO[r.modelo] : undefined;
      const custo =
        preco && (r.tokens_in || r.tokens_out)
          ? ((r.tokens_in ?? 0) * preco.in + (r.tokens_out ?? 0) * preco.out) / 1_000_000
          : null;
      await this.repo.insert({
        contexto: r.contexto,
        provider: r.provider,
        modelo: r.modelo ?? null,
        tokens_in: r.tokens_in ?? null,
        tokens_out: r.tokens_out ?? null,
        latencia_ms: r.latencia_ms ?? null,
        sucesso: r.sucesso,
        erro: r.erro?.slice(0, 500) ?? null,
        custo_estimado: custo,
      });
    } catch (e: any) {
      this.logger.warn(`Falha ao registrar chamada LLM: ${e.message}`);
    }
  }

  /**
   * Resumo 24h por provider + taxa de fallback.
   * Groq dominando = Haiku/Gemini caíram — loga error para alertar.
   */
  async resumo24h(): Promise<{
    por_provider: Array<{ provider: string; chamadas: number; falhas: number; custo: number; latencia_media: number }>;
    taxa_fallback_groq_24h: number;
  }> {
    const por_provider = await this.repo.query(`
      SELECT provider,
             COUNT(*)::int AS chamadas,
             COUNT(*) FILTER (WHERE NOT sucesso)::int AS falhas,
             COALESCE(SUM(custo_estimado), 0)::float AS custo,
             COALESCE(AVG(latencia_ms), 0)::int AS latencia_media
      FROM llm_chamadas
      WHERE criado_em >= now() - interval '24 hours'
      GROUP BY provider
    `);

    const geracoes = por_provider
      .filter((p: any) => p.provider !== 'gemini' || true)
      .reduce((s: number, p: any) => s + p.chamadas, 0);
    const groq = por_provider.find((p: any) => p.provider === 'groq');
    const taxa = geracoes > 0 && groq ? Math.round((groq.chamadas / geracoes) * 1000) / 10 : 0;

    if (taxa > 50) {
      this.logger.error(
        `⚠️ Groq (último fallback) serviu ${taxa}% das chamadas nas últimas 24h — Haiku/Gemini provavelmente caíram (crédito/quota).`,
      );
    }

    return { por_provider, taxa_fallback_groq_24h: taxa };
  }
}
