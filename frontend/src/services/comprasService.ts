import api from './api';

export interface CompraItem {
  id?: string;
  produto_id: string;
  produto?: {
    id: string;
    nome: string;
    marca?: { nome: string };
  };
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  preco_total?: number;
}

export interface Compra {
  id: string;
  usuario_id: string;
  data_compra: string;
  local_compra?: string;
  preco_total: number;
  itens?: CompraItem[];
  criado_em: Date;
  atualizado_em: Date;
}

export interface CreateCompraDto {
  data_compra?: string;
  local_compra?: string;
  itens: CompraItem[];
  preco_total?: number;
}

export interface ComprasStats {
  totalCompras: number;
  valorTotal: number;
  mediaTicket: number;
  comprasMes: number;
  gastosPorCategoria?: Array<{ categoria: string; valor: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const comprasService = {
  /**
   * Lista todas as compras do usuário
   */
  getAll: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Compra>> => {
    const response = await api.get<PaginatedResponse<Compra>>('/compras', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Busca uma compra por ID
   */
  getById: async (id: string): Promise<Compra> => {
    const response = await api.get<Compra>(`/compras/${id}`);
    return response.data;
  },

  /**
   * Obtém estatísticas de compras
   */
  getStats: async (): Promise<ComprasStats> => {
    const response = await api.get<ComprasStats>('/compras/stats');
    return response.data;
  },

  /**
   * Cria uma nova compra
   */
  create: async (data: CreateCompraDto): Promise<Compra> => {
    const response = await api.post<Compra>('/compras', data);
    return response.data;
  },

  /**
   * Remove uma compra
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/compras/${id}`);
  },
};

export default comprasService;
