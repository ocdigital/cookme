import React, { useState, useEffect } from 'react';
import { Users, Package, UtensilsCrossed, ShoppingCart, Loader } from 'lucide-react';
import { StatsBar } from '../components/StatsBar';
import { usuariosService, produtosService, comprasService } from '../services';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    usuarios: 0,
    produtos: 0,
    receitas: 0,
    compras: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersStats, productsStats, purchasesStats] = await Promise.all([
        usuariosService.getStats().catch(() => ({ totalUsuarios: 0 })),
        produtosService.getStats().catch(() => ({ totalProdutos: 0 })),
        comprasService.getStats().catch(() => ({ totalCompras: 0 })),
      ]);

      setStats({
        usuarios: usersStats.totalUsuarios || 0,
        produtos: productsStats.totalProdutos || 0,
        receitas: 0, // Recipes don't have stats endpoint
        compras: purchasesStats.totalCompras || 0,
      });
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Dashboard</h1>
      </header>

      {/* Stats Bar */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <StatsBar
          items={[
            { icon: <Users className="w-5 h-5" />, label: 'Usuários', value: stats.usuarios },
            { icon: <Package className="w-5 h-5" />, label: 'Produtos', value: stats.produtos },
            { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Receitas', value: stats.receitas },
            { icon: <ShoppingCart className="w-5 h-5" />, label: 'Compras', value: stats.compras },
          ]}
        />
      )}

      {/* Activity + Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Aplicação</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Frontend</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">React + Tailwind</p>
              </div>
              <span className="text-xs font-bold text-green-600">OK</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Backend</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">NestJS API</p>
              </div>
              <span className="text-xs font-bold text-green-600">OK</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Database</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PostgreSQL</p>
              </div>
              <span className="text-xs font-bold text-green-600">OK</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Features</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-gray-700 dark:text-gray-300">MOI Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-gray-700 dark:text-gray-300">Barcode Scan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-gray-700 dark:text-gray-300">Notifications</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
