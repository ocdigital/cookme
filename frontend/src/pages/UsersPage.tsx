import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Users, AlertTriangle, Eye } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { UserFormModal } from '../components/UserFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ErrorAlert } from '../components/ErrorAlert';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
import { StatsBar } from '../components/StatsBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { userService } from '../services/userService';
import { mockUsers } from '../mocks/mockData';


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
  receitas_criadas?: number;
  nivel_atividade?: 'alta' | 'media' | 'baixa' | 'inativa';
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [atividadeFilter, setAtividadeFilter] = useState<'todos' | 'alta' | 'media' | 'baixa' | 'inativa'>('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
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

      // Use mock data instead of API
      const transformedUsers: User[] = mockUsers.map((user) => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
        status: user.status,
        dataCriacao: user.dataCriacao,
        role: user.role,
        email_verificado: user.email_verificado,
        alertas_habilitados: user.alertas_habilitados,
        avatar_url: user.avatar_url,
        ultimo_acesso: user.ultimo_acesso,
        receitas_criadas: user.receitas_criadas,
        nivel_atividade: user.nivel_atividade,
      }));

      setUsers(transformedUsers);
      setTotalPages(1); // Mock data has all on one page
      console.log('👥 Usuários carregados (mock):', transformedUsers.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar usuários',
      );
      console.error('❌ Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
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

  const handleViewDetails = (user: User) => {
    setUserDetails(user);
    setIsDetailsModalOpen(true);
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

  const getDiasDesdeAcesso = (ultimoAcesso: Date | null | undefined): number => {
    if (!ultimoAcesso) return Infinity;
    const agora = new Date();
    const diff = agora.getTime() - new Date(ultimoAcesso).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getBadgeAcesso = (dias: number) => {
    if (dias <= 7) return { label: 'Ativo', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' };
    if (dias <= 30) return { label: 'Moderado', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' };
    return { label: 'Inativo', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' };
  };

  const filteredUsers = users.filter(user => {
    const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
    const matchesAtividade = atividadeFilter === 'todos' || user.nivel_atividade === atividadeFilter;
    return matchesStatus && matchesAtividade;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    ativos: users.filter(u => u.status === 'ativo').length,
    inativos: users.filter(u => u.status === 'inativo').length,
    altaAtividade: users.filter(u => u.nivel_atividade === 'alta').length,
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Usuários</h1>
      </header>

      {/* Stats Bar */}
      <StatsBar
        items={[
          { icon: <Users className="w-5 h-5" />, label: 'Total', value: stats.total },
          { icon: <Users className="w-5 h-5" />, label: 'Ativos', value: stats.ativos },
          { icon: <Users className="w-5 h-5" />, label: 'Inativos', value: stats.inativos },
          { icon: <AlertTriangle className="w-5 h-5" />, label: 'Alta Atividade', value: stats.altaAtividade },
        ]}
      />

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
        <div className="flex gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <SearchInput
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')}
            options={[
              { value: 'todos', label: 'Status: Todos' },
              { value: 'ativo', label: 'Status: Ativos' },
              { value: 'inativo', label: 'Status: Inativos' },
            ]}
          />
          <FilterSelect
            value={atividadeFilter}
            onChange={(e) => setAtividadeFilter(e.target.value as any)}
            options={[
              { value: 'todos', label: 'Atividade: Todos' },
              { value: 'alta', label: 'Atividade: Alta' },
              { value: 'media', label: 'Atividade: Média' },
              { value: 'baixa', label: 'Atividade: Baixa' },
              { value: 'inativa', label: 'Atividade: Inativa' },
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Último Acesso</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Atividade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const diasDesdeAcesso = getDiasDesdeAcesso(user.ultimo_acesso);
                      const badgeAcesso = getBadgeAcesso(diasDesdeAcesso);
                      const temRisco = diasDesdeAcesso >= 30 && diasDesdeAcesso !== Infinity;

                      return (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          temRisco ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium flex items-center gap-2">
                          {temRisco && <AlertTriangle size={14} className="text-red-500" />}
                          {user.nome}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {user.funcao}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeAcesso.color}`}>
                            {diasDesdeAcesso === Infinity ? 'Nunca' : `${diasDesdeAcesso}d`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 capitalize">
                            {user.nivel_atividade || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <ActionButton
                              variant="view"
                              icon={<Eye size={16} />}
                              title="Detalhes"
                              onClick={() => handleViewDetails(user)}
                            />
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
                    );
                    })}
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

      {/* Details Modal */}
      <AnimatedModal
        isOpen={isDetailsModalOpen && userDetails !== null}
        onClose={() => setIsDetailsModalOpen(false)}
        title={userDetails?.nome || 'Detalhes do Usuário'}
        size="lg"
      >
        {userDetails && (
          <div className="space-y-4">
            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 break-all">{userDetails.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Função</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{userDetails.funcao}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nível de Atividade</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 capitalize">{userDetails.nivel_atividade}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Receitas Criadas</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{userDetails.receitas_criadas || 0}</p>
              </div>
            </div>

            {/* Activity Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Informações de Atividade</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-semibold ${userDetails.status === 'ativo' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {userDetails.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Último Acesso</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {userDetails.ultimo_acesso ? new Date(userDetails.ultimo_acesso).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Membro desde</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{userDetails.dataCriacao}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};
