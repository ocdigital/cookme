import React, { useState, useEffect, useCallback } from 'react';
import { Salad, ToggleLeft, ToggleRight, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { StatsBar } from '../components/StatsBar';
import { TablePagination } from '../components/TablePagination';
import { adminService } from '../services/adminService';
import { toast } from 'sonner';

type Produto = {
  id: string;
  nome: string;
  unidade_padrao: string;
  origem: string;
  ingrediente_receita: boolean | null;
  verificado: boolean;
  criado_em: string;
};

type FilterTipo = 'all' | 'ingrediente' | 'nao_ingrediente' | 'sem_classificacao';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'ingrediente', label: 'Ingredientes' },
  { value: 'nao_ingrediente', label: 'Não Ingredientes' },
  { value: 'sem_classificacao', label: 'Sem Classificação' },
];

function StatusBadge({ value }: { value: boolean | null }) {
  if (value === true)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 size={12} /> Ingrediente
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        <XCircle size={12} /> Não Ingrediente
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <HelpCircle size={12} /> Sem classificação
    </span>
  );
}

export const IngredientsPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ ingredientes: 0, nao_ingredientes: 0, sem_classificacao: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listProducts(currentPage, 30, {
        search: searchTerm || undefined,
        ingredienteFilter: filterTipo !== 'all' ? filterTipo : undefined,
      } as any);
      setProdutos((res.data || []) as any);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);

      // Stats (always full counts, no filter)
      const all = await adminService.listProducts(1, 1, {});
      const ing = await adminService.listProducts(1, 1, { ingredienteFilter: 'ingrediente' } as any);
      const nao = await adminService.listProducts(1, 1, { ingredienteFilter: 'nao_ingrediente' } as any);
      const sem = await adminService.listProducts(1, 1, { ingredienteFilter: 'sem_classificacao' } as any);
      setStats({
        ingredientes: (ing as any).total || 0,
        nao_ingredientes: (nao as any).total || 0,
        sem_classificacao: (sem as any).total || 0,
      });
      void all;
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterTipo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (produto: Produto) => {
    const novoValor = produto.ingrediente_receita === true ? false : true;
    setTogglingId(produto.id);
    try {
      await adminService.updateProdutoClassificacao(produto.id, novoValor);
      setProdutos(prev =>
        prev.map(p => p.id === produto.id ? { ...p, ingrediente_receita: novoValor } : p)
      );
      toast.success(`"${produto.nome}" marcado como ${novoValor ? 'ingrediente' : 'não ingrediente'}`);
    } catch {
      toast.error('Erro ao atualizar classificação');
    } finally {
      setTogglingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Salad size={24} className="text-green-600" />
            Ingredientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie quais produtos são reconhecidos como ingredientes de receitas
          </p>
        </div>
      </div>

      <StatsBar
        items={[
          { icon: <CheckCircle2 size={14} />, label: 'Ingredientes', value: stats.ingredientes },
          { icon: <XCircle size={14} />, label: 'Não Ingredientes', value: stats.nao_ingredientes },
          { icon: <HelpCircle size={14} />, label: 'Sem Classificação', value: stats.sem_classificacao },
        ]}
      />

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar produto..."
              />
            </div>
            <FilterSelect
              value={filterTipo}
              onChange={(e) => { setFilterTipo(e.target.value as FilterTipo); setCurrentPage(1); }}
              options={FILTER_OPTIONS}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Salad size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-1.5 px-3 font-medium text-gray-500">Produto</th>
                    <th className="text-left py-1.5 px-3 font-medium text-gray-500">Unidade</th>
                    <th className="text-left py-1.5 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-center py-1.5 px-3 font-medium text-gray-500">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-800/20'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{p.nome}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500 uppercase text-xs">{p.unidade_padrao}</td>
                      <td className="py-2 px-3">
                        <StatusBadge value={p.ingrediente_receita} />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleToggle(p)}
                          disabled={togglingId === p.id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all
                            hover:bg-green-50 hover:border-green-300 hover:text-green-700
                            border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          title={p.ingrediente_receita ? 'Marcar como não ingrediente' : 'Marcar como ingrediente'}
                        >
                          {togglingId === p.id ? (
                            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          ) : p.ingrediente_receita ? (
                            <ToggleRight size={14} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={14} />
                          )}
                          {p.ingrediente_receita ? 'Ingrediente' : 'Não é ingrediente'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => handlePageChange(currentPage - 1)}
                  onNext={() => handlePageChange(currentPage + 1)}
                  totalItems={total}
                  itemsPerPage={30}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
