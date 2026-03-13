import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Trash2, TrendingUp, Loader } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatsBar } from '../components/StatsBar';
import { PurchaseDetailsModal } from '../components/PurchaseDetailsModal';
import { SearchInput } from '../components/SearchInput';
import { ErrorAlert } from '../components/ErrorAlert';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [purchaseToView, setPurchaseToView] = useState<Compra | null>(null);

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

  const handleDelete = (id: string) => {
    setPurchaseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleViewPurchase = (purchase: Compra) => {
    setPurchaseToView(purchase);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!purchaseToDelete) return;

    try {
      setDeleteLoading(true);
      await comprasService.delete(purchaseToDelete);
      setPurchases(purchases.filter(p => p.id !== purchaseToDelete));
      setStats({ ...stats, totalCompras: stats.totalCompras - 1 });
      setIsDeleteModalOpen(false);
      setPurchaseToDelete(null);
    } catch (err) {
      console.error('Erro ao deletar compra:', err);
    } finally {
      setDeleteLoading(false);
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
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <SearchInput
            placeholder="Buscar por local de compra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error Message */}
        <ErrorAlert error={error} />

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
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Local</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Items</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{purchase.local_compra || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(purchase.criado_em).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 text-right font-semibold">
                          {purchase.itens?.length || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="view"
                              icon={<Eye size={16} />}
                              title="Visualizar"
                              onClick={() => handleViewPurchase(purchase)}
                            />
                            <ActionButton
                              variant="delete"
                              icon={<Trash2 size={16} />}
                              title="Deletar"
                              onClick={() => handleDelete(purchase.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPrevious={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => Math.min(totalPages, p + 1))}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setPurchaseToView(null);
        }}
        purchase={purchaseToView}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Deletar Compra?"
        description="Esta ação não pode ser desfeita. A compra será permanentemente removida."
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPurchaseToDelete(null);
        }}
      />
    </div>
  );
};
