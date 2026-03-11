import api from './api';

export interface Marca {
  id: string;
  nome: string;
}

export interface Categoria {
  id: string;
  nome: string;
  icone?: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  categoria?: Categoria;
  marca?: Marca;
  unidade_padrao: string;
  validade_media_dias?: number;
  origem: string;
  verificado: boolean;
  imagem_url?: string;
  informacoes_nutricionais?: {
    calorias?: number;
    proteinas?: number;
    carboidratos?: number;
    gorduras?: number;
    fibra?: number;
    sodio?: number;
  };
  criado_em: Date;
  atualizado_em: Date;
}

export interface CreateProdutoDto {
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  categoria_id?: string;
  marca_id?: string;
  unidade_padrao: string;
  validade_media_dias?: number;
  origem?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProdutoStats {
  totalProdutos: number;
  produtosPorCategoria: Array<{ categoria: string; total: number }>;
  produtosPorMarca: Array<{ marca: string; total: number }>;
}

export const produtosService = {
  /**
   * Lista todos os produtos com paginação e filtros
   */
  getAll: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      categoriaId?: string;
      marcaId?: string;
    }
  ): Promise<PaginatedResponse<Produto>> => {
    const response = await api.get<PaginatedResponse<Produto>>('/produtos', {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  /**
   * Busca um produto por ID
   */
  getById: async (id: string): Promise<Produto> => {
    const response = await api.get<Produto>(`/produtos/${id}`);
    return response.data;
  },

  /**
   * Busca um produto por código de barras
   */
  getByBarcode: async (codigo: string): Promise<Produto | null> => {
    try {
      const response = await api.get<Produto>(
        `/produtos/barcode/${codigo}`
      );
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Busca produtos com autocomplete/typeahead
   */
  search: async (query: string): Promise<Produto[]> => {
    const response = await api.get<Produto[]>('/produtos/search', {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Cria um novo produto (admin)
   */
  create: async (data: CreateProdutoDto): Promise<Produto> => {
    const response = await api.post<Produto>('/produtos', data);
    return response.data;
  },

  /**
   * Atualiza um produto (admin)
   */
  update: async (
    id: string,
    data: Partial<CreateProdutoDto>
  ): Promise<Produto> => {
    const response = await api.patch<Produto>(`/produtos/${id}`, data);
    return response.data;
  },

  /**
   * Remove um produto (admin)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/produtos/${id}`);
  },

  // ===== MARCAS =====

  /**
   * Lista todas as marcas
   */
  getMarcas: async (): Promise<Marca[]> => {
    const response = await api.get<Marca[]>('/produtos/marcas/all');
    return response.data;
  },

  /**
   * Busca uma marca por ID
   */
  getMarcaById: async (id: string): Promise<Marca> => {
    const response = await api.get<Marca>(`/produtos/marcas/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova marca (admin)
   */
  createMarca: async (nome: string): Promise<Marca> => {
    const response = await api.post<Marca>('/produtos/marcas', { nome });
    return response.data;
  },

  // ===== CATEGORIAS =====

  /**
   * Lista todas as categorias
   */
  getCategorias: async (): Promise<Categoria[]> => {
    const response = await api.get<Categoria[]>('/produtos/categorias/all');
    return response.data;
  },

  /**
   * Busca uma categoria por ID
   */
  getCategoriaById: async (id: string): Promise<Categoria> => {
    const response = await api.get<Categoria>(`/produtos/categorias/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova categoria (admin)
   */
  createCategoria: async (
    nome: string,
    icone?: string
  ): Promise<Categoria> => {
    const response = await api.post<Categoria>('/produtos/categorias', {
      nome,
      icone,
    });
    return response.data;
  },

  // ===== STATS =====

  /**
   * Obtém estatísticas de produtos (admin only)
   */
  getStats: async (): Promise<ProdutoStats> => {
    const response = await api.get<ProdutoStats>('/admin/produtos/stats');
    return response.data;
  },
};

export default produtosService;
