import api from './api';

export interface InventarioItem {
  id: string;
  usuario_id: string;
  produto_id: string;
  produto?: {
    id: string;
    nome: string;
    marca?: { nome: string };
    categoria?: { nome: string };
  };
  quantidade: number;
  unidade: string;
  data_validade: string;
  local_armazenagem?: string;
  criado_em: Date;
  atualizado_em: Date;
}

export interface CreateInventarioDto {
  produto_id: string;
  quantidade: number;
  unidade: string;
  data_validade: string;
  local_armazenagem?: string;
}

export interface UpdateInventarioDto {
  quantidade?: number;
  unidade?: string;
  data_validade?: string;
  local_armazenagem?: string;
}

export interface InventarioStats {
  totalItens: number;
  totalPorCategoria: Array<{ categoria: string; total: number }>;
  valorEstimado?: number;
  proximoVencimento?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const inventarioService = {
  /**
   * Lista todos os itens do inventário
   */
  getAll: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<InventarioItem>> => {
    const response = await api.get<PaginatedResponse<InventarioItem>>(
      '/inventario',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  /**
   * Busca um item do inventário por ID
   */
  getById: async (id: string): Promise<InventarioItem> => {
    const response = await api.get<InventarioItem>(`/inventario/${id}`);
    return response.data;
  },

  /**
   * Obtém estatísticas do inventário
   */
  getStats: async (): Promise<InventarioStats> => {
    const response = await api.get<InventarioStats>('/inventario/stats');
    return response.data;
  },

  /**
   * Busca itens que estão vencendo em breve
   */
  getVencendo: async (dias: number = 7): Promise<InventarioItem[]> => {
    const response = await api.get<InventarioItem[]>('/inventario/vencendo', {
      params: { dias },
    });
    return response.data;
  },

  /**
   * Busca itens já vencidos
   */
  getVencidos: async (): Promise<InventarioItem[]> => {
    const response = await api.get<InventarioItem[]>('/inventario/vencidos');
    return response.data;
  },

  /**
   * Adiciona um item ao inventário
   */
  create: async (data: CreateInventarioDto): Promise<InventarioItem> => {
    const response = await api.post<InventarioItem>('/inventario', data);
    return response.data;
  },

  /**
   * Atualiza um item do inventário
   */
  update: async (
    id: string,
    data: UpdateInventarioDto
  ): Promise<InventarioItem> => {
    const response = await api.patch<InventarioItem>(`/inventario/${id}`, data);
    return response.data;
  },

  /**
   * Remove um item do inventário
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventario/${id}`);
  },
};

export default inventarioService;
