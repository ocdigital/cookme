import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Search } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';

interface User {
  id: number;
  nome: string;
  email: string;
  funcao: string;
  status: 'ativo' | 'inativo';
  dataCriacao: string;
}

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Mock data
  const users: User[] = [
    { id: 1, nome: 'João Silva', email: 'joao@example.com', funcao: 'Admin', status: 'ativo', dataCriacao: '2024-01-15' },
    { id: 2, nome: 'Maria Santos', email: 'maria@example.com', funcao: 'Moderador', status: 'ativo', dataCriacao: '2024-01-20' },
    { id: 3, nome: 'Pedro Costa', email: 'pedro@example.com', funcao: 'Usuário', status: 'ativo', dataCriacao: '2024-02-01' },
    { id: 4, nome: 'Ana Oliveira', email: 'ana@example.com', funcao: 'Usuário', status: 'inativo', dataCriacao: '2024-01-10' },
    { id: 5, nome: 'Carlos Mendes', email: 'carlos@example.com', funcao: 'Moderador', status: 'ativo', dataCriacao: '2024-02-05' },
  ];

  const stats = [
    { label: 'Total de Usuários', value: users.length, icon: '👥' },
    { label: 'Usuários Ativos', value: users.filter(u => u.status === 'ativo').length, icon: '✓' },
    { label: 'Novo este Mês', value: 3, icon: '+' },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Usuários</h1>
        <p className="text-gray-500 mt-1">Gerencie os usuários da plataforma CookMe</p>
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
          <CardTitle>Lista de Usuários</CardTitle>
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium">
            <UserPlus size={16} />
            Novo Usuário
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        {/* Table Content */}
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Função</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Criação</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-medium">{user.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {user.funcao}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                          user.status === 'ativo'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ativo' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{user.dataCriacao}</td>
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
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
