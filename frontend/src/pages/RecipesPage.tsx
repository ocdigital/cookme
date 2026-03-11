import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Edit2, Trash2, Search, Eye, Plus, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { AnimatedModal } from '../components/AnimatedModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/SkeletonLoader';
import { StatsBar } from '../components/StatsBar';
import { useToast } from '../hooks/useToast';
import recipesService from '../services/recipesService';
import type { Receita } from '../services/recipesService';

type DificuldadeReceita = 'facil' | 'media' | 'dificil';

export const RecipesPage: React.FC = () => {
  const toast = useToast();
  const [recipes, setRecipes] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dificuldadeFilter, setDificuldadeFilter] = useState<'todas' | DificuldadeReceita>('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<Receita | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showIAModal, setShowIAModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWeekConfirm, setShowWeekConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [ingredientesIA, setIngredientesIA] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);

  // Carregar receitas
  useEffect(() => {
    loadRecipes(1);
  }, []);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    loadRecipes(1);
  }, [searchTerm, dificuldadeFilter]);

  const loadRecipes = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await recipesService.getAll({
        search: searchTerm || undefined,
        dificuldade: dificuldadeFilter !== 'todas' ? dificuldadeFilter : undefined,
        page,
        limit: 20,
      });
      setRecipes(response.data);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setRecipeToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!recipeToDelete) return;

    try {
      await recipesService.delete(recipeToDelete);
      toast.success('Receita deletada com sucesso!');
      loadRecipes(currentPage);
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar receita:', error);
      toast.error('Erro ao deletar receita', 'Tente novamente mais tarde');
    }
  };

  const handleViewDetails = (recipe: Receita) => {
    setSelectedRecipe(recipe);
    setShowDetailModal(true);
  };

  const handleGerarComIA = async () => {
    if (!ingredientesIA.trim()) {
      toast.warning('Campos obrigatórios', 'Digite os ingredientes');
      return;
    }

    try {
      setLoadingIA(true);
      const ingredientes = ingredientesIA.split(',').map(i => i.trim());
      const receitaGerada = await recipesService.gerarComIA(ingredientes);

      toast.success(`Receita "${receitaGerada.nome}" criada com sucesso!`);
      setShowIAModal(false);
      setIngredientesIA('');

      // Recarregar lista
      await loadRecipes();
    } catch (error) {
      console.error('Erro ao gerar receita:', error);
      toast.error('Erro ao gerar receita', 'Verifique os ingredientes e tente novamente');
    } finally {
      setLoadingIA(false);
    }
  };

  const handleGerarSemana = async () => {
    setShowWeekConfirm(true);
  };

  const confirmGerarSemana = async () => {
    try {
      setLoading(true);
      const result = await recipesService.gerarSemana();
      await loadRecipes();
      toast.success(`${result.total} receitas geradas para a semana!`);
      setShowWeekConfirm(false);
    } catch (error) {
      console.error('Erro ao gerar receitas:', error);
      toast.error('Erro ao gerar receitas', 'A geração pode demorar até 2 minutos');
    } finally {
      setLoading(false);
    }
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="space-y-2">
        <header>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Receitas</h1>
        </header>
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Receitas</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Total de Receitas', value: total },
          { icon: <BookOpen className="w-5 h-5" />, label: 'Página Atual', value: `${currentPage}/${totalPages}` },
          { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Receitas na Página', value: recipes.length },
        ]}
      />

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Receitas</CardTitle>
          <div className="flex gap-2">
            <button
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium"
              onClick={handleGerarSemana}
            >
              <UtensilsCrossed size={16} />
              Semana (21)
            </button>
            <button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium"
              onClick={() => setShowIAModal(true)}
            >
              <Sparkles size={16} />
              Gerar com IA
            </button>
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
              onClick={() => toast.info('Em breve', 'Modal de criação de receitas em desenvolvimento')}
            >
              <Plus size={16} />
              Nova Receita
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100">
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
            <option value="facil">Fácil</option>
            <option value="media">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>

        {/* Table Content */}
        <CardContent>
          {recipes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Receita</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Dificuldade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tempo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Porções</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map((recipe) => (
                      <tr key={recipe.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-800 font-medium">{recipe.nome}</td>
                        <td className="py-3 px-4">
                          {recipe.categoria_receita ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                              {recipe.categoria_receita}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(recipe.dificuldade)}`}>
                            {recipesService.formatDificuldade(recipe.dificuldade)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{recipe.tempo_preparo} min</td>
                        <td className="py-3 px-4 text-gray-600">{recipe.rendimento_porcoes}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(recipe)}
                              className="p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => toast.info('Em breve', 'Modal de edição de receitas em desenvolvimento')}
                              className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(recipe.id)}
                              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{recipes.length}</span> de <span className="font-semibold">{total}</span> receitas
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadRecipes(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
                    >
                      Anterior
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => loadRecipes(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-primary text-white'
                              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => loadRecipes(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma receita encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal IA - Moderno */}
      <AnimatedModal
        isOpen={showIAModal}
        onClose={() => setShowIAModal(false)}
        title="Gerar Receita com IA"
        size="md"
      >
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingredientes (separados por vírgula)
            </label>
            <textarea
              value={ingredientesIA}
              onChange={(e) => setIngredientesIA(e.target.value)}
              placeholder="arroz, frango, tomate, cebola..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowIAModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGerarComIA}
              disabled={loadingIA}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loadingIA ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Gerar Receita
                </>
              )}
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Modal de Detalhes - Moderno */}
      <AnimatedModal
        isOpen={showDetailModal && selectedRecipe !== null}
        onClose={() => setShowDetailModal(false)}
        title={selectedRecipe?.nome || 'Receita'}
        size="lg"
      >
        {selectedRecipe && (
          <div className="space-y-6">
            {selectedRecipe.descricao && (
              <p className="text-gray-600 dark:text-gray-400">{selectedRecipe.descricao}</p>
            )}
              {/* Informações básicas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dificuldade</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(selectedRecipe.dificuldade)}`}>
                    {recipesService.formatDificuldade(selectedRecipe.dificuldade)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempo de Preparo</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{selectedRecipe.tempo_preparo} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rendimento</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{selectedRecipe.rendimento_porcoes} porções</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1 capitalize">{selectedRecipe.categoria_receita || '-'}</p>
                </div>
              </div>

              {/* Tags */}
              {(selectedRecipe.tags_dieta && selectedRecipe.tags_dieta.length > 0) && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.tags_dieta.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredientes */}
              {selectedRecipe.ingredientes && selectedRecipe.ingredientes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredientes</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredientes.map((ing) => (
                      <li key={ing.id} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="flex-1">
                          <span className="font-medium">{ing.quantidade} {recipesService.formatUnidade(ing.unidade)}</span>
                          {' '}
                          <span>{ing.produto?.nome || 'Produto'}</span>
                          {ing.observacao && <span className="text-gray-500 text-sm"> ({ing.observacao})</span>}
                          {ing.opcional && <span className="text-gray-400 text-sm italic"> - opcional</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modo de Preparo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Modo de Preparo</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedRecipe.modo_preparo}</p>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Avaliação Média</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {selectedRecipe.avaliacao_media > 0 ? `⭐ ${selectedRecipe.avaliacao_media.toFixed(1)}` : 'Sem avaliações'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vezes Executada</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{selectedRecipe.vezes_executada}x</p>
                </div>
              </div>
          </div>
        )}
      </AnimatedModal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Deletar Receita?"
        description="Esta ação não pode ser desfeita. A receita será permanentemente removida."
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showWeekConfirm}
        title="Gerar Semana de Receitas?"
        description="Serão geradas 21 receitas (3 por dia) para a semana. Isso pode demorar até 2 minutos."
        confirmText="Gerar"
        cancelText="Cancelar"
        onConfirm={confirmGerarSemana}
        onCancel={() => setShowWeekConfirm(false)}
      />
    </div>
  );
};
