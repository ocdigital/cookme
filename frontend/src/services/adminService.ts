import api from './api';

export interface Product {
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
}

export interface ListProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductStats {
  totalProdutos: number;
  produtosPorCategoria: Array<{
    categoria: string;
    total: number;
  }>;
  produtosPorMarca: Array<{
    marca: string;
    total: number;
  }>;
}

export const adminService = {
  /**
   * Lista produtos com filtros e paginação
   */
  async listProducts(
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      categoriaId?: string;
      marcaId?: string;
      sort?: string;
      order?: 'ASC' | 'DESC';
    },
  ): Promise<ListProductsResponse> {
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

  /**
   * Obter estatísticas de produtos
   */
  async getProductStats(): Promise<ProductStats> {
    const response = await api.get<ProductStats>('/admin/produtos/stats');
    return response.data;
  },
};
