import React, { useState } from 'react';
import { Package, Edit2, Trash2, Search } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';

interface Product {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  dataCriacao: string;
}

export const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'todos' | 'frutas' | 'vegetais' | 'especiarias'>('todos');

  const products: Product[] = [
    { id: 1, nome: 'Tomate Cereja', categoria: 'vegetais', preco: 8.50, estoque: 45, dataCriacao: '2024-01-20' },
    { id: 2, nome: 'Alface Crocante', categoria: 'vegetais', preco: 5.00, estoque: 60, dataCriacao: '2024-01-22' },
    { id: 3, nome: 'Maçã Gala', categoria: 'frutas', preco: 4.20, estoque: 120, dataCriacao: '2024-01-18' },
    { id: 4, nome: 'Banana Nanica', categoria: 'frutas', preco: 3.50, estoque: 200, dataCriacao: '2024-01-19' },
    { id: 5, nome: 'Orégano', categoria: 'especiarias', preco: 12.00, estoque: 15, dataCriacao: '2024-02-01' },
  ];

  const stats = [
    { label: 'Total de Produtos', value: products.length, icon: '📦' },
    { label: 'Em Estoque', value: products.filter(p => p.estoque > 0).length, icon: '✓' },
    { label: 'Baixo Estoque', value: products.filter(p => p.estoque < 20).length, icon: '⚠' },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || product.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Produtos</h1>
        <p className="text-gray-500 mt-1">Gerencie o catálogo de produtos da CookMe</p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Produtos</CardTitle>
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium">
            <Package size={16} />
            Novo Produto
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
          >
            <option value="todos">Todas</option>
            <option value="frutas">Frutas</option>
            <option value="vegetais">Vegetais</option>
            <option value="especiarias">Especiarias</option>
          </select>
        </div>

        {/* Table Content */}
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Produto</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Preço</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Estoque</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-medium">{product.nome}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {product.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-semibold">R$ {product.preco.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.estoque > 20
                            ? 'bg-green-100 text-green-700'
                            : product.estoque > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.estoque} un.
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{product.dataCriacao}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                            <Edit2 size={16} />
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
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
