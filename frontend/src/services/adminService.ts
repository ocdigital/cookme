import api from './api';

type ListProductsResponse = {
  data: Array<{
    id: string;
    nome: string;
    descricao: string | null;
    codigo_barras: string | null;
    categoria: {
      id: string;
      nome: string;
      icone?: string;
    } | null;
    marca: {
      id: string;
      nome: string;
    } | null;
    unidade_padrao: string;
    validade_media_dias: number | null;
    origem: string;
    verificado: boolean;
    criado_em: Date;
    atualizado_em: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ProductStats = {
  totalProdutos: number;
  produtosPorCategoria: Array<{
    categoria: string;
    total: number;
  }>;
  produtosPorMarca: Array<{
    marca: string;
    total: number;
  }>;
};

export const adminService = {
  listProducts: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      categoriaId?: string;
      marcaId?: string;
      sort?: string;
      order?: 'ASC' | 'DESC';
    },
  ): Promise<ListProductsResponse> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.categoriaId) {
      params.append('categoriaId', filters.categoriaId);
    }
    if (filters?.marcaId) {
      params.append('marcaId', filters.marcaId);
    }
    if (filters?.sort) {
      params.append('sort', filters.sort);
    }
    if (filters?.order) {
      params.append('order', filters.order);
    }

    const response = await api.get<ListProductsResponse>(
      `/admin/produtos?${params.toString()}`,
    );
    return response.data;
  },

  getProductStats: async (): Promise<ProductStats> => {
    const response = await api.get<ProductStats>('/admin/produtos/stats');
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/admin/produtos/${id}`);
  },

  updateProduct: async (
    id: string,
    data: {
      nome?: string;
      descricao?: string | null;
      codigo_barras?: string | null;
      unidade_padrao?: string;
      validade_media_dias?: number | null;
      origem?: string;
    },
  ): Promise<void> => {
    await api.patch(`/produtos/${id}`, data);
  },

  listRecipes: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      dificuldade?: string;
      categoria?: string;
    },
  ) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.dificuldade) {
      params.append('dificuldade', filters.dificuldade);
    }
    if (filters?.categoria) {
      params.append('categoria', filters.categoria);
    }

    const response = await api.get(`/admin/receitas?${params.toString()}`);
    return response.data;
  },

  atualizarModeracaoReceita: async (
    id: string,
    status: 'ok' | 'em_revisao' | 'arquivado',
  ) => {
    const response = await api.patch(`/admin/receitas/${id}/moderacao`, {
      status,
    });
    return response.data;
  },

  listUsers: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      role?: string;
    },
  ) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }

    const response = await api.get(`/admin/usuarios?${params.toString()}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
};
