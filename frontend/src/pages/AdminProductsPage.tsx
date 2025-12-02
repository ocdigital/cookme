import React, { useState, useEffect } from 'react';
import { Package, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { adminService, Product, ProductStats } from '../services/adminService';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Carregar dados
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
      setProducts(response.data);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar produtos',
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminService.getProductStats();
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

  // Obter categorias únicas para o filtro
  const categories = stats?.produtosPorCategoria || [];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
          Gestão de Produtos
        </h1>
        <p className="text-gray-500 mt-1">
          Visualize e gerencie todos os produtos do catálogo
        </p>
      </header>

      {/* Stats */}
      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total de Produtos
                </p>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.totalProdutos}
                </p>
              </div>
              <div className="text-2xl">📦</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Categorias
                </p>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.produtosPorCategoria.length}
                </p>
              </div>
              <div className="text-2xl">🏷️</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Marcas Cadastradas
                </p>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.produtosPorMarca.length}
                </p>
              </div>
              <div className="text-2xl">🏢</div>
            </div>
          </div>
        </section>
      )}

      {/* Main Card */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Produtos</CardTitle>
          <span className="text-sm text-gray-500">
            Total: {totalProducts} produtos
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
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
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm min-w-max"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.categoria} value={cat.categoria}>
                {cat.categoria} ({cat.total})
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
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
          ) : products.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Produto
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Marca
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Código
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Unidade
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-gray-800 font-medium">
                              {product.nome}
                            </p>
                            {product.descricao && (
                              <p className="text-gray-500 text-xs mt-1">
                                {product.descricao.substring(0, 50)}
                                {product.descricao.length > 50 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {product.categoria ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {product.categoria.icone && (
                                <span>{product.categoria.icone}</span>
                              )}
                              {product.categoria.nome}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {product.marca ? (
                            <span className="text-gray-700 text-sm">
                              {product.marca.nome}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {product.codigo_barras ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                              {product.codigo_barras}
                            </code>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-gray-700">
                            {product.unidade_padrao}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {product.verificado ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              ⊘ Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {new Date(product.criado_em).toLocaleDateString(
                            'pt-BR',
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
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
