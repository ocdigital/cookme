import axios from 'axios';
import storage from './storage';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag para evitar loop de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já está refreshing, enfileirar a requisição
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refresh_token');

        if (!refreshToken) {
          // Sem refresh token, fazer logout
          await storage.removeItem('access_token');
          await storage.removeItem('refresh_token');
          processQueue(new Error('Sem refresh token'), null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        await storage.setItem('access_token', access_token);
        if (refresh_token) {
          await storage.setItem('refresh_token', refresh_token);
        }

        // Retry requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        processQueue(null, access_token);
        isRefreshing = false;

        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        await storage.removeItem('access_token');
        await storage.removeItem('refresh_token');
        processQueue(refreshError, null);
        isRefreshing = false;

        console.error('Token refresh falhou:', refreshError.message);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth Services
export const authService = {
  async login(email, senha) {
    const response = await api.post('/auth/login', { email, senha });
    const { access_token, refresh_token, user } = response.data;

    await storage.setItem('access_token', access_token);
    await storage.setItem('refresh_token', refresh_token);

    return { user, access_token };
  },

  async register(email, senha, nome) {
    const response = await api.post('/auth/register', { email, senha, nome });
    const { access_token, refresh_token, user } = response.data;

    await storage.setItem('access_token', access_token);
    await storage.setItem('refresh_token', refresh_token);

    return { user, access_token };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      await storage.removeItem('access_token');
      await storage.removeItem('refresh_token');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async isAuthenticated() {
    const token = await storage.getItem('access_token');
    return !!token;
  },
};

// Scraper Services
export const scraperService = {
  async startConsulta(qrcodeTexto) {
    const response = await api.post('/scraper/consultas', { qrcodeTexto });
    return response.data;
  },

  async getStatus(sessionId) {
    const response = await api.get(`/scraper/consultas/${sessionId}`);
    return response.data;
  },

  async notifyCaptchaResolved(sessionId, cupomHtml = null) {
    const response = await api.post(`/scraper/consultas/${sessionId}/captcha-resolvido`, {
      cupomHtml
    });
    return response.data;
  },

  async cancelConsulta(sessionId) {
    await api.delete(`/scraper/consultas/${sessionId}`);
  },

  async getMinhasConsultas() {
    const response = await api.get('/scraper/minhas-consultas');
    return response.data;
  },

  async clearMinhasConsultas() {
    await api.delete('/scraper/minhas-consultas');
  },
};

// Inventario Services
export const inventarioService = {
  async getInventario() {
    const response = await api.get('/inventario');
    return response.data;
  },

  async getVencendo(days = 7) {
    const response = await api.get(`/inventario/vencendo?days=${days}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/inventario/stats');
    return response.data;
  },

  async adicionarProduto(produtoData) {
    const response = await api.post('/inventario', produtoData);
    return response.data;
  },

  async atualizarProduto(id, produtoData) {
    const response = await api.patch(`/inventario/${id}`, produtoData);
    return response.data;
  },

  async deletarProduto(id) {
    const response = await api.delete(`/inventario/${id}`);
    return response.data;
  },
};

// Compras Services
export const comprasService = {
  async getAll() {
    const response = await api.get('/compras');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/compras/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/compras/stats');
    return response.data;
  },

  async delete(id) {
    await api.delete(`/compras/${id}`);
  },
};

// Receitas Services
export const receitasService = {
  async getSugestoes() {
    const response = await api.get('/receitas/sugestoes');
    return response.data;
  },

  async getReceitas(filters = {}) {
    const response = await api.get('/receitas', { params: filters });
    return response.data;
  },

  async getReceitaById(id) {
    const response = await api.get(`/receitas/${id}`);
    return response.data;
  },

  async getFavoritas() {
    const response = await api.get('/receitas/favoritas');
    return response.data;
  },

  async executarReceita(receitaId, data) {
    const response = await api.post(`/receitas/${receitaId}/executar`, data);
    return response.data;
  },

  async marcarComoFavorita(receitaId) {
    const response = await api.post(`/receitas/${receitaId}/favorita`);
    return response.data;
  },

  async removerDeFavorita(receitaId) {
    const response = await api.delete(`/receitas/${receitaId}/favorita`);
    return response.data;
  },
};

// Categorias Services
export const categoriasService = {
  async getCategorias() {
    const response = await api.get('/produtos/categorias/all');
    return response.data;
  },

  async getCategoriaById(id) {
    const response = await api.get(`/produtos/categorias/${id}`);
    return response.data;
  },
};

// Produtos Services
export const produtosService = {
  async getProdutos(filters = {}) {
    const response = await api.get('/produtos', { params: filters });
    return response.data;
  },

  async getProdutoById(id) {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  },

  async getProdutosPorCategoria(categoriaId) {
    const response = await api.get(`/produtos?categoriaId=${categoriaId}`);
    return response.data;
  },

  async fetchProductImage(produtoId) {
    const response = await api.post(`/produtos/${produtoId}/fetch-image`);
    return response.data;
  },
};
