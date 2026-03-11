import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
      });
    }
    setValidationErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
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
      setFormData({ nome: '', email: '', role: 'user' });
      setValidationErrors({});
    } catch (err) {
      // Error is handled by the parent component
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditing = !!user;
  const title = isEditing ? 'Editar Usuário' : 'Novo Usuário';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal Panel */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-lg">
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Nome Field */}
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
                placeholder="Digite o nome do usuário"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {validationErrors.nome && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.nome}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Digite o email do usuário"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Role Combobox */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm"
                disabled={isLoading}
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
              {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
