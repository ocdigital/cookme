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
      origem?: string;
      verificado?: string;
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
    if (filters?.origem) {
      params.append('origem', filters.origem);
    }
    if (filters?.verificado !== undefined && filters.verificado !== '') {
      params.append('verificado', filters.verificado);
    }
    if ((filters as any)?.ingredienteFilter) {
      params.append('ingredienteFilter', (filters as any).ingredienteFilter);
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

  listCategorias: async (): Promise<{ id: string; nome: string }[]> => {
    const response = await api.get<{ id: string; nome: string }[]>('/admin/produtos/categorias');
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/admin/produtos/${id}`);
  },

  updateProdutoClassificacao: async (id: string, ingrediente_receita: boolean): Promise<void> => {
    await api.patch(`/admin/produtos/${id}/classificacao`, { ingrediente_receita });
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

  atualizarReceita: async (id: string, data: Partial<{ imagem_url: string }>) => {
    const response = await api.patch(`/admin/receitas/${id}`, data);
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

  listAuditLogs: async (
    page: number = 1,
    limit: number = 30,
    filters?: {
      user_email?: string;
      user_id?: string;
      resource_type?: string;
      method?: string;
      from_date?: string;
      to_date?: string;
      status_class?: '2xx' | '4xx' | '5xx';
    },
  ) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters?.user_email) params.append('user_email', filters.user_email);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.resource_type) params.append('resource_type', filters.resource_type);
    if (filters?.method) params.append('method', filters.method);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    if (filters?.status_class) params.append('status_class', filters.status_class);

    const response = await api.get(`/admin/audit-logs?${params.toString()}`);
    return response.data;
  },

  getAuditStats: async () => {
    const response = await api.get('/admin/audit-logs/stats');
    return response.data;
  },

  getDataCounts: async (): Promise<Record<string, number>> => {
    const response = await api.get('/admin/data/counts');
    return response.data;
  },

  limparDados: async (entidade: string): Promise<{ deletados: number }> => {
    const response = await api.delete(`/admin/data/${entidade}`);
    return response.data;
  },

  seedReceitas: async (opts: { tema?: string; receitasPorTema?: number } = {}): Promise<{
    salvas: number;
    puladas: number;
    erros: number;
    total: number;
  }> => {
    const response = await api.post('/admin/receitas/seed', opts);
    return response.data;
  },

  importarReceitaUrl: async (url: string): Promise<{ ok: boolean; receita?: any; erro?: string }> => {
    const response = await api.post('/admin/receitas/importar-url', { url });
    return response.data;
  },

  crawlearReceitas: async (ingredientes?: string[]): Promise<{
    ok: boolean;
    ingredientes: string[];
    totalSalvas: number;
  }> => {
    const response = await api.post('/admin/receitas/crawlear', ingredientes?.length ? { ingredientes } : {});
    return response.data;
  },

  listKnowledgeBase: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      tipo?: 'all' | 'ingrediente' | 'nao_ingrediente' | 'sem_classificacao';
    },
  ) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo);
    const response = await api.get(`/admin/knowledge-base?${params.toString()}`);
    return response.data;
  },

  createKnowledgeBaseEntry: async (data: {
    product_name: string;
    canonical_ingredient?: string;
    ingrediente_receita?: boolean;
  }) => {
    const response = await api.post('/admin/knowledge-base', data);
    return response.data;
  },

  updateKnowledgeBaseEntry: async (
    id: string,
    data: {
      canonical_ingredient?: string;
      ingrediente_receita?: boolean;
      is_active?: boolean;
    },
  ) => {
    const response = await api.patch(`/admin/knowledge-base/${id}`, data);
    return response.data;
  },

  deleteKnowledgeBaseEntry: async (id: string): Promise<void> => {
    await api.delete(`/admin/knowledge-base/${id}`);
  },

  // ===== Abreviações =====
  listAbbreviations: async (
    page: number = 1,
    limit: number = 50,
    filters?: {
      search?: string;
      tipo?: 'all' | 'ingrediente' | 'nao_ingrediente';
    },
  ) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo);
    const response = await api.get(`/admin/abbreviations?${params.toString()}`);
    return response.data;
  },

  createAbbreviation: async (data: {
    abbr: string;
    expanded: string;
    is_ingredient: boolean;
    categoria?: string;
  }) => {
    const response = await api.post('/admin/abbreviations', data);
    return response.data;
  },

  updateAbbreviation: async (
    id: string,
    data: Partial<{ abbr: string; expanded: string; is_ingredient: boolean; categoria: string; is_active: boolean }>,
  ) => {
    const response = await api.patch(`/admin/abbreviations/${id}`, data);
    return response.data;
  },

  deleteAbbreviation: async (id: string): Promise<void> => {
    await api.delete(`/admin/abbreviations/${id}`);
  },

  reloadAbbreviationsCache: async (): Promise<void> => {
    await api.post('/admin/abbreviations/reload-cache');
  },

  gerarReceitasIA: async (modo?: string): Promise<{ iniciado: boolean; total_temas: number; mensagem: string }> => {
    const response = await api.post('/admin/receitas/gerar-ia', modo ? { modo } : {});
    return response.data;
  },
};
