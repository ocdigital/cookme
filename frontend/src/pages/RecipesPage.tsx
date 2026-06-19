import React, { useState, useEffect } from 'react';
import { Trash2, Eye, AlertTriangle, Flame, Star, Sparkles, ImageIcon, Check, X } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { AnimatedModal } from '../components/AnimatedModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
import { StatsBar } from '../components/StatsBar';
import { useToast } from '../hooks/useToast';
import recipesService from '../services/recipesService';
import { adminService } from '../services/adminService';

interface RecipeIngrediente {
  id: string;
  quantidade?: number;
  unidade?: string;
  a_gosto?: boolean;
  opcional?: boolean;
  observacao?: string;
  ordem?: number;
  produto?: { id: string; nome: string; unidade_padrao?: string };
}

interface Recipe {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  categoria_receita?: string;
  tempo_preparo: number;
  dificuldade: string;
  ingredientes?: RecipeIngrediente[];
  vezes_executada?: number;
  avaliacao_media?: number;
  modo_preparo?: string;
  rendimento_porcoes?: number;
  tags_dieta?: string[];
  denuncias?: number;
  status_moderacao?: 'ok' | 'em_revisao' | 'arquivado';
  imagem_url?: string;
  validation_score?: number | null;
  validation_issues?: string | null;
}

type DificuldadeReceita = 'facil' | 'media' | 'dificil';

export const RecipesPage: React.FC = () => {
  const toast = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dificuldadeFilter, setDificuldadeFilter] = useState<'todas' | DificuldadeReceita>('todas');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [editandoImagem, setEditandoImagem] = useState(false);
  const [novaImagemUrl, setNovaImagemUrl] = useState('');
  const [salvandoImagem, setSalvandoImagem] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, [searchTerm, dificuldadeFilter, categoriaFilter, currentPage]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await adminService.listRecipes(currentPage, 20, {
        search: searchTerm || undefined,
        dificuldade: dificuldadeFilter !== 'todas' ? dificuldadeFilter : undefined,
        categoria: categoriaFilter !== 'todas' ? categoriaFilter : undefined,
      });
      setRecipes(response.data as any);
      setTotalPages(response.totalPages);
      setTotalReceitas((response as any).total ?? 0);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      toast.error('Erro ao carregar receitas', 'Tente novamente mais tarde');
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from loaded recipes
  const categorias: string[] = ['todas', ...Array.from(new Set(recipes.map(r => r.categoria_receita || r.categoria || '').filter(Boolean)))];

  // Recipes are already filtered on backend, so use them directly
  const filteredRecipes = recipes;

  // Calculate stats
  const stats = {
    total: totalReceitas || recipes.length,
    maisExecutadas: recipes.filter(r => (r.vezes_executada || 0) > 50).length,
    avaliacaoBaixa: recipes.filter(r => (r.avaliacao_media || 0) < 3).length,
    emRevisao: recipes.filter(r => r.status_moderacao === 'em_revisao' || (r.denuncias || 0) > 0).length,
  };

  const renderEstrelas = (avaliacao: number | string | undefined) => {
    const value = typeof avaliacao === 'string' ? parseFloat(avaliacao) : (avaliacao ?? 0);
    if (!value || isNaN(value)) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">Sem avaliações</span>;
    }
    const colorClass = value >= 4 ? 'text-green-600 dark:text-green-400' : value >= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              size={13}
              className={n <= Math.round(value) ? `fill-current ${colorClass}` : 'text-gray-300 dark:text-gray-600'}
            />
          ))}
        </div>
        <span className={`text-xs font-bold ${colorClass}`}>{value.toFixed(1)}</span>
      </div>
    );
  };

  const handleDelete = (id: string) => {
    setRecipeToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!recipeToDelete) return;

    try {
      setDeleteLoading(true);
      // Arquivar receita (não deletar)
      await adminService.atualizarModeracaoReceita(recipeToDelete, 'arquivado');
      toast.success('Receita arquivada com sucesso!');
      loadRecipes();
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Erro ao arquivar receita:', error);
      toast.error('Erro ao arquivar receita', 'Tente novamente mais tarde');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailsModalOpen(true);
  };

  const handleEditarImagem = (recipe: Recipe) => {
    setNovaImagemUrl(recipe.imagem_url || '');
    setEditandoImagem(true);
  };

  const handleSalvarImagem = async () => {
    if (!selectedRecipe) return;
    setSalvandoImagem(true);
    try {
      await adminService.atualizarReceita(selectedRecipe.id, { imagem_url: novaImagemUrl });
      setSelectedRecipe({ ...selectedRecipe, imagem_url: novaImagemUrl });
      setEditandoImagem(false);
      toast.success('Imagem atualizada!');
      loadRecipes();
    } catch {
      toast.error('Erro ao salvar imagem');
    } finally {
      setSalvandoImagem(false);
    }
  };

  const handleGerarIA = async () => {
    setGerandoIA(true);
    try {
      await adminService.gerarReceitasIA();
      toast.success('Geração iniciada!', 'Você receberá uma notificação quando as receitas estiverem prontas.');
    } catch (error: any) {
      toast.error('Erro ao iniciar geração', error?.message || 'Tente novamente');
    } finally {
      setGerandoIA(false);
    }
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="space-y-2">
        <header className="-mt-1">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Receitas</h1>
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
      <header className="-mt-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Receitas</h1>
        <button
          onClick={handleGerarIA}
          disabled={gerandoIA}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
        >
          <Sparkles size={14} />
          {gerandoIA ? 'Iniciando...' : 'Gerar via IA'}
        </button>
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
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Receita</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Dificuldade</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Execuções</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Avaliação</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipes.map((recipe) => {
                      const isTrending = (recipe.vezes_executada || 0) > 50;
                      const temRisco = recipe.status_moderacao === 'em_revisao' || (recipe.denuncias || 0) > 0;

                      return (
                      <tr
                        key={recipe.id}
                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          temRisco ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium">{recipe.nome}</td>
                        <td className="py-2 px-3">
                          {recipe.categoria_receita || recipe.categoria ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              {recipe.categoria_receita || recipe.categoria}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(recipe.dificuldade as DificuldadeReceita)}`}>
                            {recipesService.formatDificuldade(recipe.dificuldade as DificuldadeReceita)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 dark:text-gray-400">{recipe.vezes_executada || 0}x</span>
                            {isTrending && <span className="text-lg">🔥</span>}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {renderEstrelas(recipe.avaliacao_media)}
                        </td>
                        <td className="py-2 px-3">
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
                        <td className="py-2 px-3">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="view"
                              icon={<Eye size={13} />}
                              title="Ver detalhes"
                              onClick={() => handleViewDetails(recipe)}
                            />
                            <ActionButton
                              variant="delete"
                              icon={<Trash2 size={13} />}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                />
              )}
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
            {/* Imagem */}
            <div className="relative group">
              {selectedRecipe.imagem_url ? (
                <img
                  src={editandoImagem && novaImagemUrl ? novaImagemUrl : selectedRecipe.imagem_url}
                  alt={selectedRecipe.nome}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">🍽️</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Sem imagem</span>
                </div>
              )}
              {!editandoImagem && (
                <button
                  onClick={() => handleEditarImagem(selectedRecipe)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Editar imagem"
                >
                  <ImageIcon size={14} />
                </button>
              )}
            </div>

            {/* Editor de imagem */}
            {editandoImagem && (
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={novaImagemUrl}
                  onChange={(e) => setNovaImagemUrl(e.target.value)}
                  placeholder="Cole a URL da imagem..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSalvarImagem}
                  disabled={salvandoImagem}
                  className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                  title="Salvar"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditandoImagem(false)}
                  className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {selectedRecipe.descricao && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRecipe.descricao}</p>
            )}

            {/* Informações básicas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dificuldade</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${recipesService.getDificuldadeColor(selectedRecipe.dificuldade as DificuldadeReceita)}`}>
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

            {/* Ingredientes */}
            {selectedRecipe.ingredientes && selectedRecipe.ingredientes.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Ingredientes ({selectedRecipe.ingredientes.length})
                </h3>
                <ul className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1">
                  {selectedRecipe.ingredientes
                    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                    .map((ing, i) => (
                      <li key={ing.id ?? i} className="text-sm text-gray-700 dark:text-gray-300 flex items-baseline gap-1">
                        <span className="text-gray-400 dark:text-gray-500 text-xs w-4 shrink-0">{(ing.ordem ?? i) + 1}.</span>
                        {ing.observacao ? (
                          <span>{ing.observacao}</span>
                        ) : (
                          <>
                            {ing.quantidade && <span className="font-medium">{ing.quantidade}</span>}
                            {ing.unidade && <span className="text-gray-500 dark:text-gray-400">{ing.unidade}</span>}
                            {ing.a_gosto && <span className="text-gray-500 dark:text-gray-400">a gosto</span>}
                            <span>{ing.produto?.nome ?? '—'}</span>
                            {ing.opcional && <span className="text-xs text-gray-400 dark:text-gray-500">(opcional)</span>}
                          </>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Modo de Preparo */}
            {selectedRecipe.modo_preparo && (() => {
              const raw = selectedRecipe.modo_preparo!;
              let passos: string[];
              try {
                const parsed = JSON.parse(raw);
                passos = Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : raw.split(/\\n|\n/).map(p => p.trim()).filter(Boolean);
              } catch {
                passos = raw.split(/\\n|\n/).map(p => p.trim()).filter(Boolean);
              }
              return (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Modo de Preparo ({passos.length} {passos.length === 1 ? 'passo' : 'passos'})
                  </h3>
                  <ol className="space-y-2">
                    {passos.map((passo, i) => {
                      const clean = passo.replace(/^(Passo\s*\d+\s*[:.-]?\s*|\d+\s*[:.-]\s*)/i, '').trim();
                      return (
                        <li key={i} className="flex gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{clean || passo}</p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })()}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avaliação Média</p>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedRecipe.avaliacao_media && Number(selectedRecipe.avaliacao_media) > 0 ? `⭐ ${Number(selectedRecipe.avaliacao_media).toFixed(1)}` : 'Sem avaliações'}
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
                {selectedRecipe.validation_score != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Score IA</span>
                    <span className={`font-semibold ${
                      selectedRecipe.validation_score >= 75 ? 'text-green-600 dark:text-green-400'
                      : selectedRecipe.validation_score >= 40 ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                      {selectedRecipe.validation_score}/100
                    </span>
                  </div>
                )}
                {selectedRecipe.validation_issues && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
                    ⚠️ {selectedRecipe.validation_issues}
                  </p>
                )}
                {selectedRecipe.status_moderacao === 'em_revisao' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      onClick={async () => {
                        await adminService.atualizarModeracaoReceita(selectedRecipe.id, 'ok');
                        toast.success('Receita aprovada!');
                        setIsDetailsModalOpen(false);
                        loadRecipes();
                      }}
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      onClick={async () => {
                        await adminService.atualizarModeracaoReceita(selectedRecipe.id, 'arquivado');
                        toast.success('Receita arquivada!');
                        setIsDetailsModalOpen(false);
                        loadRecipes();
                      }}
                    >
                      📦 Arquivar
                    </button>
                  </div>
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
