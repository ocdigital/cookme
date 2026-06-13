import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, UtensilsCrossed, Activity, Calendar, Loader } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { adminService } from '../services/adminService';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('❌ Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Usuários Totais',
      value: dashboardData?.usuarios?.total || 0,
      change: '+0%',
      icon: <Users className="w-8 h-8 text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Usuários Ativos',
      value: dashboardData?.usuarios?.ativos || 0,
      change: `${Math.round(((dashboardData?.usuarios?.ativos || 0) / (dashboardData?.usuarios?.total || 1)) * 100)}%`,
      icon: <Activity className="w-8 h-8 text-green-500" />,
      color: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Receitas do Catálogo',
      value: dashboardData?.receitas?.total || 0,
      change: '+0%',
      icon: <UtensilsCrossed className="w-8 h-8 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Produtos Cadastrados',
      value: dashboardData?.produtos?.total || 0,
      change: '+0%',
      icon: <Package className="w-8 h-8 text-orange-500" />,
      color: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Analytics</h1>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
          {/* Time Range Filter */}
          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {range === '7d' ? 'Últimos 7 dias' : range === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}
                </button>
              ))}
            </div>
          </div>

          {/* Main Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{stat.change} ativos</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}

      {/* Summary Cards */}
      {!loading && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardTitle className="text-sm">Resumo por Período</CardTitle>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Total de Usuários</span>
                <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.usuarios?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Usuários Ativos</span>
                <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.usuarios?.ativos || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Taxa de Atividade</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {dashboardData?.usuarios?.total ? Math.round(((dashboardData?.usuarios?.ativos || 0) / (dashboardData?.usuarios?.total || 1)) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle className="text-sm">Catálogo</CardTitle>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Receitas</span>
                <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.receitas?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Produtos</span>
                <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.produtos?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Compras</span>
                <span className="font-bold text-gray-900 dark:text-white">{dashboardData?.compras?.total || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insight
            </CardTitle>
            <CardContent className="space-y-2 pt-4 text-xs">
              <p className="text-gray-700 dark:text-gray-300">
                {dashboardData?.usuarios?.total > 0
                  ? `${Math.round(((dashboardData?.usuarios?.ativos || 0) / (dashboardData?.usuarios?.total || 1)) * 100)}% de usuários ativos`
                  : 'Nenhum usuário registrado'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {dashboardData?.produtos?.total > 0
                  ? `${dashboardData?.produtos?.total} produtos cadastrados`
                  : 'Nenhum produto cadastrado'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {dashboardData?.receitas?.total > 0
                  ? `${dashboardData?.receitas?.total} receitas disponíveis`
                  : 'Nenhuma receita disponível'}
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};
