import React, { useState, useEffect } from 'react';
import { Users, Package, UtensilsCrossed, ShoppingCart, Loader, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { StatsBar } from '../components/StatsBar';
import { usuariosService, produtosService, comprasService } from '../services';
import { mockDashboardStats, mockActivityLogs } from '../mocks/mockData';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    usuarios: 0,
    produtos: 0,
    receitas: 0,
    compras: 0,
  });
  const [loading, setLoading] = useState(true);
  const [useMockData] = useState(true); // Toggle para usar dados mockados

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (useMockData) {
        // Use mock data durante desenvolvimento
        setStats({
          usuarios: mockDashboardStats.usuarios,
          produtos: mockDashboardStats.produtos,
          receitas: mockDashboardStats.receitas,
          compras: 89,
        });
      } else {
        const [usersStats, productsStats, purchasesStats] = await Promise.all([
          usuariosService.getStats().catch(() => ({ totalUsuarios: 0 })),
          produtosService.getStats().catch(() => ({ totalProdutos: 0 })),
          comprasService.getStats().catch(() => ({ totalCompras: 0 })),
        ]);

        setStats({
          usuarios: usersStats.totalUsuarios || 0,
          produtos: productsStats.totalProdutos || 0,
          receitas: 0,
          compras: purchasesStats.totalCompras || 0,
        });
      }
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

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mockDashboardStats.usuarios_ativos}</p>
              <p className="text-xs text-green-600 mt-2">↑ 12% vs mês anterior</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Receitas Populares</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mockDashboardStats.receitas_populares}</p>
              <p className="text-xs text-green-600 mt-2">↑ 5% vs semana anterior</p>
            </div>
            <UtensilsCrossed className="w-10 h-10 text-purple-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Produtos em Falta</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mockDashboardStats.produtos_em_falta}</p>
              <p className="text-xs text-orange-600 mt-2">Requer atenção</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Taxa de Retenção</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mockDashboardStats.taxa_retencao}%</p>
              <p className="text-xs text-green-600 mt-2">↑ 3% vs mês anterior</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
          </div>
        </div>
      </section>

      {/* Activity Feed + System Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividade Recente
          </h3>
          <div className="space-y-3">
            {mockActivityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.tipo === 'usuario'
                      ? 'bg-blue-500'
                      : log.tipo === 'receita'
                        ? 'bg-purple-500'
                        : log.tipo === 'produto'
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{log.usuario}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{log.acao}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status do Sistema</h3>
          <div className="space-y-3">
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
        </div>
      </section>
    </div>
  );
};
