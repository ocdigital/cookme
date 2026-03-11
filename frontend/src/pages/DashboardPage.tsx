import React from 'react';
import { Users, Package, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { StatsBar } from '../components/StatsBar';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Dashboard</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <Users className="w-5 h-5" />, label: 'Usuários', value: 24 },
          { icon: <Package className="w-5 h-5" />, label: 'Produtos', value: 156 },
          { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Receitas', value: 42 },
          { icon: <ShoppingCart className="w-5 h-5" />, label: 'Compras', value: 89 },
        ]}
      />

      {/* Activity + Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Atividade Recente</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Novo pedido #00{item}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Há 2 horas</p>
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">R$ {(item * 150).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status da Aplicação</h3>
          <div className="space-y-2.5">
            {['API Backend', 'Base de Dados', 'Cache'].map((label) => (
              <div key={label} className="flex justify-between items-center p-3 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
