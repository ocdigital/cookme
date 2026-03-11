import api from './api';

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

type ListUsersResponse = {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type UserStats = {
  totalUsuarios: number;
  usuariosPorRole: Array<{
    role: string;
    total: number;
  }>;
  usuarioAtivos: number;
};

type CreateUserDto = {
  email: string;
  nome: string;
  senha: string;
  role?: string;
  avatar_url?: string;
};

type UpdateUserDto = {
  nome?: string;
  telefone?: string;
  avatar_url?: string;
  alertas_habilitados?: boolean;
  horario_alertas?: string;
};

export const userService = {
  listUsers: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      role?: string;
    },
  ): Promise<ListUsersResponse> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }

    const response = await api.get<ListUsersResponse>(
      `/admin/usuarios?${params.toString()}`,
    );
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/admin/usuarios/stats');
    return response.data;
  },

  createUser: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>('/admin/usuarios', data);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch<User>(`/admin/usuarios/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/usuarios/${id}`);
  },
};
