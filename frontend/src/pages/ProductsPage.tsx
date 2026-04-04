import React, { useState, useEffect } from 'react';
import { Package, Edit2, Trash2, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditProductModal } from '../components/EditProductModal';
import { SearchInput } from '../components/SearchInput';
import { ActionButton } from '../components/ActionButton';
import { StatsBar } from '../components/StatsBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { TablePagination } from '../components/TablePagination';
import { adminService } from '../services/adminService';

type Product = {
  id: string;
  nome: string;
  categoria: {
    id: string;
    nome: string;
  } | null;
  descricao: string | null;
  codigo_barras: string | null;
  marca: {
    id: string;
    nome: string;
  } | null;
  unidade_padrao: string;
  validade_media_dias: number | null;
  origem: string;
  verificado: boolean;
  criado_em: Date;
  atualizado_em: Date;
  vezes_usada?: number;
  qualidade?: 'completo' | 'incompleto' | 'sem_imagem';
  popularidade?: number;
  ingrediente_receita?: boolean;
  confianca_classificacao?: number;
};

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productToClassify, setProductToClassify] = useState<Product | null>(null);
  const [totalStats, setTotalStats] = useState({ total: 0, maisUsados: 0, semImagem: 0, incompletos: 0 });

  useEffect(() => {
    loadProducts();
  }, [searchTerm, currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm || undefined,
      };
      const response = await adminService.listProducts(currentPage, 20, filters);
      setProducts(response.data || []);
      setTotalPages(response.totalPages || 1);

      // Update stats
      setTotalStats({
        total: response.total || 0,
        maisUsados: 0,
        semImagem: 0,
        incompletos: 0,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = totalStats;


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

  const handleClassifyProduct = (product: Product) => {
    setProductToClassify(product);
    setIsClassificationModalOpen(true);
  };

  const handleValidateClassification = async (nomeCorrigido: string, ehAlimento: boolean) => {
    if (!productToClassify) return;
    try {
      // Atualizar nome se foi corrigido
      if (nomeCorrigido !== productToClassify.nome) {
        await adminService.updateProduct(productToClassify.id, { nome: nomeCorrigido });
      }

      // Registrar validação no banco de conhecimento
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/product-classification/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          produto: nomeCorrigido || productToClassify.nome,
          categoria: ehAlimento ? 'alimento' : 'nao_alimento',
        }),
      });

      if (response.ok) {
        setIsClassificationModalOpen(false);
        setProductToClassify(null);
        loadProducts(); // Recarregar para mostrar classificação atualizada
      }
    } catch (error) {
      console.error('Erro ao validar classificação:', error);
    }
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
          { icon: <AlertCircle className="w-5 h-5" />, label: 'Página', value: products.length },
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
            placeholder="Buscar por nome ou código de barras..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Table Content */}
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Classificação</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Unidade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Validade Média</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{product.nome}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {product.categoria?.nome || 'Sem categoria'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {product.ingrediente_receita !== undefined ? (
                              <>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                                  {product.ingrediente_receita ? '🥗 Alimento' : '🧹 Não-alimento'}
                                </span>
                                {product.confianca_classificacao !== undefined && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.confianca_classificacao}%
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                Não classificado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <span>{product.verificado ? '✅' : '⚠️'}</span>
                            <span>{product.verificado ? 'Verificado' : 'Não verificado'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{product.unidade_padrao}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {product.validade_media_dias ? `${product.validade_media_dias}d` : '-'}
                        </td>
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
                              icon={<CheckCircle2 size={16} />}
                              title="Validar Classificação"
                              onClick={() => handleClassifyProduct(product)}
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                />
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
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                  {productDetails.categoria?.nome || 'Sem categoria'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Marca</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                  {productDetails.marca?.nome || 'Sem marca'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                  {productDetails.verificado ? '✅ Verificado' : '⚠️ Não verificado'}
                </p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Informações do Produto</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Código de Barras</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {productDetails.codigo_barras || 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Unidade Padrão</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{productDetails.unidade_padrao}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Validade Média (dias)</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {productDetails.validade_media_dias || '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Origem</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{productDetails.origem}</span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {productDetails.descricao && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Descrição</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{productDetails.descricao}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div>Criado em: {new Date(productDetails.criado_em).toLocaleDateString('pt-BR')}</div>
                <div>Atualizado em: {new Date(productDetails.atualizado_em).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Classification Validation Modal */}
      <AnimatedModal
        isOpen={isClassificationModalOpen && productToClassify !== null}
        onClose={() => {
          setIsClassificationModalOpen(false);
          setProductToClassify(null);
        }}
        title="Validar Classificação"
        size="md"
      >
        {productToClassify && (
          <ClassificationValidationForm
            product={productToClassify}
            onSubmit={handleValidateClassification}
            onClose={() => {
              setIsClassificationModalOpen(false);
              setProductToClassify(null);
            }}
          />
        )}
      </AnimatedModal>
    </div>
  );
};

// Classification Validation Form Component
const ClassificationValidationForm: React.FC<{
  product: Product;
  onSubmit: (nomeCorrigido: string, ehAlimento: boolean) => void;
  onClose: () => void;
}> = ({ product, onSubmit, onClose }) => {
  const [nomeCorrigido, setNomeCorrigido] = React.useState(product.nome);
  const [ehAlimento, setEhAlimento] = React.useState(product.ingrediente_receita ?? true);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(nomeCorrigido, ehAlimento);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome do Produto
        </label>
        <input
          type="text"
          value={nomeCorrigido}
          onChange={(e) => setNomeCorrigido(e.target.value)}
          placeholder="Ex: Creme de Leite"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Corrija o nome se necessário (ex: "Cr" → "Creme de Leite")
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Classificação
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition" onClick={() => setEhAlimento(true)}>
            <input
              type="radio"
              checked={ehAlimento}
              onChange={() => setEhAlimento(true)}
              className="w-4 h-4 text-green-600"
            />
            <span className="ml-3">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">🥗 Alimento</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Pode ser usado em receitas</span>
            </span>
          </label>

          <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition" onClick={() => setEhAlimento(false)}>
            <input
              type="radio"
              checked={!ehAlimento}
              onChange={() => setEhAlimento(false)}
              className="w-4 h-4 text-red-600"
            />
            <span className="ml-3">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">🧹 Não-alimento</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Limpeza, higiene, utensílios, etc</span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? '📤 Validando...' : '✓ Validar'}
        </button>
      </div>
    </div>
  );
};
