import React, { useState, useEffect } from 'react';
import { Package, Edit2, Trash2, Search, AlertCircle, ChevronLeft, ChevronRight, Tag, Layers } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { StatsBar } from '../components/StatsBar';
import { adminService } from '../services/adminService';

type Product = {
  id: string;
  nome: string;
  descricao: string | null;
  codigo_barras: string | null;
  categoria: { id: string; nome: string; icone?: string } | null;
  marca: { id: string; nome: string } | null;
  unidade_padrao: string;
  validade_media_dias: number | null;
  origem: string;
  verificado: boolean;
  criado_em: Date;
  atualizado_em: Date;
};

type ProductStats = {
  totalProdutos: number;
  produtosPorCategoria: Array<{ categoria: string; total: number }>;
  produtosPorMarca: Array<{ marca: string; total: number }>;
};

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, [page, searchTerm, categoryFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.listProducts(page, limit, {
        search: searchTerm,
        categoriaId: categoryFilter,
        sort: 'criado_em',
        order: 'DESC',
      });
      console.log('📦 Produtos carregados:', {
        total: response.total,
        dataLength: response.data.length,
        firstProduct: response.data[0]?.nome,
      });
      setProducts(response.data);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar produtos',
      );
      console.error('❌ Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminService.getProductStats();
      console.log('📊 Estatísticas de produtos:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const filteredProducts = products;

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Produtos</h1>
      </header>

      {/* Stats Bar */}
      {stats && (
        <StatsBar
          items={[
            { icon: <Package className="w-5 h-5" />, label: 'Total de Produtos', value: stats.totalProdutos },
            { icon: <Tag className="w-5 h-5" />, label: 'Categorias', value: stats.produtosPorCategoria.length },
            { icon: <Layers className="w-5 h-5" />, label: 'Marcas', value: stats.produtosPorMarca.length },
          ]}
        />
      )}

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Produtos</CardTitle>
          <span className="text-sm text-gray-500">
            Total: {totalProducts} produtos
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou código de barras..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            />
          </div>
          {stats && stats.produtosPorCategoria.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm min-w-max"
            >
              <option value="">Todas as Categorias</option>
              {stats.produtosPorCategoria.map((cat) => (
                <option key={cat.categoria} value={cat.categoria}>
                  {cat.categoria} ({cat.total})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Table Content */}
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold">Erro</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Produto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Marca</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Unidade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Verificado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 font-medium">{product.nome}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {product.categoria?.nome || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {product.marca?.nome || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {product.unidade_padrao}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              product.verificado
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {product.verificado ? '✓ Verificado' : '⊘ Não verificado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {new Date(product.criado_em).toLocaleDateString('pt-BR')}
                        </td>
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Página {page} de {totalPages} ({totalProducts} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próximo
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
