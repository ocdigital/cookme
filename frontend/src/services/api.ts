import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

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

  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) =>
    api.post('/auth/change-password', {
      senha_atual: oldPassword,
      nova_senha: newPassword,
      confirmacao_senha: confirmPassword,
    }),
};

// Services are organized in separate files for better maintainability:
// - usuariosService.ts (user management with /usuarios endpoints)
// - produtosService.ts (product management with /produtos endpoints)
// - recipesService.ts (recipe management with /receitas endpoints)
// - comprasService.ts (purchases with /compras endpoints)
// - inventarioService.ts (inventory with /inventario endpoints)
// - notificacoesService.ts (notifications with /notificacoes endpoints)
// - adminService.ts (admin dashboard with /admin endpoints)

// Export api instance for use in other services
export { api };

export default api;
