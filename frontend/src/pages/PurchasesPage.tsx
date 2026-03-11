import React, { useState } from 'react';
import { ShoppingCart, Eye, Trash2, Search, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { StatsBar } from '../components/StatsBar';

interface Purchase {
  id: number;
  numero: string;
  cliente: string;
  total: number;
  status: 'pendente' | 'confirmado' | 'enviado' | 'entregue';
  dataPedido: string;
}

export const PurchasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'confirmado' | 'enviado' | 'entregue'>('todos');

  const purchases: Purchase[] = [
    { id: 1, numero: '#001', cliente: 'João Silva', total: 150.00, status: 'entregue', dataPedido: '2024-01-15' },
    { id: 2, numero: '#002', cliente: 'Maria Santos', total: 250.50, status: 'enviado', dataPedido: '2024-01-18' },
    { id: 3, numero: '#003', cliente: 'Pedro Costa', total: 89.90, status: 'confirmado', dataPedido: '2024-01-20' },
    { id: 4, numero: '#004', cliente: 'Ana Oliveira', total: 320.00, status: 'pendente', dataPedido: '2024-02-01' },
    { id: 5, numero: '#005', cliente: 'Carlos Mendes', total: 175.30, status: 'confirmado', dataPedido: '2024-02-02' },
  ];

  const totalSales = purchases.reduce((a, b) => a + b.total, 0);
  const pendingCount = purchases.filter(p => p.status === 'pendente').length;

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          purchase.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-700';
      case 'confirmado': return 'bg-blue-100 text-blue-700';
      case 'enviado': return 'bg-purple-100 text-purple-700';
      case 'entregue': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Compras</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <ShoppingCart className="w-5 h-5" />, label: 'Total de Compras', value: purchases.length },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Vendas este Mês', value: `R$ ${totalSales.toFixed(2)}` },
          { icon: <AlertCircle className="w-5 h-5" />, label: 'Pendentes', value: pendingCount },
        ]}
      />

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Compras</CardTitle>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
          </select>
        </div>

        {/* Table Content */}
        <CardContent>
          {filteredPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Número</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data do Pedido</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-medium">{purchase.numero}</td>
                      <td className="py-3 px-4 text-gray-600">{purchase.cliente}</td>
                      <td className="py-3 px-4 text-gray-800 font-semibold">R$ {purchase.total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{purchase.dataPedido}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
