import api from './api';

type DificuldadeReceita = 'facil' | 'media' | 'dificil';
type UnidadeMedida = 'kg' | 'g' | 'mg' | 'l' | 'ml' | 'un' | 'pct' | 'cx' | 'dente' | 'folha' | 'ramo';

interface ReceitaIngrediente {
  id?: string;
  produto_id: string;
  quantidade: number;
  unidade: UnidadeMedida;
  opcional?: boolean;
  observacao?: string;
  ordem?: number;
  produto?: {
    id: string;
    nome: string;
    codigo_barras?: string;
    marca?: {
      id: string;
      nome: string;
    };
  };
}

interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  modo_preparo: string;
  tempo_preparo: number;
  rendimento_porcoes: number;
  dificuldade: DificuldadeReceita;
  tags_dieta?: string[];
  tags_preparo?: string[];
  categoria_receita?: string;
  imagem_url?: string;
  origem: string;
  prompt_ia?: string;
  avaliacao_media: number;
  vezes_executada: number;
  ingredientes?: ReceitaIngrediente[];
  criado_em: Date;
  atualizado_em: Date;
}

interface CreateReceitaDto {
  nome: string;
  descricao?: string;
  modo_preparo: string;
  tempo_preparo: number;
  rendimento_porcoes: number;
  dificuldade: DificuldadeReceita;
  tags_dieta?: string[];
  tags_preparo?: string[];
  categoria_receita?: string;
  imagem_url?: string;
  origem?: string;
  ingredientes: Omit<ReceitaIngrediente, 'id' | 'produto'>[];
}

interface UpdateReceitaDto {
  nome?: string;
  descricao?: string;
  modo_preparo?: string;
  tempo_preparo?: number;
  rendimento_porcoes?: number;
  dificuldade?: DificuldadeReceita;
  tags_dieta?: string[];
  tags_preparo?: string[];
  categoria_receita?: string;
  imagem_url?: string;
  ingredientes?: Omit<ReceitaIngrediente, 'id' | 'produto'>[];
}

interface ReceitaFilters {
  search?: string;
  dificuldade?: DificuldadeReceita;
  categoria?: string;
  tags_dieta?: string | string[];
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: Receita[];
  total: number;
  page: number;
  totalPages: number;
}

export const recipesService = {
  /**
   * Lista todas as receitas com filtros
   */
  getAll: async (filters?: ReceitaFilters): Promise<PaginatedResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.dificuldade) params.append('dificuldade', filters.dificuldade);
    if (filters?.categoria) params.append('categoria', filters.categoria);
    if (filters?.tags_dieta) {
      if (Array.isArray(filters.tags_dieta)) {
        filters.tags_dieta.forEach(tag => params.append('tags_dieta', tag));
      } else {
        params.append('tags_dieta', filters.tags_dieta);
      }
    }
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse>(`/receitas?${params.toString()}`);
    return response.data;
  },

  /**
   * Busca uma receita por ID
   */
  getById: async (id: string): Promise<Receita> => {
    const response = await api.get<Receita>(`/receitas/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova receita
   */
  create: async (data: CreateReceitaDto): Promise<Receita> => {
    const response = await api.post<Receita>('/receitas', data);
    return response.data;
  },

  /**
   * Atualiza uma receita
   */
  update: async (id: string, data: UpdateReceitaDto): Promise<Receita> => {
    const response = await api.put<Receita>(`/receitas/${id}`, data);
    return response.data;
  },

  /**
   * Deleta uma receita
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/receitas/${id}`);
  },

  /**
   * Obter sugestões de receitas (MOI)
   */
  getSugestoes: async (): Promise<Receita[]> => {
    const response = await api.get<Receita[]>('/receitas/sugestoes');
    return response.data;
  },

  /**
   * Histórico de receitas executadas
   */
  getExecutadas: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/receitas/executadas');
    return response.data;
  },

  /**
   * Marcar receita como executada
   */
  executar: async (
    id: string,
    data: {
      porcoes_feitas: number;
      tempo_real_preparo?: number;
      avaliacao?: number;
      comentario?: string;
    }
  ): Promise<any> => {
    const response = await api.post<any>(`/receitas/${id}/executar`, data);
    return response.data;
  },

  /**
   * Gerar receita com IA
   */
  gerarComIA: async (ingredientes: string[]): Promise<any> => {
    const response = await api.post<any>('/receitas/gerar-com-ia', { ingredientes });
    return response.data;
  },

  /**
   * Gerar receita do inventário
   */
  gerarDoInventario: async (): Promise<any> => {
    const response = await api.post<any>('/receitas/gerar-do-inventario');
    return response.data;
  },

  /**
   * Gerar receitas da semana
   */
  gerarSemana: async (): Promise<any> => {
    const response = await api.post<any>('/receitas/gerar-semana');
    return response.data;
  },

  /**
   * Formatar dificuldade para exibição
   */
  formatDificuldade: (dificuldade: DificuldadeReceita): string => {
    const map: Record<DificuldadeReceita, string> = {
      facil: 'Fácil',
      media: 'Médio',
      dificil: 'Difícil',
    };
    return map[dificuldade] || dificuldade;
  },

  /**
   * Obter cor da dificuldade
   */
  getDificuldadeColor: (dificuldade: DificuldadeReceita): string => {
    const map: Record<DificuldadeReceita, string> = {
      facil: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      media: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
      dificil: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    };
    return map[dificuldade] || 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
  },

  /**
   * Formatar unidade de medida
   */
  formatUnidade: (unidade: UnidadeMedida): string => {
    const map: Record<UnidadeMedida, string> = {
      kg: 'kg',
      g: 'g',
      mg: 'mg',
      l: 'L',
      ml: 'ml',
      un: 'un',
      pct: 'pct',
      cx: 'cx',
      dente: 'dente(s)',
      folha: 'folha(s)',
      ramo: 'ramo(s)',
    };
    return map[unidade] || unidade;
  },
};

export type { Receita, ReceitaIngrediente, DificuldadeReceita, UnidadeMedida };
export default recipesService;
