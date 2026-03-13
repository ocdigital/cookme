import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';

type User = {
  id: string;
  email: string;
  nome: string;
  role: string;
  email_verificado: boolean;
  alertas_habilitados: boolean;
  avatar_url: string | null;
  ultimo_acesso: Date | null;
  criado_em: Date;
  atualizado_em: Date;
};

type UserFormData = {
  nome: string;
  email: string;
  role: string;
  senha?: string;
};

type UserFormModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  user?: User | null;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
};

const AVAILABLE_ROLES = [
  { value: 'user', label: 'Usuário' },
  { value: 'premium', label: 'Premium' },
  { value: 'marca', label: 'Marca' },
  { value: 'admin', label: 'Administrador' },
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  isLoading,
  error,
  user,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    nome: '',
    email: '',
    role: 'user',
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        role: user.role,
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        role: 'user',
        senha: '',
      });
    }
    setValidationErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const isEditing = !!user;

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!isEditing && !formData.senha?.trim()) {
      errors.senha = 'Senha é obrigatória';
    } else if (formData.senha && formData.senha.length < 6) {
      errors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!formData.role) {
      errors.role = 'Função é obrigatória';
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
      setFormData({ nome: '', email: '', role: 'user', senha: '' });
      setValidationErrors({});
    } catch (err) {
      // Error is handled by the parent component
    }
  };

  const isEditing = !!user;
  const title = isEditing ? `Editar Usuário: ${user?.nome || ''}` : 'Novo Usuário';

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
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
            placeholder="Digite o nome do usuário"
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
          {validationErrors.nome && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.nome}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email {isEditing ? '(não editável)' : '*'}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Digite o email do usuário"
            disabled={isLoading || isEditing}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-600 dark:disabled:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
          {validationErrors.email && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Senha (apenas para novo usuário) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha *
            </label>
            <input
              type="password"
              value={formData.senha || ''}
              onChange={(e) =>
                setFormData({ ...formData, senha: e.target.value })
              }
              placeholder="Digite uma senha"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            />
            {validationErrors.senha && (
              <p className="text-red-600 text-xs mt-1">
                {validationErrors.senha}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mínimo 6 caracteres
            </p>
          </div>
        )}

        {/* Função */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Função *
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          >
            {AVAILABLE_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {validationErrors.role && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.role}
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
              isEditing ? 'Salvar Alterações' : 'Criar Usuário'
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
};
