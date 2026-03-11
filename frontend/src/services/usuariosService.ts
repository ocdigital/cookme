import api from './api';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  role: 'USER' | 'ADMIN' | 'PREMIUM' | 'MARCA';
  avatar_url?: string;
  email_verificado: boolean;
  alertas_habilitados: boolean;
  horario_alertas?: string;
  ultimo_acesso?: Date;
  criado_em: Date;
  atualizado_em: Date;
}

export interface Preferencia {
  usuario_id: string;
  tags_dieta: string[];
  tags_preparo: string[];
  ingredientes_evitar: string[];
  restricoes: string[];
  numero_pessoas: number;
}

export interface UpdateUsuarioDto {
  nome?: string;
  telefone?: string;
  avatar_url?: string;
  alertas_habilitados?: boolean;
  horario_alertas?: string;
}

export interface UpdatePreferenciaDto {
  tags_dieta?: string[];
  tags_preparo?: string[];
  ingredientes_evitar?: string[];
  restricoes?: string[];
  numero_pessoas?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsuariosStats {
  totalUsuarios: number;
  usuarioAtivos: number;
  usuariosPorRole: Array<{ role: string; total: number }>;
}

export const usuariosService = {
  /**
   * Obtém o perfil do usuário autenticado
   */
  getMe: async (): Promise<Usuario> => {
    const response = await api.get<Usuario>('/usuarios/me');
    return response.data;
  },

  /**
   * Atualiza o perfil do usuário autenticado
   */
  updateMe: async (data: UpdateUsuarioDto): Promise<Usuario> => {
    const response = await api.patch<Usuario>('/usuarios/me', data);
    return response.data;
  },

  /**
   * Atualiza o avatar do usuário
   */
  updateAvatar: async (avatar_url: string): Promise<Usuario> => {
    const response = await api.post<Usuario>('/usuarios/me/avatar', {
      avatar_url,
    });
    return response.data;
  },

  /**
   * Deleta a conta do usuário
   */
  deleteMe: async (): Promise<void> => {
    await api.delete('/usuarios/me');
  },

  /**
   * Obtém as preferências do usuário autenticado
   */
  getPreferencias: async (): Promise<Preferencia> => {
    const response = await api.get<Preferencia>('/usuarios/preferencias');
    return response.data;
  },

  /**
   * Atualiza as preferências do usuário autenticado
   */
  updatePreferencias: async (
    data: UpdatePreferenciaDto
  ): Promise<Preferencia> => {
    const response = await api.patch<Preferencia>(
      '/usuarios/preferencias',
      data
    );
    return response.data;
  },

  // ===== ADMIN ENDPOINTS =====

  /**
   * Lista todos os usuários (admin only)
   */
  getAll: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      role?: string;
      email_verificado?: boolean;
    }
  ): Promise<PaginatedResponse<Usuario>> => {
    const response = await api.get<PaginatedResponse<Usuario>>('/admin/usuarios', {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  /**
   * Obtém estatísticas de usuários (admin only)
   */
  getStats: async (): Promise<UsuariosStats> => {
    const response = await api.get<UsuariosStats>('/admin/usuarios/stats');
    return response.data;
  },
};

export default usuariosService;
