import React, { useState } from 'react';
import { UtensilsCrossed, Edit2, Trash2, Search } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';

interface Recipe {
  id: number;
  nome: string;
  categoria: string;
  dificuldade: 'fácil' | 'médio' | 'difícil';
  tempoPreparo: number;
  dataCriacao: string;
}

export const RecipesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dificuldadeFilter, setDificuldadeFilter] = useState<'todas' | 'fácil' | 'médio' | 'difícil'>('todas');

  const recipes: Recipe[] = [
    { id: 1, nome: 'Sopa de Tomate', categoria: 'sopas', dificuldade: 'fácil', tempoPreparo: 25, dataCriacao: '2024-01-15' },
    { id: 2, nome: 'Salada Caesar', categoria: 'saladas', dificuldade: 'fácil', tempoPreparo: 10, dataCriacao: '2024-01-18' },
    { id: 3, nome: 'Frango ao Molho', categoria: 'pratos principais', dificuldade: 'médio', tempoPreparo: 45, dataCriacao: '2024-01-20' },
    { id: 4, nome: 'Risoto de Cogumelo', categoria: 'pratos principais', dificuldade: 'médio', tempoPreparo: 35, dataCriacao: '2024-01-22' },
    { id: 5, nome: 'Wellington de Carne', categoria: 'pratos principais', dificuldade: 'difícil', tempoPreparo: 120, dataCriacao: '2024-02-01' },
  ];

  const stats = [
    { label: 'Total de Receitas', value: recipes.length, icon: '👨‍🍳' },
    { label: 'Receitas Fáceis', value: recipes.filter(r => r.dificuldade === 'fácil').length, icon: '⭐' },
    { label: 'Tempo Médio', value: Math.round(recipes.reduce((a, b) => a + b.tempoPreparo, 0) / recipes.length), icon: '⏱' },
  ];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDificuldade = dificuldadeFilter === 'todas' || recipe.dificuldade === dificuldadeFilter;
    return matchesSearch && matchesDificuldade;
  });

  const getDificuldadeColor = (dificuldade: string) => {
    switch(dificuldade) {
      case 'fácil': return 'bg-green-100 text-green-700';
      case 'médio': return 'bg-yellow-100 text-yellow-700';
      case 'difícil': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Receitas</h1>
        <p className="text-gray-500 mt-1">Gerencie o acervo de receitas da CookMe</p>
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
          <CardTitle>Lista de Receitas</CardTitle>
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium">
            <UtensilsCrossed size={16} />
            Nova Receita
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
            value={dificuldadeFilter}
            onChange={(e) => setDificuldadeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
          >
            <option value="todas">Todas</option>
            <option value="fácil">Fácil</option>
            <option value="médio">Médio</option>
            <option value="difícil">Difícil</option>
          </select>
        </div>

        {/* Table Content */}
        <CardContent>
          {filteredRecipes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Receita</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Dificuldade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tempo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipes.map((recipe) => (
                    <tr key={recipe.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-medium">{recipe.nome}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {recipe.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDificuldadeColor(recipe.dificuldade)}`}>
                          {recipe.dificuldade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{recipe.tempoPreparo} min</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{recipe.dataCriacao}</td>
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
              <p className="text-gray-500">Nenhuma receita encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
