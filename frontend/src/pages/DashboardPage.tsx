import React, { useState, useEffect } from 'react';
import { Users, Package, UtensilsCrossed, ShoppingCart, Loader, AlertCircle } from 'lucide-react';
import { StatsBar } from '../components/StatsBar';
import { adminService } from '../services/adminService';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    usuarios: 0,
    usuariosAtivos: 0,
    produtos: 0,
    receitas: 0,
    compras: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await adminService.getDashboardStats();

      setStats({
        usuarios: dashboardStats.usuarios?.total || 0,
        usuariosAtivos: dashboardStats.usuarios?.ativos || 0,
        produtos: dashboardStats.produtos?.total || 0,
        receitas: dashboardStats.receitas?.total || 0,
        compras: dashboardStats.compras?.total || 0,
      });
    } catch (err) {
      console.error('❌ Erro ao carregar stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
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

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.usuariosAtivos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">de {stats.usuarios} total</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Receitas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.receitas}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">no catálogo</p>
            </div>
            <UtensilsCrossed className="w-10 h-10 text-purple-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Produtos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.produtos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">cadastrados</p>
            </div>
            <Package className="w-10 h-10 text-green-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Compras</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.compras}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">registradas</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-orange-500 opacity-80" />
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Frontend Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">React + Tailwind</p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-green-600">OK</span>
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">API Backend</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">NestJS + PostgreSQL</p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-green-600">OK</span>
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Mobile App</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">React Native (Expo)</p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-green-600">OK</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
