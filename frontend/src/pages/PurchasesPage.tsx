import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, ChevronDown, ChevronUp, Search,
  Trash2, RefreshCw, Package, Loader, Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

interface CompraItem {
  id: string;
  produto_id: string | null;
  produto?: { id: string; nome: string; codigo_barras?: string; marca?: { nome: string } };
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  validade_final?: string;
  lote?: string;
}

interface Compra {
  id: string;
  usuario_id: string;
  usuario?: { id: string; nome: string; email: string };
  local_compra?: string;
  data_compra: string;
  valor_total: number;
  metodo_cadastro?: string;
  itens?: CompraItem[];
  criado_em: string;
}

export const PurchasesPage: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCompra, setExpandedCompra] = useState<Compra | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const [deleting, setDeleting] = useState<string | null>(null);

  const loadCompras = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/compras', { params: { page, limit: 20, search: search || undefined } });
      setCompras(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error('Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadCompras(); }, [loadCompras]);

  const toggleExpand = async (compra: Compra) => {
    if (expandedId === compra.id) {
      setExpandedId(null);
      setExpandedCompra(null);
      setItemSearch('');
      return;
    }

    setExpandedId(compra.id);
    setItemSearch('');

    // Se já tem itens carregados da lista, usa eles; senão busca detalhado
    if (compra.itens && compra.itens.length > 0) {
      setExpandedCompra(compra);
    } else {
      setLoadingDetail(true);
      try {
        const res = await api.get(`/admin/compras/${compra.id}`);
        setExpandedCompra(res.data);
      } catch {
        toast.error('Erro ao carregar itens da compra');
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deletar esta compra e todos os itens?')) return;
    setDeleting(id);
    try {
      await api.delete(`/compras/${id}`);
      toast.success('Compra removida');
      setCompras(c => c.filter(x => x.id !== id));
      setTotal(t => t - 1);
      if (expandedId === id) { setExpandedId(null); setExpandedCompra(null); }
    } catch {
      toast.error('Erro ao deletar compra');
    } finally {
      setDeleting(null);
    }
  };

  const itensFiltered = (expandedCompra?.itens ?? []).filter(item => {
    if (!itemSearch) return true;
    const q = itemSearch.toLowerCase();
    return (
      item.produto?.nome?.toLowerCase().includes(q) ||
      item.produto?.codigo_barras?.toLowerCase().includes(q) ||
      item.produto?.marca?.nome?.toLowerCase().includes(q)
    );
  });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtMoney = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`;
  const metodoLabel = (m?: string) => ({
    cupom_sat: 'SAT/NFC-e', manual: 'Manual', qrcode: 'QR Code',
    ocr_nota: 'OCR Nota', cupom_nfce: 'NFC-e',
  }[m ?? ''] ?? m ?? '—');

  return (
    <div className="space-y-3">
      {/* Header */}
      <header className="flex items-center justify-between -mt-1">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Compras</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{total} compra(s) no total</p>
        </div>
        <button
          onClick={loadCompras}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por local de compra..."
          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size={24} className="animate-spin text-primary" />
        </div>
      ) : compras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Receipt size={40} className="mb-3" />
          <p className="text-sm">Nenhuma compra encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {compras.map(compra => {
            const isExpanded = expandedId === compra.id;
            const itemCount = compra.itens?.length ?? 0;

            return (
              <div key={compra.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => toggleExpand(compra)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <ShoppingCart size={15} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {compra.local_compra || 'Local não informado'}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {metodoLabel(compra.metodo_cadastro)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>{fmtDate(compra.data_compra || compra.criado_em)}</span>
                      <span>·</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{fmtMoney(compra.valor_total)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Package size={11} />
                        {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                      </span>
                      {compra.usuario && (
                        <>
                          <span>·</span>
                          <span className="text-gray-400 truncate">{compra.usuario.nome || compra.usuario.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(compra.id); }}
                      disabled={deleting === compra.id}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Deletar compra"
                    >
                      {deleting === compra.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                    {isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  </div>
                </div>

                {/* Items expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {loadingDetail ? (
                      <div className="flex justify-center py-6">
                        <Loader size={18} className="animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        {/* Item search + count */}
                        <div className="px-4 py-2 flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30">
                          <div className="relative flex-1">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={itemSearch}
                              onChange={e => setItemSearch(e.target.value)}
                              placeholder="Filtrar itens..."
                              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {itensFiltered.length}/{expandedCompra?.itens?.length ?? 0} itens
                          </span>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                              <tr>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">#</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Produto</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Cód. Barras</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Marca</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Qtd</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Un</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Vl Unit</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itensFiltered.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-6 text-center text-gray-400">Nenhum item encontrado</td>
                                </tr>
                              ) : (
                                itensFiltered.map((item, idx) => (
                                  <tr
                                    key={item.id || idx}
                                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                  >
                                    <td className="py-1.5 px-3 text-gray-400">{idx + 1}</td>
                                    <td className="py-1.5 px-3 font-medium text-gray-800 dark:text-gray-200 max-w-[200px]">
                                      {item.produto?.nome ?? <span className="text-red-400 italic">sem produto vinculado</span>}
                                    </td>
                                    <td className="py-1.5 px-3 text-gray-500 dark:text-gray-400 font-mono">
                                      {item.produto?.codigo_barras || '—'}
                                    </td>
                                    <td className="py-1.5 px-3 text-gray-500 dark:text-gray-400">
                                      {item.produto?.marca?.nome || '—'}
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                                      {Number(item.quantidade).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-1.5 px-3 text-gray-500 dark:text-gray-400">{item.unidade}</td>
                                    <td className="py-1.5 px-3 text-right text-gray-600 dark:text-gray-400">
                                      {fmtMoney(item.preco_unitario)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-semibold text-green-600 dark:text-green-400">
                                      {fmtMoney(item.preco_unitario * item.quantidade)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                            {itensFiltered.length > 0 && (
                              <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
                                <tr>
                                  <td colSpan={7} className="py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 text-right">
                                    Total ({itensFiltered.length} itens)
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">
                                    {fmtMoney(itensFiltered.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0))}
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Anterior
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};
