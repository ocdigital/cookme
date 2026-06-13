import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use fixed IP for celular real na mesma rede WiFi
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.86.9:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 segundos para chamadas que usam IA (Gemini pode demorar)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    console.log(`🔵 [API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 [API] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    console.log(`🔴 [API] Error:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken, // Backend espera refresh_token
          });

          // Backend retorna AuthResponseDto diretamente
          const newAccessToken = response.data.access_token || response.data.accessToken;
          const newRefreshToken = response.data.refresh_token || response.data.refreshToken;
          if (newAccessToken) {
            await SecureStore.setItemAsync('accessToken', newAccessToken);
            if (newRefreshToken) {
              await SecureStore.setItemAsync('refreshToken', newRefreshToken);
            }

            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            (originalRequest as any).headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');

        // Return rejection to trigger login screen
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
