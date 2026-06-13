import React, { useState, useEffect } from 'react';
import { Brain, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ActionButton } from '../components/ActionButton';
import { StatsBar } from '../components/StatsBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { TablePagination } from '../components/TablePagination';
import { adminService } from '../services/adminService';

type KnowledgeBaseEntry = {
  id: string;
  product_name: string;
  normalized_name: string;
  canonical_ingredient: string | null;
  ingrediente_receita: boolean | null;
  confidence_score: number;
  total_validacoes: number;
  classification_metadata: {
    source?: 'openai' | 'user_feedback' | 'manual';
  } | null;
  is_active: boolean;
  criado_em: string;
};

const SOURCE_LABELS: Record<string, string> = {
  openai: 'IA',
  user_feedback: 'Usuário',
  manual: 'Manual',
};

export const KnowledgeBasePage: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'ingrediente' | 'nao_ingrediente' | 'sem_classificacao'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<KnowledgeBaseEntry | null>(null);

  // Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<KnowledgeBaseEntry | null>(null);

  // Create
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Toggle loading per row
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [searchTerm, tipoFilter, currentPage]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await adminService.listKnowledgeBase(currentPage, 20, {
        search: searchTerm || undefined,
        tipo: tipoFilter,
      });
      setEntries(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Erro ao carregar knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIngrediente = async (entry: KnowledgeBaseEntry) => {
    setTogglingId(entry.id);
    try {
      const newValue = !entry.ingrediente_receita;
      await adminService.updateKnowledgeBaseEntry(entry.id, { ingrediente_receita: newValue });
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, ingrediente_receita: newValue } : e)),
      );
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    try {
      setDeleteLoading(true);
      await adminService.deleteKnowledgeBaseEntry(entryToDelete.id);
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
      loadEntries();
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSave = async (data: { canonical_ingredient: string; ingrediente_receita: boolean | null }) => {
    if (!entryToEdit) return;
    await adminService.updateKnowledgeBaseEntry(entryToEdit.id, {
      canonical_ingredient: data.canonical_ingredient || undefined,
      ingrediente_receita: data.ingrediente_receita ?? undefined,
    });
    setIsEditModalOpen(false);
    setEntryToEdit(null);
    loadEntries();
  };

  const handleCreateSave = async (data: { product_name: string; canonical_ingredient: string; ingrediente_receita: boolean | null }) => {
    await adminService.createKnowledgeBaseEntry({
      product_name: data.product_name,
      canonical_ingredient: data.canonical_ingredient || undefined,
      ingrediente_receita: data.ingrediente_receita ?? undefined,
    });
    setIsCreateModalOpen(false);
    loadEntries();
  };

  const confidenceColor = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 80) return 'text-green-600 dark:text-green-400';
    if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Base de Ingredientes</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <Brain className="w-5 h-5" />, label: 'Total', value: total },
          { icon: <Brain className="w-5 h-5" />, label: 'Página', value: entries.length },
        ]}
      />

      {/* Table */}
      <Card>
        <div className="mb-6">
          <CardTitle>Knowledge Base OCR</CardTitle>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <SearchInput
            placeholder="Buscar por nome OCR ou ingrediente canônico..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <FilterSelect
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value as typeof tipoFilter); setCurrentPage(1); }}
            options={[
              { value: 'all', label: 'Mostrar: Todos' },
              { value: 'ingrediente', label: 'Ingredientes' },
              { value: 'nao_ingrediente', label: 'Não ingredientes' },
              { value: 'sem_classificacao', label: 'Sem classificação' },
            ]}
          />
        </div>

        {/* Table Content */}
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Nome OCR</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Ingrediente canônico</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Elegível para receita</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Confiança</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Validações</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Fonte</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium max-w-[180px] truncate" title={entry.product_name}>
                          {entry.product_name}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 max-w-[140px] truncate" title={entry.canonical_ingredient ?? ''}>
                          {entry.canonical_ingredient || (
                            <span className="italic text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {entry.ingrediente_receita === null ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              Indefinido
                            </span>
                          ) : entry.ingrediente_receita ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                              Sim
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                              Não
                            </span>
                          )}
                        </td>
                        <td className={`py-2 px-3 font-semibold ${confidenceColor(entry.confidence_score)}`}>
                          {Math.round(entry.confidence_score * 100)}%
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {entry.total_validacoes}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {SOURCE_LABELS[entry.classification_metadata?.source ?? ''] ?? entry.classification_metadata?.source ?? '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleIngrediente(entry)}
                              disabled={togglingId === entry.id}
                              title={entry.ingrediente_receita ? 'Marcar como não ingrediente' : 'Marcar como ingrediente'}
                              className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-primary transition disabled:opacity-40"
                            >
                              {entry.ingrediente_receita ? (
                                <ToggleRight size={15} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <ToggleLeft size={15} />
                              )}
                            </button>
                            <ActionButton
                              variant="edit"
                              icon={<Edit2 size={13} />}
                              title="Editar"
                              onClick={() => { setEntryToEdit(entry); setIsEditModalOpen(true); }}
                            />
                            <ActionButton
                              variant="delete"
                              icon={<Trash2 size={13} />}
                              title="Deletar"
                              onClick={() => { setEntryToDelete(entry); setIsDeleteModalOpen(true); }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma entrada encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Remover entrada?"
        description={`Tem certeza que deseja remover "${entryToDelete?.product_name}" do Knowledge Base? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setIsDeleteModalOpen(false); setEntryToDelete(null); }}
      />

      {/* Edit Modal */}
      <AnimatedModal
        isOpen={isEditModalOpen && entryToEdit !== null}
        onClose={() => { setIsEditModalOpen(false); setEntryToEdit(null); }}
        title="Editar entrada"
        size="md"
      >
        {entryToEdit && (
          <KnowledgeBaseForm
            initialData={{
              product_name: entryToEdit.product_name,
              canonical_ingredient: entryToEdit.canonical_ingredient ?? '',
              ingrediente_receita: entryToEdit.ingrediente_receita,
            }}
            readonlyName
            onSave={(data) => handleEditSave(data as any)}
            onClose={() => { setIsEditModalOpen(false); setEntryToEdit(null); }}
          />
        )}
      </AnimatedModal>

      {/* Create Modal */}
      <AnimatedModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Adicionar entrada manual"
        size="md"
      >
        <KnowledgeBaseForm
          initialData={{ product_name: '', canonical_ingredient: '', ingrediente_receita: null }}
          readonlyName={false}
          onSave={handleCreateSave as any}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </AnimatedModal>
    </div>
  );
};

// ─── Inner Form ─────────────────────────────────────────────────────────────

type FormData = {
  product_name: string;
  canonical_ingredient: string;
  ingrediente_receita: boolean | null;
};

const KnowledgeBaseForm: React.FC<{
  initialData: FormData;
  readonlyName: boolean;
  onSave: (data: FormData) => Promise<void>;
  onClose: () => void;
}> = ({ initialData, readonlyName, onSave, onClose }) => {
  const [form, setForm] = useState<FormData>(initialData);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.product_name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Nome OCR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome OCR
        </label>
        <input
          type="text"
          value={form.product_name}
          onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
          readOnly={readonlyName}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${readonlyName ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder="Ex: Creme Leite Itambe 200g"
        />
      </div>

      {/* Ingrediente canônico */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ingrediente canônico
        </label>
        <input
          type="text"
          value={form.canonical_ingredient}
          onChange={(e) => setForm((f) => ({ ...f, canonical_ingredient: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          placeholder="Ex: creme de leite"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Nome normalizado usado para matching com ingredientes de receitas
        </p>
      </div>

      {/* Elegível para receita */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Elegível para receita
        </label>
        <div className="space-y-2">
          <label
            className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            onClick={() => setForm((f) => ({ ...f, ingrediente_receita: true }))}
          >
            <input type="radio" checked={form.ingrediente_receita === true} onChange={() => setForm((f) => ({ ...f, ingrediente_receita: true }))} className="w-4 h-4 text-green-600" />
            <span className="ml-3">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">Sim — alimento / ingrediente</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Pode aparecer em receitas</span>
            </span>
          </label>

          <label
            className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            onClick={() => setForm((f) => ({ ...f, ingrediente_receita: false }))}
          >
            <input type="radio" checked={form.ingrediente_receita === false} onChange={() => setForm((f) => ({ ...f, ingrediente_receita: false }))} className="w-4 h-4 text-red-600" />
            <span className="ml-3">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">Não — produto não-alimentício</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Limpeza, higiene, utensílios, etc.</span>
            </span>
          </label>

          <label
            className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            onClick={() => setForm((f) => ({ ...f, ingrediente_receita: null }))}
          >
            <input type="radio" checked={form.ingrediente_receita === null} onChange={() => setForm((f) => ({ ...f, ingrediente_receita: null }))} className="w-4 h-4 text-gray-400" />
            <span className="ml-3">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">Indefinido</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Aguardando classificação</span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.product_name.trim()}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 rounded-lg transition flex items-center justify-center gap-2"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};
