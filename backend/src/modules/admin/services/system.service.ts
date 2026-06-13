import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface CallStat {
  today: number;
  total: number;
  errors: number;
  lastCallAt: string | null;
  lastLatencyMs: number;
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  // In-memory call tracker — resets on restart
  private readonly callStats = new Map<string, CallStat>([
    ['gemini',              { today: 0, total: 0, errors: 0, lastCallAt: null, lastLatencyMs: 0 }],
    ['claude',              { today: 0, total: 0, errors: 0, lastCallAt: null, lastLatencyMs: 0 }],
    ['scraper_tudogostoso', { today: 0, total: 0, errors: 0, lastCallAt: null, lastLatencyMs: 0 }],
    ['scraper_receiteria',  { today: 0, total: 0, errors: 0, lastCallAt: null, lastLatencyMs: 0 }],
    ['freepik',             { today: 0, total: 0, errors: 0, lastCallAt: null, lastLatencyMs: 0 }],
    ['ocr',                 { today: 0, total: 0, errors: 0, lastCallAt: null, lastLatencyMs: 0 }],
  ]);

  // Runtime AI/system config — starts from env, can be changed via API (resets on restart)
  private aiConfig = {
    // Gemini
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    geminiTemperature: 0.7,
    geminiMaxTokens: 8192,
    // Claude
    claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    claudeTemperature: 0.8,
    claudeMaxTokens: 4096,
    // Fallback chain para geração de receitas
    recipeChain: ['claude', 'gemini', 'mock'] as string[],
    // Classificação de produtos
    classificationModel: 'gemini',
    classificationThreshold: 75,
    autoConfirmAboveThreshold: true,
    classificationBatchSize: 20,
    // Scrapers
    scraperEnabled: true,
    tudoGostosoEnabled: true,
    receitariaEnabled: true,
    freepikEnabled: true,
    scraperCronEnabled: true,
  };

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // ── Call tracking ─────────────────────────────────────────────────────────

  trackCall(service: string, latencyMs = 0, error = false) {
    const s = this.callStats.get(service);
    if (!s) return;
    s.today++;
    s.total++;
    s.lastLatencyMs = latencyMs;
    s.lastCallAt = new Date().toISOString();
    if (error) s.errors++;
  }

  resetDailyCounters() {
    for (const [, val] of this.callStats) val.today = 0;
    this.logger.log('Contadores diários resetados');
  }

  getCallStats(): Record<string, CallStat> {
    return Object.fromEntries(this.callStats);
  }

  // ── AI Config ─────────────────────────────────────────────────────────────

  getAiConfig() { return { ...this.aiConfig }; }

  updateAiConfig(patch: Partial<typeof this.aiConfig>) {
    this.aiConfig = { ...this.aiConfig, ...patch };
    this.logger.log(`AI config atualizada: ${JSON.stringify(patch)}`);
    return this.getAiConfig();
  }

  // ── Health check ──────────────────────────────────────────────────────────

  async getHealth() {
    // DB ping
    let dbStatus: 'ok' | 'error' = 'ok';
    let dbLatencyMs = 0;
    try {
      const t = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - t;
    } catch {
      dbStatus = 'error';
    }

    const geminiKey = !!process.env.GEMINI_API_KEY;
    const claudeKey = !!process.env.ANTHROPIC_API_KEY;

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database:  { status: dbStatus, latencyMs: dbLatencyMs },
      gemini:    { status: geminiKey ? 'configured' : 'no_key', hasKey: geminiKey, model: this.aiConfig.geminiModel },
      claude:    { status: claudeKey ? 'configured' : 'no_key', hasKey: claudeKey, model: this.aiConfig.claudeModel },
      scraper:   { status: this.aiConfig.scraperEnabled ? 'active' : 'disabled' },
      callStats: this.getCallStats(),
    };
  }

  // ── Test AI connection ────────────────────────────────────────────────────

  async testAiConnection(service: 'gemini' | 'claude'): Promise<{ ok: boolean; response?: string; latencyMs?: number; error?: string }> {
    const t = Date.now();

    if (service === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return { ok: false, error: 'GEMINI_API_KEY não configurada' };
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.aiConfig.geminiModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
              generationConfig: { maxOutputTokens: 10, temperature: 0 },
            }),
          },
        );
        const latencyMs = Date.now() - t;
        if (!res.ok) {
          const err = await res.text();
          this.trackCall('gemini', latencyMs, true);
          return { ok: false, error: `HTTP ${res.status}: ${err.slice(0, 200)}`, latencyMs };
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '(sem resposta)';
        this.trackCall('gemini', latencyMs);
        return { ok: true, response: text, latencyMs };
      } catch (e: any) {
        const latencyMs = Date.now() - t;
        this.trackCall('gemini', latencyMs, true);
        return { ok: false, error: e.message, latencyMs };
      }
    }

    if (service === 'claude') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return { ok: false, error: 'ANTHROPIC_API_KEY não configurada' };
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.aiConfig.claudeModel,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Responda apenas: OK' }],
          }),
        });
        const latencyMs = Date.now() - t;
        if (!res.ok) {
          const err = await res.json() as any;
          this.trackCall('claude', latencyMs, true);
          return { ok: false, error: err.error?.message || `HTTP ${res.status}`, latencyMs };
        }
        const data = await res.json() as any;
        const text = data.content?.[0]?.text?.trim() || '(sem resposta)';
        this.trackCall('claude', latencyMs);
        return { ok: true, response: text, latencyMs };
      } catch (e: any) {
        const latencyMs = Date.now() - t;
        this.trackCall('claude', latencyMs, true);
        return { ok: false, error: e.message, latencyMs };
      }
    }

    return { ok: false, error: 'Serviço desconhecido' };
  }

  // ── DB Stats ──────────────────────────────────────────────────────────────

  async getDbStats() {
    const [
      receitasTotal,
      receitasOk,
      receitasPendentes,
      receitasRejeitadas,
      usuarios,
      kbTotal,
      kbComCanonical,
      inventarioAtivos,
      receitasPorModo,
      receitasPorCategoria,
    ] = await Promise.all([
      this.dataSource.query('SELECT COUNT(*) as n FROM receitas'),
      this.dataSource.query("SELECT COUNT(*) as n FROM receitas WHERE status_moderacao = 'ok'"),
      this.dataSource.query("SELECT COUNT(*) as n FROM receitas WHERE status_moderacao = 'em_revisao'"),
      this.dataSource.query("SELECT COUNT(*) as n FROM receitas WHERE status_moderacao = 'arquivado'"),
      this.dataSource.query('SELECT COUNT(*) as n FROM usuarios'),
      this.dataSource.query('SELECT COUNT(*) as n FROM product_knowledge_base'),
      this.dataSource.query("SELECT COUNT(*) as n FROM product_knowledge_base WHERE canonical_ingredient IS NOT NULL AND canonical_ingredient != ''"),
      this.dataSource.query('SELECT COUNT(*) as n FROM inventario WHERE esgotado = false'),
      this.dataSource.query(`
        SELECT
          CASE
            WHEN tags_dieta LIKE '%vegano%'       THEN 'vegano'
            WHEN tags_dieta LIKE '%vegetariano%'  THEN 'vegetariano'
            WHEN tags_dieta LIKE '%fitness%'      THEN 'fitness'
            ELSE 'normal'
          END as modo,
          COUNT(*) as total
        FROM receitas
        WHERE status_moderacao = 'ok'
        GROUP BY 1
        ORDER BY total DESC
      `),
      this.dataSource.query(`
        SELECT categoria_receita as cat, COUNT(*) as total
        FROM receitas
        WHERE status_moderacao = 'ok' AND categoria_receita IS NOT NULL
        GROUP BY 1
      `),
    ]);

    return {
      receitas: {
        total:      Number(receitasTotal[0].n),
        ok:         Number(receitasOk[0].n),
        pendentes:  Number(receitasPendentes[0].n),
        rejeitadas: Number(receitasRejeitadas[0].n),
        porModo: Object.fromEntries(
          receitasPorModo.map((r: any) => [r.modo, Number(r.total)])
        ),
        porCategoria: Object.fromEntries(
          receitasPorCategoria.map((r: any) => [r.cat || 'sem_categoria', Number(r.total)])
        ),
      },
      usuarios: Number(usuarios[0].n),
      knowledgeBase: {
        total:        Number(kbTotal[0].n),
        comCanonical: Number(kbComCanonical[0].n),
        semCanonical: Number(kbTotal[0].n) - Number(kbComCanonical[0].n),
        taxaAprendizado: kbTotal[0].n > 0
          ? Math.round((Number(kbComCanonical[0].n) / Number(kbTotal[0].n)) * 100)
          : 0,
      },
      inventario: {
        itensAtivos: Number(inventarioAtivos[0].n),
      },
    };
  }
}
