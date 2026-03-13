import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
import { authService } from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.oldPassword) {
      errors.oldPassword = 'Senha atual é obrigatória';
    }

    if (!formData.newPassword) {
      errors.newPassword = 'Nova senha é obrigatória';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Nova senha deve ter no mínimo 6 caracteres';
    } else if (formData.newPassword === formData.oldPassword) {
      errors.newPassword = 'Nova senha deve ser diferente da senha atual';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.confirmPassword !== formData.newPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Erro ao alterar senha. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setError(null);
    setValidationErrors({});
    onClose();
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Alterar Senha"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Old Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Senha Atual
          </label>
          <div className="relative">
            <input
              type={showPasswords.old ? 'text' : 'password'}
              value={formData.oldPassword}
              onChange={(e) =>
                setFormData({ ...formData, oldPassword: e.target.value })
              }
              className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              disabled={isLoading}
              placeholder="Digite sua senha atual"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('old')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPasswords.old ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {validationErrors.oldPassword && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.oldPassword}
            </p>
          )}
        </div>

        {/* New Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nova Senha
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              disabled={isLoading}
              placeholder="Digite sua nova senha"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {validationErrors.newPassword && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.newPassword}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mínimo de 6 caracteres
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              disabled={isLoading}
              placeholder="Confirme sua nova senha"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Action Buttons */}
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Alterando...
              </>
            ) : (
              <>
                <Lock size={16} />
                Alterar Senha
              </>
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
};
