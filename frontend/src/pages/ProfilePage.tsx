import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    avatar_url: user?.avatar_url || getDefaultAvatar(user?.email || ''),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      // TODO: Implement profile update API call
      // await userService.updateProfile(formData);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      avatar_url: user?.avatar_url || getDefaultAvatar(user?.email || ''),
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {/* Avatar Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={formData.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-primary/10 shadow-md"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{formData.nome}</h2>
              <p className="text-sm text-gray-500">{formData.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Role: <span className="font-medium">{user?.role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="+55 (11) 98765-4321"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Avatar
            </label>
            <input
              type="url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cole a URL de uma imagem ou deixe em branco para usar o avatar padrão
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Conta</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de Conta:</span>
              <span className="font-medium text-gray-900">
                {user?.role === 'ADMIN'
                  ? 'Administrador'
                  : user?.role === 'PREMIUM'
                    ? 'Premium'
                    : user?.role === 'MARCA'
                      ? 'Marca'
                      : 'Usuário'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Membro desde:</span>
              <span className="font-medium text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última atualização:</span>
              <span className="font-medium text-gray-900">
                {user?.updatedAt
                  ? new Date(user.updatedAt).toLocaleDateString('pt-BR')
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h3>
          <button className="w-full px-4 py-2 text-left text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Alterar Senha
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Clique para alterar sua senha de acesso
          </p>
        </div>
      </div>
    </div>
  );
};
