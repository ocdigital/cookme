import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { UserFormModal } from '../components/UserFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ErrorAlert } from '../components/ErrorAlert';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
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

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
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
    setUserToEdit(null);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToEdit(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: { nome: string; email: string; role: string; senha?: string }) => {
    try {
      setEditLoading(true);
      setEditError(null);

      if (userToEdit?.id) {
        // Update existing user
        await userService.updateUser(userToEdit.id, {
          nome: data.nome,
        });
      } else {
        // Create new user
        if (!data.senha) {
          throw new Error('Senha é obrigatória para novo usuário');
        }
        await userService.createUser({
          email: data.email,
          nome: data.nome,
          senha: data.senha,
          role: data.role || 'USER',
        });
      }

      setIsEditModalOpen(false);
      loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao salvar usuário');
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToEdit) return;

    try {
      setDeleteLoading(true);
      await userService.deleteUser(userToEdit.id);
      setIsDeleteModalOpen(false);
      setUserToEdit(null);
      loadUsers();
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

      {/* Stats Bar - TODO: Implement meaningful stats for users */}
      {/* {stats && (
        <StatsBar
          items={[
            { icon: <Users className="w-5 h-5" />, label: 'Total de Usuários', value: stats.totalUsuarios },
            { icon: <UserCheck className="w-5 h-5" />, label: 'Usuários Ativos', value: stats.usuarioAtivos },
            { icon: <Briefcase className="w-5 h-5" />, label: 'Funções', value: stats.usuariosPorRole.length },
          ]}
        />
      )} */}

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
        <div className="flex gap-4 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <SearchInput
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'ativo', label: 'Ativos' },
              { value: 'inativo', label: 'Inativos' },
            ]}
          />
        </div>

        {/* Table Content */}
        <CardContent>
          <ErrorAlert error={error} />

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
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Função</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Data Criação</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{user.nome}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {user.funcao}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                              user.status === 'ativo'
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ativo'
                                  ? 'bg-green-500'
                                  : 'bg-gray-400 dark:bg-gray-500'
                              }`}
                            />
                            {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                          {user.dataCriacao}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="edit"
                              icon={<Edit2 size={16} />}
                              title="Editar"
                              onClick={() => handleEditUser(user)}
                            />
                            <ActionButton
                              variant="delete"
                              icon={<Trash2 size={16} />}
                              title="Deletar"
                              onClick={() => handleDeleteUser(user)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
              />
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
        isOpen={isEditModalOpen}
        isLoading={editLoading}
        error={editError}
        user={userToEdit as any}
        onClose={() => {
          setIsEditModalOpen(false);
          setUserToEdit(null);
          setEditError(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Deletar Usuário?"
        description={`Tem certeza que deseja deletar o usuário ${userToEdit?.nome}? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setUserToEdit(null);
        }}
      />
    </div>
  );
};
