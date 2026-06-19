import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Cpu, Database, Zap, Settings, RefreshCw, Play,
  CheckCircle2, XCircle, AlertTriangle, Clock, ChevronRight,
  Sparkles, Bot, Server, BarChart2,
  Save, TestTube2, Loader2, ArrowUpDown, Info,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

// ─── tipos ───────────────────────────────────────────────────────────────────

interface Health {
  timestamp: string;
  uptime: number;
  database:  { status: string; latencyMs: number };
  gemini:    { status: string; hasKey: boolean; model: string };
  claude:    { status: string; hasKey: boolean; model: string };
  scraper:   { status: string };
  callStats: Record<string, { today: number; total: number; errors: number; lastCallAt: string | null; lastLatencyMs: number }>;
}

interface AiConfig {
  geminiModel: string;
  geminiTemperature: number;
  geminiMaxTokens: number;
  claudeModel: string;
  claudeTemperature: number;
  claudeMaxTokens: number;
  recipeChain: string[];
  classificationModel: string;
  classificationThreshold: number;
  autoConfirmAboveThreshold: boolean;
  classificationBatchSize: number;
  scraperEnabled: boolean;
  tudoGostosoEnabled: boolean;
  receitariaEnabled: boolean;
  freepikEnabled: boolean;
  scraperCronEnabled: boolean;
}

interface DbStats {
  receitas: {
    total: number; ok: number; pendentes: number; rejeitadas: number;
    porModo: Record<string, number>;
    porCategoria: Record<string, number>;
  };
  usuarios: number;
  knowledgeBase: { total: number; comCanonical: number; semCanonical: number; taxaAprendizado: number };
  inventario: { itensAtivos: number };
}

interface TestResult { ok: boolean; response?: string; latencyMs?: number; error?: string }

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
const CLAUDE_MODELS = [
  'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001',
  'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    ok:         { color: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle2 size={11} />, label: 'OK' },
    configured: { color: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle2 size={11} />, label: 'Configurado' },
    active:     { color: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle2 size={11} />, label: 'Ativo' },
    no_key:     { color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: <AlertTriangle size={11} />, label: 'Sem chave' },
    disabled:   { color: 'bg-gray-100  text-gray-500  border-gray-200',    icon: <XCircle size={11} />,      label: 'Desativado' },
    error:      { color: 'bg-red-100   text-red-700   border-red-200',     icon: <XCircle size={11} />,      label: 'Erro' },
  };
  const s = map[status] ?? map['error'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

function MiniBar({ value, max, color = 'bg-green-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-green-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  );
}

function SectionCard({ title, icon, children, action }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <span className="text-primary">{icon}</span>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── página principal ─────────────────────────────────────────────────────────

export const SystemConfigPage: React.FC = () => {
  const [health, setHealth]       = useState<Health | null>(null);
  const [aiConfig, setAiConfig]   = useState<AiConfig | null>(null);
  const [dbStats, setDbStats]     = useState<DbStats | null>(null);
  const [loadingHealth, setLH]    = useState(true);
  const [loadingStats, setLS]     = useState(true);
  const [savingConfig, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult | null>>({});
  const [testing, setTesting]     = useState<Record<string, boolean>>({});
  const [runningAction, setRA]    = useState<string | null>(null);
  const [localConfig, setLocalConfig] = useState<Partial<AiConfig>>({});

  const fetchHealth = useCallback(async () => {
    try {
      setLH(true);
      const [h, c] = await Promise.all([
        api.get('/admin/system/health'),
        api.get('/admin/system/ai-config'),
      ]);
      setHealth(h.data);
      setAiConfig(c.data);
      setLocalConfig(c.data);
    } catch { /* silencioso */ }
    finally { setLH(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLS(true);
      const r = await api.get('/admin/system/db-stats');
      setDbStats(r.data);
    } catch { /* silencioso */ }
    finally { setLS(false); }
  }, []);

  useEffect(() => { fetchHealth(); fetchStats(); }, [fetchHealth, fetchStats]);

  // Auto-refresh health every 30s
  useEffect(() => {
    const id = setInterval(fetchHealth, 30000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/admin/system/ai-config', localConfig);
      setAiConfig(res.data);
      toast.success('Configuração salva com sucesso!');
    } catch { toast.error('Erro ao salvar configuração'); }
    finally { setSaving(false); }
  };

  const testAi = async (service: 'gemini' | 'claude') => {
    setTesting(p => ({ ...p, [service]: true }));
    setTestResults(p => ({ ...p, [service]: null }));
    try {
      const res = await api.post(`/admin/system/test-ai/${service}`, {}, { timeout: 30000 });
      setTestResults(p => ({ ...p, [service]: res.data }));
      if (res.data.ok) toast.success(`${service} OK — ${res.data.latencyMs}ms`);
      else toast.error(`${service} falhou: ${res.data.error}`);
    } catch (e: any) {
      setTestResults(p => ({ ...p, [service]: { ok: false, error: e.message } }));
      toast.error(`Erro ao testar ${service}`);
    }
    setTesting(p => ({ ...p, [service]: false }));
  };

  const runAction = async (action: string, endpoint: string, body = {}) => {
    setRA(action);
    try {
      await api.post(endpoint, body, { timeout: 10000 });
      toast.success(`${action} disparado em background`);
    } catch { toast.error(`Erro ao executar ${action}`); }
    finally { setRA(null); }
  };

  const patch = (key: keyof AiConfig, value: any) =>
    setLocalConfig(p => ({ ...p, [key]: value }));

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isDirty = JSON.stringify(localConfig) !== JSON.stringify(aiConfig);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            Configurações do Sistema
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Integrações, agentes de IA, scrapers e monitoramento
          </p>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Uptime: {formatUptime(health.uptime)}
            </span>
          )}
          <button
            onClick={() => { fetchHealth(); fetchStats(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={13} className={loadingHealth ? 'animate-spin' : ''} />
            Atualizar
          </button>
          {isDirty && (
            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {savingConfig ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Salvar alterações
            </button>
          )}
        </div>
      </div>

      {/* ── Status Rápido ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {loadingHealth
          ? Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse h-20" />
            ))
          : health && ([
              {
                label: 'PostgreSQL', icon: <Database size={16} />,
                status: health.database.status,
                extra: `${health.database.latencyMs}ms`,
                color: health.database.status === 'ok' ? 'text-green-600' : 'text-red-600',
              },
              {
                label: 'Gemini API', icon: <Sparkles size={16} />,
                status: health.gemini.status,
                extra: health.gemini.model,
                color: health.gemini.hasKey ? 'text-blue-600' : 'text-amber-600',
              },
              {
                label: 'Claude API', icon: <Bot size={16} />,
                status: health.claude.status,
                extra: health.claude.model.split('-').slice(0, 2).join('-'),
                color: health.claude.hasKey ? 'text-violet-600' : 'text-amber-600',
              },
              {
                label: 'Scraper', icon: <Zap size={16} />,
                status: health.scraper.status,
                extra: health.scraper.status === 'active' ? 'em operação' : 'desativado',
                color: health.scraper.status === 'active' ? 'text-green-600' : 'text-gray-400',
              },
              {
                label: 'Atualizado', icon: <Clock size={16} />,
                status: 'ok',
                extra: new Date(health.timestamp).toLocaleTimeString('pt-BR'),
                color: 'text-gray-500',
              },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className={`flex items-center gap-1.5 mb-2 ${item.color}`}>
                  {item.icon}
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                </div>
                <StatusBadge status={item.status} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 truncate">{item.extra}</p>
              </div>
            )))
        }
      </div>

      {/* ── Agentes de IA ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gemini */}
        <SectionCard title="Gemini (Google)" icon={<Sparkles size={16} />}
          action={
            <button
              onClick={() => testAi('gemini')}
              disabled={testing['gemini']}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {testing['gemini'] ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
              Testar
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <StatusBadge status={health?.gemini.status ?? 'error'} />
            </div>

            {/* Modelo */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block">Modelo</label>
              <select
                value={localConfig.geminiModel ?? ''}
                onChange={e => patch('geminiModel', e.target.value)}
                className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Temperatura */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Temperatura</label>
                <span className="text-xs font-mono text-primary">{(localConfig.geminiTemperature ?? 0.7).toFixed(1)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1"
                value={localConfig.geminiTemperature ?? 0.7}
                onChange={e => patch('geminiTemperature', parseFloat(e.target.value))}
                className="w-full accent-primary h-1.5"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>Preciso</span><span>Criativo</span>
              </div>
            </div>

            {/* Max tokens */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block">Max Tokens</label>
              <input type="number" min={256} max={65536} step={256}
                value={localConfig.geminiMaxTokens ?? 8192}
                onChange={e => patch('geminiMaxTokens', parseInt(e.target.value))}
                className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Uso hoje */}
            {health?.callStats?.gemini && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Uso (desde último restart)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Hoje', value: health.callStats.gemini.today },
                    { label: 'Total', value: health.callStats.gemini.total },
                    { label: 'Erros', value: health.callStats.gemini.errors },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-800 rounded-md p-2">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                {health.callStats.gemini.lastCallAt && (
                  <p className="text-xs text-gray-400 text-center">
                    Último: {new Date(health.callStats.gemini.lastCallAt).toLocaleTimeString('pt-BR')} — {health.callStats.gemini.lastLatencyMs}ms
                  </p>
                )}
              </div>
            )}

            {/* Resultado do teste */}
            {testResults['gemini'] && (
              <div className={`rounded-lg p-3 text-xs ${testResults['gemini']?.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {testResults['gemini']?.ok
                  ? <><CheckCircle2 size={12} className="inline mr-1" />OK — resposta: "{testResults['gemini']?.response}" ({testResults['gemini']?.latencyMs}ms)</>
                  : <><XCircle size={12} className="inline mr-1" />Erro: {testResults['gemini']?.error}</>
                }
              </div>
            )}
          </div>
        </SectionCard>

        {/* Claude */}
        <SectionCard title="Claude (Anthropic)" icon={<Bot size={16} />}
          action={
            <button
              onClick={() => testAi('claude')}
              disabled={testing['claude']}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {testing['claude'] ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
              Testar
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <StatusBadge status={health?.claude.status ?? 'error'} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block">Modelo</label>
              <select
                value={localConfig.claudeModel ?? ''}
                onChange={e => patch('claudeModel', e.target.value)}
                className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CLAUDE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Temperatura</label>
                <span className="text-xs font-mono text-violet-600">{(localConfig.claudeTemperature ?? 0.8).toFixed(1)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1"
                value={localConfig.claudeTemperature ?? 0.8}
                onChange={e => patch('claudeTemperature', parseFloat(e.target.value))}
                className="w-full accent-violet-600 h-1.5"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>Preciso</span><span>Criativo</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block">Max Tokens</label>
              <input type="number" min={256} max={32768} step={256}
                value={localConfig.claudeMaxTokens ?? 4096}
                onChange={e => patch('claudeMaxTokens', parseInt(e.target.value))}
                className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {health?.callStats?.claude && (
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 space-y-2">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300">Uso (desde último restart)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Hoje', value: health.callStats.claude.today },
                    { label: 'Total', value: health.callStats.claude.total },
                    { label: 'Erros', value: health.callStats.claude.errors },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-800 rounded-md p-2">
                      <div className="text-sm font-bold text-violet-600 dark:text-violet-400">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                {health.callStats.claude.lastCallAt && (
                  <p className="text-xs text-gray-400 text-center">
                    Último: {new Date(health.callStats.claude.lastCallAt).toLocaleTimeString('pt-BR')} — {health.callStats.claude.lastLatencyMs}ms
                  </p>
                )}
              </div>
            )}

            {testResults['claude'] && (
              <div className={`rounded-lg p-3 text-xs ${testResults['claude']?.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {testResults['claude']?.ok
                  ? <><CheckCircle2 size={12} className="inline mr-1" />OK — resposta: "{testResults['claude']?.response}" ({testResults['claude']?.latencyMs}ms)</>
                  : <><XCircle size={12} className="inline mr-1" />Erro: {testResults['claude']?.error}</>
                }
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Cadeia de Fallback + Classificação ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Cadeia de Geração */}
        <SectionCard title="Cadeia de Geração de Receitas" icon={<ArrowUpDown size={16} />}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Info size={12} />
              Se o 1º falhar, tenta o 2º, e assim por diante.
            </p>
            {(localConfig.recipeChain ?? ['claude', 'gemini', 'mock']).map((item, idx) => (
              <div key={item} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-blue-500' : 'bg-gray-400'
                }`}>{idx + 1}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 capitalize">{item}</span>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['claude', 'gemini', 'mock'].map(opt => (
                <button key={opt}
                  onClick={() => {
                    const cur = localConfig.recipeChain ?? ['claude', 'gemini', 'mock'];
                    const next = cur[0] === opt ? cur : [opt, ...cur.filter(x => x !== opt)];
                    patch('recipeChain', next);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    (localConfig.recipeChain ?? [])[0] === opt
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Priorizar {opt}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Classificação de Produtos */}
        <SectionCard title="Classificação de Produtos (IA)" icon={<Cpu size={16} />}>
          <div className="space-y-4">
            {/* Threshold */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Threshold de Confiança
                </label>
                <span className="text-sm font-bold text-primary">{localConfig.classificationThreshold ?? 75}%</span>
              </div>
              <input type="range" min={50} max={95} step={5}
                value={localConfig.classificationThreshold ?? 75}
                onChange={e => patch('classificationThreshold', parseInt(e.target.value))}
                className="w-full accent-primary h-1.5"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>Permissivo (50%)</span><span>Rigoroso (95%)</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Acima deste valor → auto-confirmado. Abaixo → validação manual no app.
              </p>
            </div>

            {/* Auto-confirmar toggle */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Auto-confirmar acima do threshold</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Desativar = sempre pede validação manual</p>
              </div>
              <Toggle
                value={localConfig.autoConfirmAboveThreshold ?? true}
                onChange={v => patch('autoConfirmAboveThreshold', v)}
              />
            </div>

            {/* Batch size */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Batch size (produtos por chamada)</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Maior = mais rápido, mas mais chance de timeout</p>
              </div>
              <input type="number" min={5} max={50} step={5}
                value={localConfig.classificationBatchSize ?? 20}
                onChange={e => patch('classificationBatchSize', parseInt(e.target.value))}
                className="w-16 text-xs text-center border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* KB Stats */}
            {dbStats && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Knowledge Base</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Total de entradas</span>
                  <span className="font-bold">{dbStats.knowledgeBase.total.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Com canonical</span>
                    <span className="font-bold text-green-600">{dbStats.knowledgeBase.comCanonical} ({dbStats.knowledgeBase.taxaAprendizado}%)</span>
                  </div>
                  <MiniBar value={dbStats.knowledgeBase.comCanonical} max={dbStats.knowledgeBase.total} color="bg-green-500" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Sem canonical</span>
                  <span className="font-bold text-amber-600">{dbStats.knowledgeBase.semCanonical}</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Scrapers + Ações ──────────────────────────────────────────────── */}
      <SectionCard title="Scrapers & Crawlers" icon={<Zap size={16} />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Toggles */}
          <div className="space-y-3 lg:col-span-1">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-3">Fontes ativas</p>
            {([
              { key: 'scraperEnabled',      label: 'Scraper (geral)',     desc: 'Habilita todos os scrapers' },
              { key: 'tudoGostosoEnabled',  label: 'TudoGostoso',        desc: 'Scrapa receitas do TudoGostoso' },
              { key: 'receitariaEnabled',   label: 'Receiteria',         desc: 'Scrapa receitas da Receiteria' },
              { key: 'freepikEnabled',      label: 'Freepik (imagens)',  desc: 'Busca imagens via Puppeteer' },
              { key: 'scraperCronEnabled',  label: 'Cron automático',    desc: 'Executa a cada hora' },
            ] as { key: keyof AiConfig; label: string; desc: string }[]).map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                </div>
                <Toggle
                  value={!!(localConfig as any)[item.key]}
                  onChange={v => patch(item.key, v)}
                />
              </div>
            ))}
          </div>

          {/* Ações manuais */}
          <div className="space-y-3 lg:col-span-1">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-3">Ações manuais</p>
            {([
              {
                id: 'crawler', label: 'Executar Crawler', icon: <Play size={13} />,
                desc: 'Busca receitas para ingredientes com poucas opções',
                endpoint: '/admin/system/run-crawler', color: 'border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20',
              },
              {
                id: 'scraper', label: 'Executar Scraper', icon: <Zap size={13} />,
                desc: 'Scraping de receitas para ingredientes populares',
                endpoint: '/admin/system/run-scraper', color: 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20',
              },
              {
                id: 'curadas', label: 'Popular Receitas Curadas', icon: <Sparkles size={13} />,
                desc: 'Gera receitas BR clássicas via Gemini (todos os modos)',
                endpoint: '/admin/system/popular-receitas-curadas', color: 'border-violet-200 text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20',
              },
            ]).map(action => (
              <button
                key={action.id}
                disabled={runningAction !== null}
                onClick={() => runAction(action.label, action.endpoint)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
              >
                <span className="mt-0.5">
                  {runningAction === action.label ? <Loader2 size={13} className="animate-spin" /> : action.icon}
                </span>
                <div>
                  <p className="text-xs font-bold">{action.label}</p>
                  <p className="text-xs opacity-70 font-normal mt-0.5">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Contadores de scrapers */}
          <div className="space-y-3 lg:col-span-1">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-3">Contadores (desde restart)</p>
            {health?.callStats && (
              <div className="space-y-2">
                {([
                  { key: 'scraper_tudogostoso', label: 'TudoGostoso',    color: 'bg-orange-500' },
                  { key: 'scraper_receiteria',  label: 'Receiteria',     color: 'bg-red-500' },
                  { key: 'freepik',             label: 'Freepik',        color: 'bg-cyan-500' },
                  { key: 'ocr',                 label: 'OCR',            color: 'bg-amber-500' },
                ]).map(s => {
                  const stat = health.callStats[s.key];
                  if (!stat) return null;
                  const maxCalls = Math.max(...Object.values(health.callStats).map(x => x.total), 1);
                  return (
                    <div key={s.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300">{s.label}</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{stat.total} calls</span>
                      </div>
                      <MiniBar value={stat.total} max={maxCalls} color={s.color} />
                      {stat.errors > 0 && (
                        <p className="text-xs text-red-500">{stat.errors} erro(s)</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Banco de Dados ────────────────────────────────────────────────── */}
      <SectionCard title="Banco de Dados" icon={<Database size={16} />}
        action={
          <button onClick={fetchStats} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw size={13} className={loadingStats ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      >
        {loadingStats || !dbStats
          ? <div className="h-32 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg" />
          : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Receitas */}
              <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-3 flex items-center gap-1.5">
                  <Activity size={13} /> Receitas
                </p>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
                  {dbStats.receitas.total.toLocaleString('pt-BR')}
                </div>
                <div className="space-y-1.5 mt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 dark:text-green-400">✅ Moderadas</span>
                    <span className="font-bold">{dbStats.receitas.ok}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600">⏳ Pendentes</span>
                    <span className="font-bold">{dbStats.receitas.pendentes}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-500">❌ Rejeitadas</span>
                    <span className="font-bold">{dbStats.receitas.rejeitadas}</span>
                  </div>
                  {/* Por modo */}
                  <div className="pt-2 border-t border-green-200 dark:border-green-700 mt-2 space-y-1">
                    {Object.entries(dbStats.receitas.porModo).map(([modo, n]) => (
                      <div key={modo} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="capitalize text-gray-600 dark:text-gray-300">{modo}</span>
                            <span className="font-bold">{n}</span>
                          </div>
                          <MiniBar value={n} max={dbStats.receitas.ok} color="bg-green-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Usuários + Inventário */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                    <Server size={13} /> Usuários
                  </p>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {dbStats.usuarios.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-blue-500 mt-1">cadastrados</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">🧺 Inventário</p>
                  <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                    {dbStats.inventario.itensAtivos.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-amber-500 mt-1">itens ativos</p>
                </div>
              </div>

              {/* KB */}
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-3 flex items-center gap-1.5">
                  <Cpu size={13} /> Knowledge Base
                </p>
                <div className="text-2xl font-bold text-violet-800 dark:text-violet-200 mb-1">
                  {dbStats.knowledgeBase.total.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-violet-500">entradas totais</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Com canonical</span>
                    <span className="font-bold text-green-600">{dbStats.knowledgeBase.comCanonical}</span>
                  </div>
                  <MiniBar value={dbStats.knowledgeBase.comCanonical} max={dbStats.knowledgeBase.total} color="bg-green-500" />
                  <div className="text-center">
                    <span className={`text-xs font-bold ${dbStats.knowledgeBase.taxaAprendizado > 70 ? 'text-green-600' : 'text-amber-600'}`}>
                      {dbStats.knowledgeBase.taxaAprendizado}% taxa de aprendizado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </SectionCard>

      {/* ── Monitor de Chamadas ───────────────────────────────────────────── */}
      <SectionCard title="Monitor de Chamadas de API" icon={<BarChart2 size={16} />}
        action={
          <button
            onClick={() => runAction('Reset contadores', '/admin/system/usage-stats/reset-daily')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-500"
          >
            <RefreshCw size={12} /> Resetar diário
          </button>
        }
      >
        {health?.callStats
          ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">Serviço</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">Hoje</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">Total</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">Erros</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">Latência</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-500 dark:text-gray-400">Última chamada</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(health.callStats).map(([service, stat]) => (
                    <tr key={service} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-200 capitalize">
                        {service.replace('scraper_', '')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">{stat.today}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-300">{stat.total}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${stat.errors > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {stat.errors > 0 ? stat.errors : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500">
                        {stat.lastLatencyMs > 0 ? `${stat.lastLatencyMs}ms` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">
                        {stat.lastCallAt ? new Date(stat.lastCallAt).toLocaleTimeString('pt-BR') : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-16">
                          <MiniBar
                            value={stat.total}
                            max={Math.max(...Object.values(health.callStats).map(x => x.total), 1)}
                            color={stat.errors > 0 ? 'bg-red-400' : 'bg-primary'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1.5">
                <Info size={11} />
                Contadores resetam ao reiniciar o backend. Para persistência, integre com Redis ou um serviço de métricas.
              </p>
            </div>
          )
          : <div className="h-24 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg" />
        }
      </SectionCard>
    </div>
  );
};
