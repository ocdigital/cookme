import React, { useState, useEffect } from 'react';
import { Hash, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { StatsBar } from '../components/StatsBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { TablePagination } from '../components/TablePagination';
import { adminService } from '../services/adminService';

type Abbreviation = {
  id: string;
  abbr: string;
  expanded: string;
  is_ingredient: boolean;
  categoria: string | null;
  source: 'seed' | 'user' | 'ai';
  is_active: boolean;
  criado_em: string;
};

const SOURCE_LABELS: Record<string, string> = {
  seed: 'Seed',
  user: 'Manual',
  ai: 'IA',
};

const SOURCE_COLORS: Record<string, string> = {
  seed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ai: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export const AbbreviationsPage: React.FC = () => {
  const [entries, setEntries] = useState<Abbreviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'ingrediente' | 'nao_ingrediente'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Abbreviation | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<Abbreviation | null>(null);
  const [editForm, setEditForm] = useState({ abbr: '', expanded: '', is_ingredient: true, categoria: '' });
  const [editLoading, setEditLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ abbr: '', expanded: '', is_ingredient: true, categoria: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const result = await adminService.listAbbreviations(currentPage, 50, {
        search: searchTerm || undefined,
        tipo: tipoFilter,
      });
      setEntries(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      toast.error('Erro ao carregar abreviações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentPage, searchTerm, tipoFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTipoFilter(val as typeof tipoFilter);
    setCurrentPage(1);
  };

  const openEdit = (entry: Abbreviation) => {
    setEntryToEdit(entry);
    setEditForm({
      abbr: entry.abbr,
      expanded: entry.expanded,
      is_ingredient: entry.is_ingredient,
      categoria: entry.categoria ?? '',
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!entryToEdit) return;
    setEditLoading(true);
    try {
      await adminService.updateAbbreviation(entryToEdit.id, {
        abbr: editForm.abbr,
        expanded: editForm.expanded,
        is_ingredient: editForm.is_ingredient,
        categoria: editForm.categoria || undefined,
      });
      toast.success('Abreviação atualizada');
      setIsEditModalOpen(false);
      load();
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.abbr.trim() || !createForm.expanded.trim()) {
      toast.error('Abreviação e expansão são obrigatórias');
      return;
    }
    setCreateLoading(true);
    try {
      await adminService.createAbbreviation({
        abbr: createForm.abbr.trim().toUpperCase(),
        expanded: createForm.expanded.trim().toLowerCase(),
        is_ingredient: createForm.is_ingredient,
        categoria: createForm.categoria || undefined,
      });
      toast.success('Abreviação criada');
      setIsCreateModalOpen(false);
      setCreateForm({ abbr: '', expanded: '', is_ingredient: true, categoria: '' });
      load();
    } catch {
      toast.error('Erro ao criar');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteAbbreviation(entryToDelete.id);
      toast.success('Abreviação removida');
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
      load();
    } catch {
      toast.error('Erro ao remover');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (entry: Abbreviation) => {
    try {
      await adminService.updateAbbreviation(entry.id, { is_ingredient: !entry.is_ingredient });
      toast.success(`Alterado para ${!entry.is_ingredient ? 'ingrediente' : 'não ingrediente'}`);
      load();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleReloadCache = async () => {
    try {
      await adminService.reloadAbbreviationsCache();
      toast.success('Cache recarregado no servidor');
    } catch {
      toast.error('Erro ao recarregar cache');
    }
  };

  const ingredienteCount = entries.filter(e => e.is_ingredient).length;
  const naoIngredienteCount = entries.filter(e => !e.is_ingredient).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <Hash size={18} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Abreviações OCR</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{total} abreviações cadastradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReloadCache}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw size={13} />
            Recarregar cache
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
          >
            <Plus size={14} />
            Nova Abreviação
          </button>
        </div>
      </div>

      <StatsBar
        items={[
          { label: 'Total', value: total, icon: <Hash size={14} /> },
          { label: 'Ingredientes', value: ingredienteCount, icon: <Hash size={14} /> },
          { label: 'Não ingredientes', value: naoIngredienteCount, icon: <Hash size={14} /> },
        ]}
      />

      <Card>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar por abreviação, nome ou categoria..."
            />
            <FilterSelect
              value={tipoFilter}
              onChange={handleFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'ingrediente', label: 'Ingredientes' },
                { value: 'nao_ingrediente', label: 'Não ingredientes' },
              ]}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              Nenhuma abreviação encontrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2 pr-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">Abreviação</th>
                    <th className="pb-2 pr-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">Expansão</th>
                    <th className="pb-2 pr-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">Elegível</th>
                    <th className="pb-2 pr-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">Categoria</th>
                    <th className="pb-2 pr-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">Fonte</th>
                    <th className="pb-2 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {entries.map((entry) => (
                    <tr key={entry.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!entry.is_active ? 'opacity-40' : ''}`}>
                      <td className="py-2 pr-3">
                        <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {entry.abbr}
                        </code>
                      </td>
                      <td className="py-2 pr-3 text-gray-800 dark:text-gray-200 font-medium">{entry.expanded}</td>
                      <td className="py-2 pr-3">
                        <button
                          onClick={() => handleToggle(entry)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            entry.is_ingredient
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200'
                          }`}
                        >
                          {entry.is_ingredient ? 'Sim' : 'Não'}
                        </button>
                      </td>
                      <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 text-xs">{entry.categoria ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${SOURCE_COLORS[entry.source]}`}>
                          {SOURCE_LABELS[entry.source]}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => { setEntryToDelete(entry); setIsDeleteModalOpen(true); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage(p => Math.max(1, p - 1))}
                onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create modal */}
      <AnimatedModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Abreviação"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Abreviação (ex: MAC, BIS, DET)
            </label>
            <input
              type="text"
              value={createForm.abbr}
              onChange={e => setCreateForm(f => ({ ...f, abbr: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono uppercase"
              placeholder="MAC"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expansão (nome canônico)
            </label>
            <input
              type="text"
              value={createForm.expanded}
              onChange={e => setCreateForm(f => ({ ...f, expanded: e.target.value.toLowerCase() }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="macarrão"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria (opcional)
            </label>
            <input
              type="text"
              value={createForm.categoria}
              onChange={e => setCreateForm(f => ({ ...f, categoria: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="massas, laticínios, limpeza..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-is-ingredient"
              checked={createForm.is_ingredient}
              onChange={e => setCreateForm(f => ({ ...f, is_ingredient: e.target.checked }))}
              className="w-4 h-4 text-primary rounded"
            />
            <label htmlFor="create-is-ingredient" className="text-sm text-gray-700 dark:text-gray-300">
              Elegível como ingrediente de receita
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createLoading}
              className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {createLoading ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Edit modal */}
      <AnimatedModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Abreviação"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Abreviação</label>
            <input
              type="text"
              value={editForm.abbr}
              onChange={e => setEditForm(f => ({ ...f, abbr: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expansão</label>
            <input
              type="text"
              value={editForm.expanded}
              onChange={e => setEditForm(f => ({ ...f, expanded: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <input
              type="text"
              value={editForm.categoria}
              onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-is-ingredient"
              checked={editForm.is_ingredient}
              onChange={e => setEditForm(f => ({ ...f, is_ingredient: e.target.checked }))}
              className="w-4 h-4 text-primary rounded"
            />
            <label htmlFor="edit-is-ingredient" className="text-sm text-gray-700 dark:text-gray-300">
              Elegível como ingrediente de receita
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleEdit}
              disabled={editLoading}
              className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {editLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Remover Abreviação"
        description={`Remover "${entryToDelete?.abbr}" → "${entryToDelete?.expanded}"?`}
        confirmText="Remover"
        isDangerous
      />
    </div>
  );
};
