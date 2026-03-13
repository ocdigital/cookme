import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // Error is handled by the parent component
    }
  };

  const isEditing = !!recipe;
  const title = isEditing ? `Editar Receita: ${recipe?.nome || ''}` : 'Nova Receita';

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) =>
              setFormData({ ...formData, nome: e.target.value })
            }
            placeholder="Digite o nome da receita"
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
          {validationErrors.nome && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.nome}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição *
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            placeholder="Digite a descrição da receita"
            rows={2}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm resize-none"
          />
          {validationErrors.descricao && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.descricao}
            </p>
          )}
        </div>

        {/* Dificuldade e Tempo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tempo de Preparo (min)
            </label>
            <input
              type="number"
              value={formData.tempo_preparo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tempo_preparo: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Ex: 30"
              disabled={isLoading}
              min="0"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Rendimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rendimento (porções)
          </label>
          <input
            type="number"
            value={formData.rendimento_porcoes}
            onChange={(e) =>
              setFormData({
                ...formData,
                rendimento_porcoes: parseInt(e.target.value) || 0,
              })
            }
            placeholder="Ex: 4"
            disabled={isLoading}
            min="1"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
        </div>

        {/* Modo de Preparo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Modo de Preparo *
          </label>
          <textarea
            value={formData.modo_preparo}
            onChange={(e) =>
              setFormData({ ...formData, modo_preparo: e.target.value })
            }
            placeholder="Descreva o passo a passo para preparar a receita"
            rows={3}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm resize-none"
          />
          {validationErrors.modo_preparo && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.modo_preparo}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
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
              isEditing ? 'Salvar Alterações' : 'Criar Receita'
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
};
