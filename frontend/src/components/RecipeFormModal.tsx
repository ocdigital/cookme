import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Receita } from '../services/recipesService';

type RecipeFormData = {
  nome: string;
  descricao: string;
  dificuldade: 'facil' | 'media' | 'dificil';
  tempo_preparo: number;
  rendimento_porcoes: number;
  modo_preparo: string;
  ingredientes: Array<{
    produto_id: string;
    quantidade: number;
    unidade: 'kg' | 'g' | 'mg' | 'l' | 'ml' | 'un' | 'pct' | 'cx' | 'dente' | 'folha' | 'ramo';
  }>;
};

type RecipeFormModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  recipe?: Receita | null;
  onClose: () => void;
  onSubmit: (data: RecipeFormData) => Promise<void>;
};

const DIFFICULTY_OPTIONS = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  isLoading,
  error,
  recipe,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    nome: '',
    descricao: '',
    dificuldade: 'media',
    tempo_preparo: 30,
    rendimento_porcoes: 4,
    modo_preparo: '',
    ingredientes: [],
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [newIngredient, setNewIngredient] = useState('');

  useEffect(() => {
    if (recipe) {
      setFormData({
        nome: recipe.nome,
        descricao: recipe.descricao || '',
        dificuldade: recipe.dificuldade,
        tempo_preparo: recipe.tempo_preparo || 30,
        rendimento_porcoes: recipe.rendimento_porcoes || 4,
        modo_preparo: recipe.modo_preparo || '',
        ingredientes: recipe.ingredientes?.map(i => ({
          produto_id: i.produto_id || i.produto?.id || '',
          quantidade: i.quantidade,
          unidade: i.unidade,
        })) || [],
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        dificuldade: 'media',
        tempo_preparo: 30,
        rendimento_porcoes: 4,
        modo_preparo: '',
        ingredientes: [],
      });
    }
    setValidationErrors({});
    setNewIngredient('');
  }, [recipe, isOpen]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.descricao.trim()) {
      errors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.modo_preparo.trim()) {
      errors.modo_preparo = 'Modo de preparo é obrigatório';
    }

    if (formData.tempo_preparo < 1) {
      errors.tempo_preparo = 'Tempo deve ser maior que 0';
    }

    if (formData.rendimento_porcoes < 1) {
      errors.rendimento_porcoes = 'Número de porções deve ser maior que 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      // Placeholder - ideally would link to actual products
      setFormData({
        ...formData,
        ingredientes: [
          ...formData.ingredientes,
          {
            produto_id: `temp_${Date.now()}`,
            quantidade: 1,
            unidade: 'un' as const,
          },
        ],
      });
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredientes: formData.ingredientes.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        nome: '',
        descricao: '',
        dificuldade: 'media',
        tempo_preparo: 30,
        rendimento_porcoes: 4,
        modo_preparo: '',
        ingredientes: [],
      });
      setValidationErrors({});
    } catch (err) {
      // Error is handled by the parent component
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditing = !!recipe;
  const title = isEditing ? 'Editar Receita' : 'Nova Receita';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal Panel */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Digite o nome da receita"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {validationErrors.nome && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.nome}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Digite a descrição da receita"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {validationErrors.descricao && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.descricao}
                </p>
              )}
            </div>

            {/* Dificuldade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dificuldade
              </label>
              <select
                value={formData.dificuldade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dificuldade: e.target.value as 'facil' | 'media' | 'dificil',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Modo de Preparo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modo de Preparo
              </label>
              <textarea
                value={formData.modo_preparo}
                onChange={(e) =>
                  setFormData({ ...formData, modo_preparo: e.target.value })
                }
                placeholder="Descreva o passo a passo para preparar a receita"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {validationErrors.modo_preparo && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.modo_preparo}
                </p>
              )}
            </div>

            {/* Tempo de Preparo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo de Preparo (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.tempo_preparo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tempo_preparo: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                {validationErrors.tempo_preparo && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.tempo_preparo}
                  </p>
                )}
              </div>

              {/* Porções */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rendimento (porções)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.rendimento_porcoes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rendimento_porcoes: parseInt(e.target.value) || 4,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                {validationErrors.rendimento_porcoes && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.rendimento_porcoes}
                  </p>
                )}
              </div>
            </div>

            {/* Ingredientes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredientes (opcional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                  placeholder="Digite um ingrediente"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  disabled={isLoading}
                >
                  +
                </button>
              </div>

              {formData.ingredientes.length > 0 && (
                <div className="space-y-1">
                  {formData.ingredientes.map((_ing, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="text-gray-700">
                        {idx + 1}. Ingrediente
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                        disabled={isLoading}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isEditing ? 'Salvar Alterações' : 'Criar Receita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
