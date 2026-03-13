import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
import { adminService } from '../services/adminService';

interface Product {
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
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    codigo_barras: '',
    unidade_padrao: '',
    validade_media_dias: '',
    origem: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome || '',
        descricao: product.descricao || '',
        codigo_barras: product.codigo_barras || '',
        unidade_padrao: product.unidade_padrao || '',
        validade_media_dias: product.validade_media_dias?.toString() || '',
        origem: product.origem || '',
      });
    }
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setError(null);
    setIsLoading(true);

    try {
      await adminService.updateProduct(product.id, {
        nome: formData.nome,
        descricao: formData.descricao || null,
        codigo_barras: formData.codigo_barras || null,
        unidade_padrao: formData.unidade_padrao,
        validade_media_dias: formData.validade_media_dias
          ? parseInt(formData.validade_media_dias)
          : null,
        origem: formData.origem,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Erro ao atualizar produto. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar Produto: ${product?.nome || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Produto *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            placeholder="Digite o nome do produto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição
          </label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm resize-none"
            placeholder="Digite a descrição do produto"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código de Barras
            </label>
            <input
              type="text"
              name="codigo_barras"
              value={formData.codigo_barras}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              placeholder="Ex: 7896542300000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidade Padrão *
            </label>
            <input
              type="text"
              name="unidade_padrao"
              value={formData.unidade_padrao}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              placeholder="Ex: kg, L, un"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Validade Média (dias)
            </label>
            <input
              type="number"
              name="validade_media_dias"
              value={formData.validade_media_dias}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              placeholder="Ex: 30"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Origem
            </label>
            <input
              type="text"
              name="origem"
              value={formData.origem}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              placeholder="Ex: Importado, Nacional"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
};
