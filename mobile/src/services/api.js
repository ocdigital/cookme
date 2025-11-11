import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
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
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, tentar refresh
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          await SecureStore.setItemAsync('access_token', access_token);

          // Retry requisição original
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh falhou, fazer logout
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          // Aqui você poderia redirecionar para login
        }
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

    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);

    return { user, access_token };
  },

  async register(email, senha, nome) {
    const response = await api.post('/auth/register', { email, senha, nome });
    const { access_token, refresh_token, user } = response.data;

    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);

    return { user, access_token };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async isAuthenticated() {
    const token = await SecureStore.getItemAsync('access_token');
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

  async executarReceita(receitaId, data) {
    const response = await api.post(`/receitas/${receitaId}/executar`, data);
    return response.data;
  },
};
