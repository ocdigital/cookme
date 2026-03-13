import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Edit2, Trash2, Eye, Plus, Sparkles, BookOpen, Zap, Loader } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { AnimatedModal } from '../components/AnimatedModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/SkeletonLoader';
import { RecipeFormModal } from '../components/RecipeFormModal';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showIAModal, setShowIAModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWeekConfirm, setShowWeekConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [ingredientesIA, setIngredientesIA] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'todas' | 'sugestoes'>('todas');
  const [suggestions, setSuggestions] = useState<Receita[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Carregar receitas
  useEffect(() => {
    loadRecipes(1);
  }, []);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    loadRecipes(1);
  }, [searchTerm, dificuldadeFilter]);

  // Carregar sugestões quando view mode muda para 'sugestoes'
  useEffect(() => {
    if (viewMode === 'sugestoes' && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [viewMode]);

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

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const data = await recipesService.getSugestoes();
      setSuggestions(data);
      if (data.length === 0) {
        toast.info('Sem sugestões', 'Nenhuma sugestão personalizada disponível no momento');
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      toast.error('Erro ao carregar sugestões', 'Tente novamente mais tarde');
    } finally {
      setLoadingSuggestions(false);
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
    setIsDetailsModalOpen(true);
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

  const handleCreateRecipe = () => {
    setSelectedRecipe(null);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditRecipe = (recipe: Receita) => {
    setSelectedRecipe(recipe);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (selectedRecipe?.id) {
        // Update
        await recipesService.update(selectedRecipe.id, {
          nome: data.nome,
          descricao: data.descricao,
          dificuldade: data.dificuldade,
          tempo_preparo: data.tempo_preparo,
          rendimento_porcoes: data.rendimento_porcoes,
          modo_preparo: data.modo_preparo,
        });
        toast.success('Receita atualizada com sucesso!');
      } else {
        // Create
        await recipesService.create({
          nome: data.nome,
          descricao: data.descricao,
          dificuldade: data.dificuldade,
          tempo_preparo: data.tempo_preparo,
          rendimento_porcoes: data.rendimento_porcoes,
          modo_preparo: data.modo_preparo,
          origem: 'manual',
          ingredientes: data.ingredientes,
        });
        toast.success('Receita criada com sucesso!');
      }

      setIsEditModalOpen(false);
      loadRecipes();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar receita');
      console.error('Erro ao salvar receita:', error);
    } finally {
      setFormLoading(false);
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

  const isLoading = viewMode === 'todas' ? loading : loadingSuggestions;
  const displayRecipes = viewMode === 'todas' ? recipes : suggestions;

  if (isLoading && displayRecipes.length === 0) {
    return (
      <div className="space-y-2">
        <header className="-mt-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Receitas</h1>
        </header>
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Receitas</h1>
      </header>

      {/* Stats Bar - TODO: Implement meaningful stats for recipes */}
      {/* <StatsBar
        items={[
          { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Total de Receitas', value: total },
          { icon: <BookOpen className="w-5 h-5" />, label: 'Página Atual', value: `${currentPage}/${totalPages}` },
          { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Receitas na Página', value: recipes.length },
        ]}
      /> */}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('todas')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            viewMode === 'todas'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            Todas as Receitas
          </div>
        </button>
        <button
          onClick={() => setViewMode('sugestoes')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            viewMode === 'sugestoes'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap size={16} />
            Sugestões (MOI)
          </div>
        </button>
      </div>

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
              onClick={handleCreateRecipe}
            >
              <Plus size={16} />
              Nova Receita
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <SearchInput
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={dificuldadeFilter}
            onChange={(e) => setDificuldadeFilter(e.target.value as any)}
            options={[
              { value: 'todas', label: 'Todas' },
              { value: 'facil', label: 'Fácil' },
              { value: 'media', label: 'Médio' },
              { value: 'dificil', label: 'Difícil' },
            ]}
          />
        </div>

        {/* Table Content */}
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : displayRecipes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Receita</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Dificuldade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Tempo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Porções</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecipes.map((recipe) => (
                      <tr key={recipe.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{recipe.nome}</td>
                        <td className="py-3 px-4">
                          {recipe.categoria_receita ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              {recipe.categoria_receita}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(recipe.dificuldade)}`}>
                            {recipesService.formatDificuldade(recipe.dificuldade)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{recipe.tempo_preparo} min</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{recipe.rendimento_porcoes}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="view"
                              icon={<Eye size={16} />}
                              title="Ver detalhes"
                              onClick={() => handleViewDetails(recipe)}
                            />
                            <ActionButton
                              variant="edit"
                              icon={<Edit2 size={16} />}
                              title="Editar"
                              onClick={() => handleEditRecipe(recipe)}
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {viewMode === 'todas' && totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={displayRecipes.length}
                  onPrevious={() => loadRecipes(currentPage - 1)}
                  onNext={() => loadRecipes(currentPage + 1)}
                />
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
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(selectedRecipe.dificuldade)}`}>
                    {recipesService.formatDificuldade(selectedRecipe.dificuldade)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tempo de Preparo</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1">{selectedRecipe.tempo_preparo} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rendimento</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1">{selectedRecipe.rendimento_porcoes} porções</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Categoria</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-1 capitalize">{selectedRecipe.categoria_receita || '-'}</p>
                </div>
              </div>

              {/* Tags */}
              {(selectedRecipe.tags_dieta && selectedRecipe.tags_dieta.length > 0) && (
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

              {/* Ingredientes */}
              {selectedRecipe.ingredientes && selectedRecipe.ingredientes.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Ingredientes</h3>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredientes.map((ing) => (
                      <li key={ing.id} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="flex-1">
                          <span className="font-medium text-gray-900 dark:text-gray-200">{ing.quantidade} {recipesService.formatUnidade(ing.unidade)}</span>
                          {' '}
                          <span className="text-gray-700 dark:text-gray-400">{ing.produto?.nome || 'Produto'}</span>
                          {ing.observacao && <span className="text-gray-500 dark:text-gray-500 text-sm"> ({ing.observacao})</span>}
                          {ing.opcional && <span className="text-gray-400 dark:text-gray-600 text-sm italic"> - opcional</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modo de Preparo */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Modo de Preparo</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedRecipe.modo_preparo}</p>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avaliação Média</p>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {selectedRecipe.avaliacao_media > 0 ? `⭐ ${selectedRecipe.avaliacao_media.toFixed(1)}` : 'Sem avaliações'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vezes Executada</p>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{selectedRecipe.vezes_executada}x</p>
                </div>
              </div>
          </div>
        )}
      </AnimatedModal>

      {/* Recipe Form Modal */}
      <RecipeFormModal
        isOpen={isEditModalOpen}
        isLoading={formLoading}
        error={formError}
        recipe={selectedRecipe}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRecipe(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
      />

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
