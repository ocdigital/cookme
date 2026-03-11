import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Trash2, Search, TrendingUp, AlertCircle, Loader } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { StatsBar } from '../components/StatsBar';
import { comprasService } from '../services';
import type { Compra, ComprasStats } from '../services';

export const PurchasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [purchases, setPurchases] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ComprasStats>({
    totalCompras: 0,
    valorTotal: 0,
    mediaTicket: 0,
    comprasMes: 0,
  });

  useEffect(() => {
    loadPurchases();
    loadStats();
  }, [page]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await comprasService.getAll(page, 10);
      setPurchases(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError('Erro ao carregar compras');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await comprasService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta compra?')) return;
    try {
      await comprasService.delete(id);
      setPurchases(purchases.filter(p => p.id !== id));
      setStats({ ...stats, totalCompras: stats.totalCompras - 1 });
    } catch (err) {
      alert('Erro ao deletar compra');
      console.error(err);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.local_compra?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return matchesSearch;
  });

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Compras</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <ShoppingCart className="w-5 h-5" />, label: 'Total de Compras', value: stats.totalCompras },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Valor Total', value: `R$ ${(stats.valorTotal || 0).toFixed(2)}` },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Ticket Médio', value: `R$ ${(stats.mediaTicket || 0).toFixed(2)}` },
        ]}
      />

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Compras</CardTitle>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por local de compra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table Content */}
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredPurchases.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Local</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-800 font-medium">{purchase.local_compra || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(purchase.criado_em).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-gray-800 text-right font-semibold">
                          {purchase.itens?.length || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => alert(`Compra #${purchase.id}\n\nItens: ${purchase.itens?.length || 0}\nData: ${new Date(purchase.criado_em).toLocaleDateString('pt-BR')}`)}
                              className="p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(purchase.id)}
                              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
