import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UtensilsCrossed,
  Package,
  ShoppingCart,
  Archive,
  Bell,
  List,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Loader,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Link,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../services/adminService';

interface EntityCard {
  key: string;
  label: string;
  descricao: string;
  icon: React.ReactNode;
  cor: string;
  corBg: string;
  aviso?: string;
}

const ENTITIES: EntityCard[] = [
  {
    key: 'usuarios',
    label: 'Usuários',
    descricao: 'Remove todos os usuários não-admin e todos os dados vinculados (compras, inventário, listas, notificações)',
    icon: <Users size={20} />,
    cor: 'text-red-600',
    corBg: 'bg-red-50 border-red-200',
    aviso: 'Remove usuários + TODOS os dados vinculados em cascata',
  },
  {
    key: 'receitas',
    label: 'Receitas',
    descricao: 'Remove todas as receitas do banco compartilhado, ingredientes, favoritas e histórico de execução',
    icon: <UtensilsCrossed size={20} />,
    cor: 'text-orange-600',
    corBg: 'bg-orange-50 border-orange-200',
  },
  {
    key: 'produtos',
    label: 'Produtos',
    descricao: 'Remove todos os produtos do catálogo, base de conhecimento, inventário e itens de compras',
    icon: <Package size={20} />,
    cor: 'text-yellow-600',
    corBg: 'bg-yellow-50 border-yellow-200',
    aviso: 'Também limpa inventário e itens de compras (dependências)',
  },
  {
    key: 'compras',
    label: 'Compras',
    descricao: 'Remove todas as compras e seus itens do histórico de todos os usuários',
    icon: <ShoppingCart size={20} />,
    cor: 'text-blue-600',
    corBg: 'bg-blue-50 border-blue-200',
  },
  {
    key: 'inventario',
    label: 'Inventário / Despensa',
    descricao: 'Remove todos os itens do inventário (despensa) de todos os usuários',
    icon: <Archive size={20} />,
    cor: 'text-purple-600',
    corBg: 'bg-purple-50 border-purple-200',
  },
  {
    key: 'notificacoes',
    label: 'Notificações',
    descricao: 'Remove todas as notificações do sistema',
    icon: <Bell size={20} />,
    cor: 'text-pink-600',
    corBg: 'bg-pink-50 border-pink-200',
  },
  {
    key: 'listas',
    label: 'Listas de Compras',
    descricao: 'Remove todas as listas de compras e seus itens',
    icon: <List size={20} />,
    cor: 'text-teal-600',
    corBg: 'bg-teal-50 border-teal-200',
  },
];

interface ConfirmState {
  entidade: string | null;
  label: string;
  digitado: string;
}

const TEMAS_SEED = [
  'Frango grelhado', 'Carne moída', 'Peixe e frutos do mar', 'Macarrão e massas',
  'Arroz temperado', 'Feijão e leguminosas', 'Ovos e café da manhã', 'Sopas e caldos',
  'Bolos e tortas doces', 'Vegetariano e vegano', 'Saladas e bowls', 'Costela e churrasco',
  'Frutos do mar', 'Risoto', 'Strogonoff', 'Feijoada e carnes cozidas', 'Doces e sobremesas',
  'Pizza caseira', 'Hambúrguer artesanal', 'Tapioca e crepioca',
];

export const DataManagementPage: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ entidade: null, label: '', digitado: '' });

  const [seeding, setSeeding] = useState(false);
  const [seedTema, setSeedTema] = useState('');
  const [seedQtd, setSeedQtd] = useState(5);
  const [seedResult, setSeedResult] = useState<{ salvas: number; puladas: number; erros: number; total: number } | null>(null);
  const [seedOpen, setSeedOpen] = useState(false);

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ nome?: string; erro?: string } | null>(null);

  const [crawlIngredientes, setCrawlIngredientes] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<{ ingredientes: string[]; totalSalvas: number } | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      setLoadingCounts(true);
      const data = await adminService.getDataCounts();
      setCounts(data);
    } catch {
      toast.error('Falha ao carregar contagens');
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const abrirConfirm = (entity: EntityCard) => {
    setConfirm({ entidade: entity.key, label: entity.label, digitado: '' });
  };

  const fecharConfirm = () => {
    setConfirm({ entidade: null, label: '', digitado: '' });
  };

  const executarSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const opts: { tema?: string; receitasPorTema?: number } = { receitasPorTema: seedQtd };
      if (seedTema) opts.tema = seedTema;
      const resultado = await adminService.seedReceitas(opts);
      setSeedResult(resultado);
      toast.success(`✅ ${resultado.salvas} receita(s) salva(s) no banco!`);
      await loadCounts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao gerar receitas');
    } finally {
      setSeeding(false);
    }
  };

  const executarImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await adminService.importarReceitaUrl(importUrl.trim());
      if (res.ok) {
        setImportResult({ nome: res.receita?.titulo || res.receita?.nome || 'Receita importada' });
        toast.success(`Receita importada: "${res.receita?.titulo || res.receita?.nome}"`);
        setImportUrl('');
        await loadCounts();
      } else {
        setImportResult({ erro: res.erro || 'Erro desconhecido' });
        toast.error(res.erro || 'Erro ao importar receita');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao importar';
      setImportResult({ erro: msg });
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const executarCrawl = async () => {
    setCrawling(true);
    setCrawlResult(null);
    try {
      const ingredientes = crawlIngredientes.trim()
        ? crawlIngredientes.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      const res = await adminService.crawlearReceitas(ingredientes);
      setCrawlResult({ ingredientes: res.ingredientes, totalSalvas: res.totalSalvas });
      toast.success(`Crawl concluído: ${res.totalSalvas} receita(s) salva(s)`);
      await loadCounts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro no crawl');
    } finally {
      setCrawling(false);
    }
  };

  const executarLimpeza = async () => {
    if (!confirm.entidade) return;
    if (confirm.digitado.toLowerCase() !== 'limpar') return;

    setDeleting(confirm.entidade);
    fecharConfirm();

    try {
      const resultado = await adminService.limparDados(confirm.entidade);
      toast.success(`✅ ${resultado.deletados} registro(s) removido(s) com sucesso`);
      await loadCounts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao limpar dados');
    } finally {
      setDeleting(null);
    }
  };

  const getCount = (key: string) => {
    if (loadingCounts) return '…';
    return counts[key] ?? 0;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between -mt-1">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Gerenciar Dados</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Limpe tabelas individualmente — útil em ambiente de testes
          </p>
        </div>
        <button
          onClick={loadCounts}
          disabled={loadingCounts}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loadingCounts ? 'animate-spin' : ''} />
          Atualizar contagens
        </button>
      </header>

      {/* Aviso */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
        <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Atenção:</strong> estas ações são <strong>irreversíveis</strong>. Use apenas em ambiente de testes.
          Para confirmar, você precisará digitar <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">limpar</code> na caixa de confirmação.
        </p>
      </div>

      {/* Seed Receitas */}
      <div className="border border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-900/10">
        <button
          onClick={() => setSeedOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            Seed de Receitas via IA
            <span className="text-xs font-normal text-green-600 dark:text-green-500 ml-1">
              — gera receitas com Gemini e salva no banco
            </span>
          </div>
          {seedOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {seedOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-green-200 dark:border-green-800 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Tema (vazio = todos os 30 temas)</label>
                <select
                  value={seedTema}
                  onChange={(e) => setSeedTema(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Todos os temas ({TEMAS_SEED.length} categorias)</option>
                  {TEMAS_SEED.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Receitas por tema</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={seedQtd}
                  onChange={(e) => setSeedQtd(Number(e.target.value))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={executarSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {seeding ? (
                  <>
                    <Loader size={13} className="animate-spin" />
                    Gerando receitas… (pode demorar)
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Gerar receitas
                  </>
                )}
              </button>

              {seedResult && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="text-green-600 font-medium">{seedResult.salvas} salvas</span>
                  {' · '}
                  <span>{seedResult.puladas} já existiam</span>
                  {seedResult.erros > 0 && (
                    <><span className="text-red-500"> · {seedResult.erros} erros</span></>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500">
              Todos os temas: ~{TEMAS_SEED.length * seedQtd} receitas geradas. Use um tema específico para testes rápidos.
            </p>
          </div>
        )}
      </div>

      {/* Importar receita por URL */}
      <div className="border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-900/10 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Link size={15} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Importar Receita por URL</span>
          <span className="text-xs font-normal text-blue-500 dark:text-blue-500 ml-1">— TudoGostoso ou similar</span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://www.tudogostoso.com.br/receita/..."
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => e.key === 'Enter' && executarImport()}
          />
          <button
            onClick={executarImport}
            disabled={importing || !importUrl.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
          >
            {importing ? <Loader size={12} className="animate-spin" /> : <Link size={12} />}
            {importing ? 'Importando…' : 'Importar'}
          </button>
        </div>
        {importResult && (
          <p className={`text-xs mt-2 ${importResult.erro ? 'text-red-500' : 'text-green-600'}`}>
            {importResult.erro ? `Erro: ${importResult.erro}` : `Salva: "${importResult.nome}"`}
          </p>
        )}
      </div>

      {/* Crawl proativo de receitas */}
      <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Bot size={15} className="text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Crawl Proativo de Receitas</span>
          <span className="text-xs font-normal text-emerald-600 dark:text-emerald-500 ml-1">— TudoGostoso + Receiteria</span>
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-3">
          Busca automaticamente receitas para ingredientes com poucas receitas no banco. Roda também às 02:00 todos os dias.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={crawlIngredientes}
            onChange={(e) => setCrawlIngredientes(e.target.value)}
            placeholder="bisteca, frango, mandioca… (vazio = automático)"
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            onKeyDown={(e) => e.key === 'Enter' && executarCrawl()}
          />
          <button
            onClick={executarCrawl}
            disabled={crawling}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
          >
            {crawling ? <Loader size={12} className="animate-spin" /> : <Bot size={12} />}
            {crawling ? 'Crawleando…' : 'Crawlear'}
          </button>
        </div>
        {crawlResult && (
          <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            <strong>{crawlResult.totalSalvas} receita(s) salva(s)</strong>
            {crawlResult.ingredientes.length > 0 && (
              <span className="text-emerald-500 ml-1">
                para: {crawlResult.ingredientes.slice(0, 6).join(', ')}{crawlResult.ingredientes.length > 6 ? '…' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {ENTITIES.map((entity) => (
          <div
            key={entity.key}
            className={`border rounded-xl p-4 flex flex-col gap-3 ${entity.corBg} dark:bg-gray-800 dark:border-gray-700`}
          >
            {/* Header do card */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={entity.cor}>{entity.icon}</span>
                <span className="font-semibold text-sm text-gray-800 dark:text-white">{entity.label}</span>
              </div>
              <span className="text-xs font-mono bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-0.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {getCount(entity.key)} registros
              </span>
            </div>

            {/* Descrição */}
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
              {entity.descricao}
            </p>

            {/* Aviso extra */}
            {entity.aviso && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle size={11} />
                <span>{entity.aviso}</span>
              </div>
            )}

            {/* Botão */}
            <button
              onClick={() => abrirConfirm(entity)}
              disabled={deleting === entity.key || counts[entity.key] === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors w-full"
            >
              {deleting === entity.key ? (
                <>
                  <Loader size={13} className="animate-spin" />
                  Limpando…
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  Limpar {entity.label}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Modal de confirmação */}
      {confirm.entidade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Limpar {confirm.label}?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Esta ação é irreversível
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              Digite <strong className="text-gray-900 dark:text-white">limpar</strong> para confirmar a exclusão de todos os registros de <strong>{confirm.label}</strong>.
            </p>

            <input
              type="text"
              value={confirm.digitado}
              onChange={(e) => setConfirm((c) => ({ ...c, digitado: e.target.value }))}
              placeholder="Digite: limpar"
              autoFocus
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirm.digitado.toLowerCase() === 'limpar') executarLimpeza();
                if (e.key === 'Escape') fecharConfirm();
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={fecharConfirm}
                className="flex-1 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executarLimpeza}
                disabled={confirm.digitado.toLowerCase() !== 'limpar'}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
