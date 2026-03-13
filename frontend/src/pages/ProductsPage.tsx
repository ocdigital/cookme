import React, { useState, useEffect } from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditProductModal } from '../components/EditProductModal';
import { SearchInput } from '../components/SearchInput';
import { ErrorAlert } from '../components/ErrorAlert';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
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

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, [page, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.listProducts(page, limit, {
        search: searchTerm,
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);
      await adminService.deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = () => {
    loadProducts();
  };

  const filteredProducts = products;

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Produtos</h1>
      </header>

      {/* Stats Bar - TODO: Implement meaningful stats for products */}
      {/* {stats && (
        <StatsBar
          items={[
            { icon: <Package className="w-5 h-5" />, label: 'Total de Produtos', value: stats.totalProdutos },
            { icon: <Tag className="w-5 h-5" />, label: 'Categorias', value: stats.produtosPorCategoria.length },
            { icon: <Layers className="w-5 h-5" />, label: 'Marcas', value: stats.produtosPorMarca.length },
          ]}
        />
      )} */}

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Lista de Produtos</CardTitle>
          <span className="text-sm text-gray-500">
            Total: {totalProducts} produtos
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <SearchInput
            placeholder="Buscar por nome ou código de barras..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {/* TODO: Add category filter when stats are needed */}
          {/* {stats && stats.produtosPorCategoria.length > 0 && (
            <FilterSelect
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              options={[
                { value: '', label: 'Todas as Categorias' },
                ...stats.produtosPorCategoria.map((cat: any) => ({
                  value: cat.categoria || '',
                  label: `${cat.categoria} (${cat.total})`,
                })),
              ]}
            />
          )} */}
        </div>

        {/* Table Content */}
        <CardContent>
          <ErrorAlert error={error} />

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
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Marca</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Unidade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Verificado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{product.nome}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            {product.categoria?.nome || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {product.marca?.nome || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {product.unidade_padrao}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              product.verificado
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {product.verificado ? '✓ Verificado' : '⊘ Não verificado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                          {new Date(product.criado_em).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="edit"
                              icon={<Edit2 size={16} />}
                              title="Editar"
                              onClick={() => handleEditProduct(product)}
                            />
                            <ActionButton
                              variant="delete"
                              icon={<Trash2 size={16} />}
                              title="Deletar"
                              onClick={() => handleDeleteProduct(product)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalProducts}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        product={productToEdit}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Deletar Produto?"
        description={`Tem certeza que deseja deletar o produto "${productToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
};
