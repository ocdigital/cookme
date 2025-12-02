import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { User, Product, Recipe, Purchase, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          (originalRequest as any).headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, senha: password }),

  register: (nome: string, email: string, password: string) =>
    api.post('/auth/register', { nome, email, senha: password }),

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getProfile: () => api.get('/usuarios/me'),
};

// Users endpoints
export const usersService = {
  getAll: (page: number = 1, limit: number = 10) =>
    api.get<PaginatedResponse<User>>('/users', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),

  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
};

// Products endpoints
export const productsService = {
  getAll: (page: number = 1, limit: number = 10) =>
    api.get<PaginatedResponse<Product>>('/products', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Product>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),

  search: (query: string) =>
    api.get('/products/search', { params: { q: query } }),
};

// Recipes endpoints
export const recipesService = {
  getAll: (page: number = 1, limit: number = 10) =>
    api.get<PaginatedResponse<Recipe>>('/recipes', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<Recipe>(`/recipes/${id}`),

  create: (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Recipe>('/recipes', data),

  update: (id: string, data: Partial<Recipe>) =>
    api.patch<Recipe>(`/recipes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/recipes/${id}`),

  search: (query: string) =>
    api.get('/recipes/search', { params: { q: query } }),
};

// Purchases endpoints
export const purchasesService = {
  getAll: (page: number = 1, limit: number = 10) =>
    api.get<PaginatedResponse<Purchase>>('/purchases', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<Purchase>(`/purchases/${id}`),

  getByUser: (userId: string, page: number = 1, limit: number = 10) =>
    api.get(`/purchases/user/${userId}`, { params: { page, limit } }),

  getStats: () =>
    api.get('/purchases/stats'),
};

// Statistics endpoints
export const statsService = {
  getDashboard: () =>
    api.get('/stats/dashboard'),

  getUsers: () =>
    api.get('/stats/users'),

  getProducts: () =>
    api.get('/stats/products'),

  getPurchases: () =>
    api.get('/stats/purchases'),
};

export default api;
