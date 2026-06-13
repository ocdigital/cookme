import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, RefreshCw, User, ChevronDown, ChevronRight, BookOpen, KeyRound, Copy, Check } from 'lucide-react';
import api from '../services/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface UsuarioInfo {
  id: string;
  nome: string;
  email: string;
  role: string;
  email_verificado: boolean;
  ultimo_acesso: string | null;
  criado_em: string;
}

interface InventarioItem {
  id: string;
  produto?: {
    nome: string;
    nome_display?: string | null;
    marca?: { nome: string };
    categoria?: { nome: string };
  };
  quantidade: number;
  unidade: string;
  data_validade: string | null;
  local_armazenagem: string | null;
  _ingrediente_receita: boolean | null;
}

interface CompraItem {
  produto?: { nome: string; marca?: { nome: string } };
  quantidade: number;
  unidade: string;
  preco_unitario: number;
}

interface Compra {
  id: string;
  data_compra: string;
  local_compra: string | null;
  preco_total: number;
  itens?: CompraItem[];
}

interface ReceitaDisponivel {
  id: string;
  nome: string;
  categoria: string | null;
  tags_dieta: string[] | null;
  cobertura_pct: number;
  disponivel: boolean;
  tem_protagonista: boolean;
  faltando: string[];
  ingredientes_chave: string[];
  vezes_executada: number;
  avaliacao_media: number | null;
  usa_vencendo: string[];
}

interface ReceitasDisponiveisData {
  resumo: {
    ingredientes_ativos: number;
    modo_alimentar: string;
    total_receitas: number;
    disponiveis: number;
    com_protagonista: number;
    parciais: number;
    ingredientes_vencendo: string[];
  };
  ingredientes_despensa: string[];
  receitas: ReceitaDisponivel[];
}

type Tab = 'compras' | 'inventario' | 'disponiveis';

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val: string | null | undefined) =>
  val ? new Date(val).toLocaleDateString('pt-BR') : '—';

const fmtMoeda = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—';

const fmtDateTime = (val: string | null | undefined) => {
  if (!val) return '—';
  return new Date(val).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const vencimentoBadge = (dataValidade: string | null) => {
  if (!dataValidade) return null;
  const diff = Math.ceil((new Date(dataValidade).getTime() - Date.now()) / 86400000);
  if (diff < 0) return <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">vencido</span>;
  if (diff <= 7) return <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">{diff}d</span>;
  return <span className="text-xs text-gray-400">{fmt(dataValidade)}</span>;
};

// ── Component ────────────────────────────────────────────────────────────────

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('compras');
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [receitasDisponiveis, setReceitasDisponiveis] = useState<ReceitasDisponiveisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompra, setExpandedCompra] = useState<string | null>(null);
  const [showDespensa, setShowDespensa] = useState(false);
  const [filtroDisp, setFiltroDisp] = useState<'todos' | 'disponivel' | 'parcial'>('todos');
  const [resetModal, setResetModal] = useState<{ open: boolean; senha?: string; loading: boolean }>({ open: false, loading: false });
  const [copied, setCopied] = useState(false);

  const runAction = async (endpoint: string, label: string) => {
    if (!id) return;
    setActionLoading(label);
    setActionResult(null);
    setError(null);
    try {
      // timeout maior: reclassificar (Gemini batch) e crawlear (scraping) demoram 30-120s
      const r = await api.post(`/admin/usuarios/${id}/${endpoint}`, {}, { timeout: 120000 });
      const d = r.data;
      if (endpoint === 'reclassificar-despensa') {
        setActionResult(`✓ Reclassificação concluída: ${d.atualizados}/${d.nomes_unicos} produtos atualizados. Recarregando despensa...`);
        setTimeout(() => loadTab('inventario'), 800);
      } else {
        setActionResult(d.ok
          ? `✓ Crawl concluído: ${d.total_salvas} receitas salvas para ${d.ingredientes_usados?.length} ingredientes.`
          : `⚠ ${d.motivo}`
        );
        if (d.ok) setTimeout(() => loadTab('disponiveis'), 800);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Erro');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetSenha = async () => {
    if (!id) return;
    setResetModal({ open: true, loading: true });
    try {
      const r = await api.patch(`/admin/usuarios/${id}/reset-senha`);
      setResetModal({ open: true, loading: false, senha: r.data.senha_temporaria });
    } catch (e: any) {
      setResetModal({ open: false, loading: false });
      setError(e?.response?.data?.message ?? 'Erro ao resetar senha');
    }
  };

  const handleCopySenha = () => {
    if (!resetModal.senha) return;
    navigator.clipboard.writeText(resetModal.senha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load user info once
  useEffect(() => {
    if (!id) return;
    api.get(`/admin/usuarios?search=&page=1&limit=200`)
      .then(r => {
        const u = (r.data.data ?? []).find((u: any) => u.id === id);
        if (u) setUsuario(u);
      })
      .catch(() => {});
  }, [id]);

  const loadTab = useCallback(async (t: Tab) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (t === 'inventario') {
        const r = await api.get(`/admin/usuarios/${id}/inventario`);
        setInventario(Array.isArray(r.data) ? r.data : r.data.data ?? []);
      } else if (t === 'compras') {
        const r = await api.get(`/admin/usuarios/${id}/compras?limit=100`);
        setCompras(Array.isArray(r.data) ? r.data : r.data.data ?? []);
      } else {
        const r = await api.get(`/admin/usuarios/${id}/receitas-disponiveis`);
        setReceitasDisponiveis(r.data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const switchTab = (t: Tab) => { setTab(t); };

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number | null }[] = [
    { key: 'compras', label: 'Compras', icon: <ShoppingCart size={14} />, count: compras.length || null },
    { key: 'inventario', label: 'Despensa', icon: <Package size={14} />, count: inventario.length || null },
    { key: 'disponiveis', label: 'Receitas Disponíveis', icon: <BookOpen size={14} />, count: receitasDisponiveis?.resumo.total_receitas ?? null },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft size={16} /> Usuários
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{usuario?.nome ?? id}</span>
      </div>

      {/* User info card */}
      {usuario && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5 flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{usuario.nome}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{usuario.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 items-center">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 capitalize">
              {usuario.role}
            </span>
            <span>Cadastro: <strong>{fmt(usuario.criado_em)}</strong></span>
            <span>Último acesso: <strong>{fmtDateTime(usuario.ultimo_acesso)}</strong></span>
            {usuario.email_verificado
              ? <span className="text-green-600 dark:text-green-400 text-xs">✓ email verificado</span>
              : <span className="text-orange-500 text-xs">⚠ email não verificado</span>
            }
          </div>
          <div className="ml-auto flex items-center">
            <button
              onClick={handleResetSenha}
              disabled={resetModal.loading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 disabled:opacity-50 transition-colors font-medium"
              title="Gera senha temporária para o usuário"
            >
              {resetModal.loading ? <RefreshCw size={12} className="animate-spin" /> : <KeyRound size={12} />}
              Reset Senha
            </button>
          </div>
        </div>
      )}

      {/* Reset Senha Modal */}
      {resetModal.open && !resetModal.loading && resetModal.senha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={18} className="text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Senha Temporária</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Senha gerada para <strong>{usuario?.nome}</strong>. Informe ao usuário — ele deverá trocá-la no próximo acesso.
            </p>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 mb-4">
              <span className="font-mono text-lg font-bold tracking-widest text-gray-900 dark:text-gray-100 flex-1 select-all">
                {resetModal.senha}
              </span>
              <button
                onClick={handleCopySenha}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                title="Copiar"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-4">
              ⚠ Esta senha não será exibida novamente.
            </p>
            <button
              onClick={() => setResetModal({ open: false, loading: false })}
              className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.icon}
            {t.label}
            {t.count !== null && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 mb-1">
          {(tab === 'inventario' || tab === 'disponiveis') && (
            <button
              onClick={() => runAction('reclassificar-despensa', 'reclassificar')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-colors font-medium"
              title="Reclassifica produtos como ingrediente ou não via IA"
            >
              {actionLoading === 'reclassificar'
                ? <RefreshCw size={12} className="animate-spin" />
                : '🧠'}
              Atualizar Despensa
            </button>
          )}
          {tab === 'disponiveis' && (
            <button
              onClick={() => runAction('crawlear-receitas', 'crawlear')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors font-medium"
              title="Busca receitas nos sites para os ingredientes da despensa"
            >
              {actionLoading === 'crawlear'
                ? <RefreshCw size={12} className="animate-spin" />
                : '🍳'}
              Atualizar Receitas
            </button>
          )}
          <button
            onClick={() => loadTab(tab)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2"
            title="Recarregar"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Action result */}
      {actionResult && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm flex items-center justify-between">
          <span>{actionResult}</span>
          <button onClick={() => setActionResult(null)} className="text-blue-400 hover:text-blue-600 ml-2">✕</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Despensa ────────────────────────────────────────────────────────── */}
      {!loading && tab === 'inventario' && (() => {
        // Agrupa por canonical (nome_display) — "Cebola Kg" e "Cebola Nacional Kg" → uma linha "cebola"
        type Grupo = {
          canonical: string;
          ocr_nomes: string[];
          quantidade_total: number;
          unidade: string;
          validade_mais_proxima: string | null;
          ingrediente_receita: boolean | null;
          n_produtos: number;
        };
        const grupos = new Map<string, Grupo>();
        for (const item of inventario) {
          const canonical = item.produto?.nome_display ?? item.produto?.nome ?? '?';
          const existing = grupos.get(canonical);
          const nomeOcr = item.produto?.nome ?? '';
          if (existing) {
            existing.quantidade_total += Number(item.quantidade ?? 0);
            if (nomeOcr && !existing.ocr_nomes.includes(nomeOcr)) existing.ocr_nomes.push(nomeOcr);
            // mantém validade mais próxima
            if (item.data_validade && (!existing.validade_mais_proxima || item.data_validade < existing.validade_mais_proxima)) {
              existing.validade_mais_proxima = item.data_validade;
            }
            existing.n_produtos++;
          } else {
            grupos.set(canonical, {
              canonical,
              ocr_nomes: nomeOcr ? [nomeOcr] : [],
              quantidade_total: Number(item.quantidade ?? 0),
              unidade: item.unidade,
              validade_mais_proxima: item.data_validade,
              ingrediente_receita: item._ingrediente_receita,
              n_produtos: 1,
            });
          }
        }
        const linhas = [...grupos.values()].sort((a, b) => a.canonical.localeCompare(b.canonical));

        return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
            {linhas.length} ingredientes únicos · {inventario.length} itens no inventário
          </div>
          {linhas.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Nenhum ingrediente na despensa</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Ingrediente (canonical)</th>
                  <th className="px-4 py-3">Nomes OCR</th>
                  <th className="px-4 py-3">Qtd total</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3" title="ingrediente_receita flag">🥘</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {linhas.map(g => (
                  <tr key={g.canonical} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${g.ingrediente_receita === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                      {g.canonical}
                      {g.n_produtos > 1 && (
                        <span className="ml-1.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded px-1">{g.n_produtos}x</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 text-xs">
                      {g.ocr_nomes.join(' · ')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                      {g.quantidade_total} {g.unidade}
                    </td>
                    <td className="px-4 py-2.5">
                      {vencimentoBadge(g.validade_mais_proxima)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {g.ingrediente_receita === true
                        ? <span className="text-green-500 text-xs font-bold">✓</span>
                        : g.ingrediente_receita === false
                        ? <span className="text-red-400 text-xs">✗</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        );
      })()}

      {/* ── Compras ─────────────────────────────────────────────────────────── */}
      {!loading && tab === 'compras' && (
        <div className="space-y-2">
          {compras.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Nenhuma compra registrada</p>
          ) : compras.map(compra => (
            <div key={compra.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left"
                onClick={() => setExpandedCompra(expandedCompra === compra.id ? null : compra.id)}
              >
                {expandedCompra === compra.id
                  ? <ChevronDown size={15} className="text-gray-400 shrink-0" />
                  : <ChevronRight size={15} className="text-gray-400 shrink-0" />
                }
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{fmt(compra.data_compra)}</span>
                {compra.local_compra && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{compra.local_compra}</span>
                )}
                <span className="ml-auto font-semibold text-primary text-sm">{fmtMoeda(compra.preco_total)}</span>
                {compra.itens && (
                  <span className="text-xs text-gray-400 ml-2">{compra.itens.length} itens</span>
                )}
              </button>
              {expandedCompra === compra.id && compra.itens && compra.itens.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/30">
                      <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                        <th className="px-4 py-2">Produto</th>
                        <th className="px-4 py-2">Marca</th>
                        <th className="px-4 py-2">Qtd</th>
                        <th className="px-4 py-2">Preço Unit.</th>
                        <th className="px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {compra.itens.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.produto?.nome ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-400 dark:text-gray-500 text-xs">{item.produto?.marca?.nome ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{item.quantidade} {item.unidade}</td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{fmtMoeda(item.preco_unitario)}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-200 font-medium">{fmtMoeda(item.preco_unitario * item.quantidade)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Receitas Disponíveis ─────────────────────────────────────────────── */}
      {!loading && tab === 'disponiveis' && (
        <div className="space-y-4">
          {!receitasDisponiveis ? (
            <p className="text-center text-gray-400 py-10 text-sm">Nenhum dado carregado</p>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Ingredientes ativos', val: receitasDisponiveis.resumo.ingredientes_ativos, color: 'blue' },
                  { label: 'Disponíveis (≥70%)', val: receitasDisponiveis.resumo.disponiveis, color: 'green' },
                  { label: 'Com protagonista', val: receitasDisponiveis.resumo.com_protagonista, color: 'yellow' },
                  { label: 'Parciais (<70%)', val: receitasDisponiveis.resumo.parciais, color: 'gray' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
                    <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Modo alimentar + ingredientes vencendo */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium capitalize">
                  modo: {receitasDisponiveis.resumo.modo_alimentar}
                </span>
                {receitasDisponiveis.resumo.ingredientes_vencendo.length > 0 && (
                  <span className="text-xs text-yellow-700 dark:text-yellow-400">
                    ⚠ vencendo: {receitasDisponiveis.resumo.ingredientes_vencendo.join(', ')}
                  </span>
                )}
              </div>

              {/* Despensa completa (colapsável) */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl transition-colors"
                  onClick={() => setShowDespensa(!showDespensa)}
                >
                  <span>Despensa ({receitasDisponiveis.ingredientes_despensa.length} ingredientes normalizados)</span>
                  {showDespensa ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                {showDespensa && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-700 pt-3">
                    {receitasDisponiveis.ingredientes_despensa.length === 0
                      ? <span className="text-xs text-gray-400">Despensa vazia</span>
                      : receitasDisponiveis.ingredientes_despensa.map((ing, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                            {ing}
                          </span>
                        ))
                    }
                  </div>
                )}
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                {(['todos', 'disponivel', 'parcial'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltroDisp(f)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      filtroDisp === f
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f === 'todos' ? `Todos (${receitasDisponiveis.receitas.length})` :
                     f === 'disponivel' ? `Disponíveis (${receitasDisponiveis.resumo.disponiveis})` :
                     `Parciais (${receitasDisponiveis.resumo.com_protagonista + receitasDisponiveis.resumo.parciais})`}
                  </button>
                ))}
              </div>

              {/* Tabela */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <th className="px-4 py-3">Receita</th>
                      <th className="px-4 py-3">Cobertura</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Faltando</th>
                      <th className="px-4 py-3">Tags</th>
                      <th className="px-4 py-3">Execuções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {receitasDisponiveis.receitas
                      .filter(r =>
                        filtroDisp === 'todos' ? true :
                        filtroDisp === 'disponivel' ? r.disponivel :
                        !r.disponivel
                      )
                      .map(r => (
                        <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${r.disponivel ? '' : 'opacity-75'}`}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{r.nome}</p>
                            {r.categoria && (
                              <p className="text-xs text-gray-400 capitalize">{r.categoria}</p>
                            )}
                            {r.usa_vencendo.length > 0 && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">⚠ usa vencendo: {r.usa_vencendo.join(', ')}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${r.cobertura_pct >= 70 ? 'bg-green-500' : r.cobertura_pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                  style={{ width: `${r.cobertura_pct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${r.cobertura_pct >= 70 ? 'text-green-600 dark:text-green-400' : r.cobertura_pct >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>
                                {r.cobertura_pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {r.disponivel ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">✓ disponível</span>
                            ) : r.tem_protagonista ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">protagonist</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">parcial</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {r.faltando.length === 0 ? (
                              <span className="text-xs text-green-500">nenhum</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {r.faltando.map((f, i) => (
                                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(r.tags_dieta || []).map((t, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                            {r.vezes_executada > 0 ? (
                              <span>{r.vezes_executada}× {r.avaliacao_media ? `(⭐${r.avaliacao_media.toFixed(1)})` : ''}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetailPage;
