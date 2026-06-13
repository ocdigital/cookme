import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, Lock, Check, Upload, Bell } from 'lucide-react';
import { usuariosService } from '../services';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    avatar_url: user?.avatar_url || getDefaultAvatar(user?.email || ''),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(formData.avatar_url);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.alertas_habilitados ?? true);

  function getDefaultAvatar(email: string): string {
    return `https://i.pravatar.cc/150?u=${email}`;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await usuariosService.updateMe({
        nome: formData.nome,
        telefone: formData.telefone,
        avatar_url: formData.avatar_url,
      });
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };


  const handlePasswordChangeSuccess = () => {
    setSuccessMessage('Senha alterada com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleNotifications = async () => {
    try {
      const newState = !notificationsEnabled;
      await usuariosService.updateMe({
        alertas_habilitados: newState,
      });
      setNotificationsEnabled(newState);
      setSuccessMessage(newState ? 'Notificações ativadas!' : 'Notificações desativadas!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
      alert('Erro ao atualizar preferência de notificações.');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido');
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo não pode ser maior que 5MB');
        return;
      }

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setAvatarPreview(base64String);
        setFormData((prev) => ({
          ...prev,
          avatar_url: base64String,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Meu Perfil</h1>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <Check size={13} className="flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Main Content Grid - Avatar + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Avatar Section - Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="text-center">
              <div className="relative mb-3 inline-block group">
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-primary/10 shadow-sm dark:border-primary/20 mx-auto object-cover"
                />
                <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={20} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{formData.nome}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-all mb-3">{formData.email}</p>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full">
                {user?.role || 'Usuário'}
              </span>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">Clique no avatar para alterar</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mt-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Informações</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user?.role === 'ADMIN'
                    ? 'Administrador'
                    : user?.role === 'PREMIUM'
                      ? 'Premium'
                      : user?.role === 'MARCA'
                        ? 'Marca'
                        : 'Usuário'}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Membro desde:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Atualizado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user?.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section - Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Informações Gerais</h3>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Name - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              {/* Email and Phone - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-500 cursor-not-allowed text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Não pode ser alterado</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="+55 (11) 98765-4321"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              {/* Avatar URL - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL do Avatar
                </label>
                <input
                  type="url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  Cole a URL de uma imagem ou deixe em branco para usar o avatar padrão
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <Save size={13} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mt-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Segurança</h3>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Lock size={14} />
              Alterar Senha
            </button>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mt-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Notificações</h3>
            <button
              onClick={handleToggleNotifications}
              className="w-full px-3 py-3 text-left text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Bell size={14} />
                Permitir Notificações
              </span>
              <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {notificationsEnabled
                ? 'Você receberá notificações sobre atualizações e eventos importantes'
                : 'Notificações desativadas. Ative para receber atualizações'}
            </p>
          </div>

          {/* Change Password Modal */}
          <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={() => setIsChangePasswordModalOpen(false)}
            onSuccess={handlePasswordChangeSuccess}
          />
        </div>
      </div>
    </div>
  );
};
