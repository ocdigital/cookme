// User Types
export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'user' | 'moderador' | 'admin';
  avatar_url?: string | null;
  ultimo_acesso?: string | null;
  criado_em: string;
}

// Product Types
export interface Categoria {
  id: string;
  nome: string;
  icone?: string;
}

export interface Marca {
  id: string;
  nome: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string | null;
  codigo_barras?: string | null;
  categoria?: Categoria | null;
  marca?: Marca | null;
  unidade_padrao: string;
  validade_media_dias?: number | null;
  origem: string;
  verificado: boolean;
  criado_em: string;
  atualizado_em: string;
  imagem_url?: string | null;
  informacoes_nutricionais?: {
    calorias?: number;
    proteinas?: number;
    carboidratos?: number;
    gorduras?: number;
  };
}

// Recipe Types
export interface ReceitaIngrediente {
  id: string;
  receita_id: string;
  produto_id: string;
  produto: Produto;
  quantidade: number;
  unidade: string;
}

export interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  modo_preparo: string;
  tempo_preparo?: number;
  rendimento_porcoes: number;
  dificuldade: 'facil' | 'media' | 'dificil';
  categoria_receita?: string;
  imagem_url?: string;
  tags_dieta?: string[];
  tags_preparo?: string[];
  ingredientes?: ReceitaIngrediente[];
  avaliacao_media?: number;
  vezes_executada?: number;
  denuncias?: number;
  status_moderacao?: 'ok' | 'em_revisao' | 'arquivado';
  criado_em: string;
}

// Purchase Types
export interface ItemCompra {
  id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  economia?: number;
}

export interface Compra {
  id: string;
  usuario_id: string;
  data: string;
  local: string;
  total: number;
  cupom?: string;
  economia?: number;
  itens: ItemCompra[];
  criado_em: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Notification Types
export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  corpo: Record<string, any>;
  lida: boolean;
  criada_em: string;
  atualizada_em: string;
}
