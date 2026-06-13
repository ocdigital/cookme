// User types
export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'USER' | 'PREMIUM' | 'ADMIN' | 'MARCA' | 'admin' | 'user';
  avatar_url?: string;
  alertas_habilitados?: boolean;
  deve_trocar_senha?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notificacoes_habilitadas: boolean;
  horario_notificacoes: string;
  tags_dieta: string[];
  restricoes_alimentares: string[];
  numero_pessoas: number;
}

// Product types
export interface Product {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  imagem_url: string;
  codigo_barras: string;
  estoque: number;
  createdAt: string;
  updatedAt: string;
}

// Recipe types
export interface Recipe {
  id: string;
  titulo: string;
  descricao: string;
  modo_preparo: string;
  tempo_preparo: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  ingredientes: Ingrediente[];
  imagem_url: string;
  categoria: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingrediente {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
}

// Purchase types
export interface Purchase {
  id: string;
  usuario_id: string;
  produtos: PurchaseProduct[];
  total: number;
  desconto?: number;
  status: 'pendente' | 'processando' | 'concluido' | 'cancelado';
  data_compra: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseProduct {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
}

// Auth types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<string>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// API Response types
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
