import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Search, AlertCircle, Users, UserCheck, Briefcase } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { UserFormModal } from '../components/UserFormModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { StatsBar } from '../components/StatsBar';
import { userService } from '../services/userService';

type ApiUser = {
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

interface User {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  status: 'ativo' | 'inativo';
  dataCriacao: string;
  role?: string;
  email_verificado?: boolean;
  alertas_habilitados?: boolean;
  avatar_url?: string | null;
  ultimo_acesso?: Date | null;
  criado_em?: Date;
  atualizado_em?: Date;
}

type UserStats = {
  totalUsuarios: number;
  usuariosPorRole: Array<{
    role: string;
    total: number;
  }>;
  usuarioAtivos: number;
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.listUsers(page, 20, {
        search: searchTerm,
      });

      // Transform API users to UI users
      const transformedUsers: User[] = response.data.map((apiUser: ApiUser) => ({
        id: apiUser.id,
        nome: apiUser.nome,
        email: apiUser.email,
        funcao: getRoleLabel(apiUser.role),
        status: apiUser.ultimo_acesso ? 'ativo' : 'inativo',
        dataCriacao: new Date(apiUser.criado_em).toLocaleDateString('pt-BR'),
      }));

      setUsers(transformedUsers);
      setTotalPages(response.totalPages);
      console.log('👥 Usuários carregados:', {
        total: response.total,
        dataLength: response.data.length,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar usuários',
      );
      console.error('❌ Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userService.getUserStats();
      console.log('📊 Estatísticas de usuários:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: { [key: string]: string } = {
      admin: 'Administrador',
      premium: 'Premium',
      marca: 'Marca',
      user: 'Usuário',
    };
    return labels[role.toLowerCase()] || role;
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: { nome: string; email: string; role: string }) => {
    try {
      setFormLoading(true);
      setFormError(null);

      // TODO: Implement create/update user API call when backend endpoints are available
      console.log('Form submitted:', data);

      // Mock success - in production this would call the backend
      setTimeout(() => {
        setIsFormModalOpen(false);
        loadUsers();
        loadStats();
      }, 500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar usuário');
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setDeleteLoading(true);

      // TODO: Implement delete user API call when backend endpoint is available
      console.log('Deletando usuário:', selectedUser.id);

      // Mock success - in production this would call the backend
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        loadUsers();
        loadStats();
      }, 500);
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const filteredUsers = users.filter(user => {
    const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
    return matchesStatus;
  });

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Usuários</h1>
      </header>

      {/* Stats Bar */}
      {stats && (
        <StatsBar
          items={[
            { icon: <Users className="w-5 h-5" />, label: 'Total de Usuários', value: stats.totalUsuarios },
            { icon: <UserCheck className="w-5 h-5" />, label: 'Usuários Ativos', value: stats.usuarioAtivos },
            { icon: <Briefcase className="w-5 h-5" />, label: 'Funções', value: stats.usuariosPorRole.length },
          ]}
        />
      )}

      {/* Table */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Lista de Usuários</CardTitle>
          <button
            onClick={handleCreateUser}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <UserPlus size={16} />
            Novo Usuário
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        {/* Table Content */}
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold">Erro</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Função</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Criação</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 font-medium">{user.nome}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {user.funcao}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                              user.status === 'ativo'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ativo'
                                  ? 'bg-green-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {user.dataCriacao}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormModalOpen}
        isLoading={formLoading}
        error={formError}
        user={selectedUser as any}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedUser(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isLoading={deleteLoading}
        title="Deletar Usuário"
        message={`Tem certeza que deseja deletar o usuário ${selectedUser?.nome}? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};
