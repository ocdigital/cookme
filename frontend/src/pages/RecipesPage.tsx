import React, { useState } from 'react';
import { Trash2, Eye, AlertTriangle, Flame } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { AnimatedModal } from '../components/AnimatedModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ActionButton } from '../components/ActionButton';
import { StatsBar } from '../components/StatsBar';
import { useToast } from '../hooks/useToast';
import recipesService from '../services/recipesService';
import { mockRecipes } from '../mocks/mockData';

interface Recipe {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  categoria_receita?: string;
  tempo_preparo: number;
  dificuldade: string;
  ingredientes?: any[];
  vezes_executada?: number;
  avaliacao_media?: number;
  modo_preparo?: string;
  rendimento_porcoes?: number;
  tags_dieta?: string[];
  denuncias?: number;
  status_moderacao?: 'ok' | 'em_revisao' | 'arquivado';
}

type DificuldadeReceita = 'facil' | 'media' | 'dificil';

export const RecipesPage: React.FC = () => {
  const toast = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes as any);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dificuldadeFilter, setDificuldadeFilter] = useState<'todas' | DificuldadeReceita>('todas');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get unique categories
  const categorias: string[] = ['todas', ...Array.from(new Set(recipes.map(r => r.categoria_receita || r.categoria || '').filter(Boolean)))];

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDificuldade = dificuldadeFilter === 'todas' ||
      String(recipe.dificuldade).toLowerCase() === String(dificuldadeFilter).toLowerCase();
    const matchesCategoria = categoriaFilter === 'todas' ||
      (recipe.categoria_receita || recipe.categoria) === categoriaFilter;
    return matchesSearch && matchesDificuldade && matchesCategoria;
  });

  // Calculate stats
  const stats = {
    total: recipes.length,
    maisExecutadas: recipes.filter(r => (r.vezes_executada || 0) > 50).length,
    avaliacaoBaixa: recipes.filter(r => (r.avaliacao_media || 0) < 3).length,
    emRevisao: recipes.filter(r => r.status_moderacao === 'em_revisao' || (r.denuncias || 0) > 0).length,
  };

  const getAvaliacaoBadge = (avaliacao: number | undefined) => {
    if (!avaliacao) return { label: 'Sem avaliação', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
    if (avaliacao >= 4) return { label: `⭐ ${avaliacao.toFixed(1)}`, color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' };
    if (avaliacao >= 3) return { label: `⭐ ${avaliacao.toFixed(1)}`, color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' };
    return { label: `⭐ ${avaliacao.toFixed(1)}`, color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' };
  };

  const handleDelete = (id: string) => {
    setRecipeToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!recipeToDelete) return;

    try {
      setDeleteLoading(true);
      // Mock delete
      setRecipes(recipes.filter(r => r.id !== recipeToDelete));
      toast.success('Receita deletada com sucesso!');
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar receita:', error);
      toast.error('Erro ao deletar receita', 'Tente novamente mais tarde');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailsModalOpen(true);
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="space-y-2">
        <header className="-mt-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Receitas</h1>
        </header>
        <Card>
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Receitas</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <Eye className="w-5 h-5" />, label: 'Total', value: stats.total },
          { icon: <Flame className="w-5 h-5" />, label: 'Trending', value: stats.maisExecutadas },
          { icon: <AlertTriangle className="w-5 h-5" />, label: 'Baixa Avaliação', value: stats.avaliacaoBaixa },
          { icon: <AlertTriangle className="w-5 h-5" />, label: 'Em Revisão', value: stats.emRevisao },
        ]}
      />

      {/* Table */}
      <Card>
        <div className="mb-6">
          <CardTitle>Receitas</CardTitle>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <SearchInput
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={dificuldadeFilter}
            onChange={(e) => setDificuldadeFilter(e.target.value as any)}
            options={[
              { value: 'todas', label: 'Dificuldade: Todas' },
              { value: 'facil', label: 'Dificuldade: Fácil' },
              { value: 'media', label: 'Dificuldade: Média' },
              { value: 'dificil', label: 'Dificuldade: Difícil' },
            ]}
          />
          <FilterSelect
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            options={categorias.map(cat => ({
              value: cat || 'todas',
              label: cat === 'todas' ? 'Categoria: Todas' : `Categoria: ${cat}`,
            }))}
          />
        </div>

        {/* Table Content */}
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRecipes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Receita</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Dificuldade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Execuções</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Avaliação</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipes.map((recipe) => {
                      const avaliacaoBadge = getAvaliacaoBadge(recipe.avaliacao_media);
                      const isTrending = (recipe.vezes_executada || 0) > 50;
                      const temRisco = recipe.status_moderacao === 'em_revisao' || (recipe.denuncias || 0) > 0;

                      return (
                      <tr
                        key={recipe.id}
                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          temRisco ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{recipe.nome}</td>
                        <td className="py-3 px-4">
                          {recipe.categoria_receita || recipe.categoria ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              {recipe.categoria_receita || recipe.categoria}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(recipe.dificuldade as DificuldadeReceita)}`}>
                            {recipesService.formatDificuldade(recipe.dificuldade as DificuldadeReceita)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 dark:text-gray-400">{recipe.vezes_executada || 0}x</span>
                            {isTrending && <span className="text-lg">🔥</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${avaliacaoBadge.color}`}>
                            {avaliacaoBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {temRisco ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center gap-1 w-fit">
                              <AlertTriangle size={12} />
                              Em Revisão
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="view"
                              icon={<Eye size={16} />}
                              title="Ver detalhes"
                              onClick={() => handleViewDetails(recipe)}
                            />
                            <ActionButton
                              variant="delete"
                              icon={<Trash2 size={16} />}
                              title="Deletar"
                              onClick={() => handleDelete(recipe.id)}
                            />
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Eye size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma receita encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <AnimatedModal
        isOpen={isDetailsModalOpen && selectedRecipe !== null}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedRecipe?.nome || 'Receita'}
        size="lg"
      >
        {selectedRecipe && (
          <div className="space-y-3">
            {selectedRecipe.descricao && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecipe.descricao}</p>
            )}

            {/* Informações básicas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dificuldade</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(selectedRecipe.dificuldade as DificuldadeReceita)}`}>
                  {recipesService.formatDificuldade(selectedRecipe.dificuldade as DificuldadeReceita)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tempo de Preparo</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1">{selectedRecipe.tempo_preparo} min</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rendimento</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1">{selectedRecipe.rendimento_porcoes || '-'} porções</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Categoria</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1 capitalize">{selectedRecipe.categoria_receita || selectedRecipe.categoria || '-'}</p>
              </div>
            </div>

            {/* Tags */}
            {selectedRecipe.tags_dieta && selectedRecipe.tags_dieta.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags_dieta.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modo de Preparo */}
            {selectedRecipe.modo_preparo && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Modo de Preparo</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedRecipe.modo_preparo}</p>
                </div>
              </div>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avaliação Média</p>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedRecipe.avaliacao_media && selectedRecipe.avaliacao_media > 0 ? `⭐ ${selectedRecipe.avaliacao_media.toFixed(1)}` : 'Sem avaliações'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vezes Executada</p>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{selectedRecipe.vezes_executada || 0}x</p>
              </div>
            </div>

            {/* Seção de Moderação */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Moderação</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-semibold ${
                    selectedRecipe.status_moderacao === 'ok'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedRecipe.status_moderacao === 'ok' ? '✅ OK' : '⚠️ ' + selectedRecipe.status_moderacao}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Denúncias</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedRecipe.denuncias || 0}</span>
                </div>
                {selectedRecipe.status_moderacao === 'em_revisao' && (
                  <button className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Arquivar Receita
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Deletar Receita?"
        description="Esta ação não pode ser desfeita. A receita será permanentemente removida."
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
