import React, { useState } from 'react';
import { Package, Edit2, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditProductModal } from '../components/EditProductModal';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ActionButton } from '../components/ActionButton';
import { StatsBar } from '../components/StatsBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { mockProducts } from '../mocks/mockData';

type Product = {
  id: string;
  nome: string;
  categoria: string;
  preco_medio: number;
  imagem_url?: string;
  codigo_barras: string;
  calorias: number;
  proteina: number;
  gordura: number;
  carboidratos: number;
  data_criacao: string;
  usuario_criacao: string;
  quantidade_inventarios: number;
  vezes_usada: number;
  qualidade: 'completo' | 'incompleto' | 'sem_imagem';
  popularidade: number;
};

export const ProductsPage: React.FC = () => {
  const [products] = useState<Product[]>(mockProducts);
  const [loading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);

  // Get unique categories
  const categorias = ['todos', ...Array.from(new Set(products.map(p => p.categoria)))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaFilter === 'todos' || product.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  // Calculate stats
  const stats = {
    total: products.length,
    maisUsados: products.filter(p => p.vezes_usada > 100).length,
    semImagem: products.filter(p => p.qualidade === 'sem_imagem').length,
    incompletos: products.filter(p => p.qualidade === 'incompleto').length,
  };

  const getQualidadeBadge = (qualidade: string) => {
    switch (qualidade) {
      case 'completo':
        return { icon: '✅', label: 'Completo', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' };
      case 'incompleto':
        return { icon: '⚠️', label: 'Incompleto', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' };
      case 'sem_imagem':
        return { icon: '❌', label: 'Sem Imagem', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' };
      default:
        return { icon: '?', label: 'N/A', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
    }
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
      // Mock delete
      console.log('Deletando produto:', productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetails = (product: Product) => {
    setProductDetails(product);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Produtos</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <Package className="w-5 h-5" />, label: 'Total', value: stats.total },
          { icon: <Package className="w-5 h-5" />, label: 'Mais Usados', value: stats.maisUsados },
          { icon: <AlertCircle className="w-5 h-5" />, label: 'Sem Imagem', value: stats.semImagem },
          { icon: <AlertCircle className="w-5 h-5" />, label: 'Incompletos', value: stats.incompletos },
        ]}
      />

      {/* Table */}
      <Card>
        <div className="mb-6">
          <CardTitle>Catálogo de Produtos</CardTitle>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <SearchInput
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            options={categorias.map(cat => ({
              value: cat,
              label: cat === 'todos' ? 'Categoria: Todas' : `Categoria: ${cat}`,
            }))}
          />
        </div>

        {/* Table Content */}
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Qualidade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Popularidade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Vezes Usada</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const qualidadeBadge = getQualidadeBadge(product.qualidade);
                      return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{product.nome}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {product.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${qualidadeBadge.color}`}>
                            <span>{qualidadeBadge.icon}</span>
                            <span>{qualidadeBadge.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 w-32">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 flex-1">
                              <div
                                style={{ width: `${product.popularidade}%` }}
                                className="bg-primary h-1.5 rounded-full"
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{product.popularidade}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{product.vezes_usada}x</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="view"
                              icon={<Eye size={16} />}
                              title="Detalhes"
                              onClick={() => handleViewDetails(product)}
                            />
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EditProductModal
        isOpen={isEditModalOpen}
        product={productToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Deletar Produto?"
        description={`Tem certeza que deseja deletar o produto ${productToDelete?.nome}? Esta ação não pode ser desfeita.`}
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

      {/* Details Modal */}
      <AnimatedModal
        isOpen={isDetailsModalOpen && productDetails !== null}
        onClose={() => setIsDetailsModalOpen(false)}
        title={productDetails?.nome || 'Detalhes do Produto'}
        size="lg"
      >
        {productDetails && (
          <div className="space-y-4">
            {/* Info Principal */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Categoria</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{productDetails.categoria}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preço Médio</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">R$ {productDetails.preco_medio.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vezes Usada</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{productDetails.vezes_usada}x</p>
              </div>
            </div>

            {/* Nutricional */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Informações Nutricionais</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded p-2">
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Calorias</p>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{productDetails.calorias} kcal</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded p-2">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1">Proteína</p>
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">{productDetails.proteina}g</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded p-2">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Gordura</p>
                  <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{productDetails.gordura}g</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Carboidrato</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{productDetails.carboidratos}g</p>
                </div>
              </div>
            </div>

            {/* Qualidade Checklist */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Checklist de Qualidade</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={productDetails.imagem_url ? '✅' : '❌'}>{'  '}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Imagem disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={productDetails.codigo_barras ? '✅' : '❌'}>{'  '}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Código de barras</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={productDetails.preco_medio > 0 ? '✅' : '❌'}>{'  '}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Preço informado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={productDetails.calorias > 0 ? '✅' : '❌'}>{'  '}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Informações nutricionais</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Criado em</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{productDetails.data_criacao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Criado por</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{productDetails.usuario_criacao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Em inventários</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{productDetails.quantidade_inventarios} vezes</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};
