import React from 'react';
import { Users, Package, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';

export const DashboardPage: React.FC = () => {
  const stats = [
    { icon: <Users className="w-6 h-6" />, label: 'Usuários', value: 24, change: '+12% este mês' },
    { icon: <Package className="w-6 h-6" />, label: 'Produtos', value: 156, change: '+8% este mês' },
    { icon: <UtensilsCrossed className="w-6 h-6" />, label: 'Receitas', value: 42, change: '+5% este mês' },
    { icon: <ShoppingCart className="w-6 h-6" />, label: 'Compras', value: 89, change: '+25% este mês' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao painel de administração da CookMe</p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-gray-500 text-sm font-medium">{s.label}</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">{s.value}</p>
              </div>
              <div className="icon-container">{s.icon}</div>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full inline-flex items-center">
              <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5"></span>
              {s.change}
            </span>
          </div>
        ))}
      </section>

      {/* Activity + Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardTitle>Atividade Recente</CardTitle>
          <CardContent>
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between py-4 border-b last:border-0 border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Novo pedido #00{item}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Há 2 horas</p>
                </div>
                <span className="text-sm font-bold text-primary">R$ {(item * 150).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Status da Aplicação</CardTitle>
          <CardContent>
            {['API Backend', 'Base de Dados', 'Cache'].map((label) => (
              <div key={label} className="flex justify-between items-center p-3 rounded-lg bg-green-50/50 border border-green-100 mb-3 last:mb-0">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                  <span className="text-xs font-semibold text-green-700">Online</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
