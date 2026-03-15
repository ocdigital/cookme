import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Package, UtensilsCrossed, Activity, Calendar, Download } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { mockDashboardStats, mockActivityLogs, mockUsageStats } from '../mocks/mockData';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const stats = [
    {
      label: 'Usuários Totais',
      value: mockDashboardStats.usuarios,
      change: '+12%',
      icon: <Users className="w-8 h-8 text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Usuários Ativos',
      value: mockDashboardStats.usuarios_ativos,
      change: '+8%',
      icon: <Activity className="w-8 h-8 text-green-500" />,
      color: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Receitas do Catálogo',
      value: mockDashboardStats.receitas,
      change: '+15%',
      icon: <UtensilsCrossed className="w-8 h-8 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Produtos Cadastrados',
      value: mockDashboardStats.produtos,
      change: '+5%',
      icon: <Package className="w-8 h-8 text-orange-500" />,
      color: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Analytics</h1>
      </header>

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
                <p className="text-xs text-green-600 mt-2">{stat.change} vs período anterior</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Usage Over Time */}
        <Card className="lg:col-span-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Uso Diário da Aplicação
          </CardTitle>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {mockUsageStats.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.hora}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{item.usuarios} usuários</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.usuarios / 350) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardTitle>Métricas-Chave</CardTitle>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Tempo Médio de Uso</span>
                <span className="font-bold text-gray-900 dark:text-white">{mockDashboardStats.tempo_medio_uso}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-3/4" />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Taxa de Retenção</span>
                <span className="font-bold text-gray-900 dark:text-white">{mockDashboardStats.taxa_retencao}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Novos Usuários (Mês)</span>
                <span className="font-bold text-gray-900 dark:text-white">{mockDashboardStats.usuarios_novos_mes}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" />
                Exportar Relatório
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Feed */}
      <Card>
        <CardTitle>Atividades Recentes</CardTitle>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {mockActivityLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{log.usuario}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{log.acao}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2">
                      {new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Receitas
          </CardTitle>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spaghetti à Carbonara</span>
                <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">3.456 views</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bolo de Cenoura</span>
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded">4.567 views</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Salada Caprese</span>
                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">2.134 views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Top Produtos</CardTitle>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leite Integral 1L</span>
                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded">456 inv.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Arroz Integral</span>
                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">234 inv.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Azeite Extra Virgem</span>
                <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">56 inv.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
