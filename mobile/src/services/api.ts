import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';

// Mini event emitter sem dependência Node
type PaywallPayload = { feature?: string; descricao?: string };
type EventMap = { paywall: PaywallPayload; 'session-expired': void };
const listenerMap: { [K in keyof EventMap]?: Array<(p: any) => void> } = {};
export const apiEvents = {
  on: <K extends keyof EventMap>(event: K, fn: (p: EventMap[K]) => void) => {
    if (!listenerMap[event]) listenerMap[event] = [];
    listenerMap[event]!.push(fn);
  },
  off: <K extends keyof EventMap>(event: K, fn: (p: EventMap[K]) => void) => {
    const arr = listenerMap[event]; if (!arr) return;
    const i = arr.indexOf(fn); if (i !== -1) arr.splice(i, 1);
  },
  emit: <K extends keyof EventMap>(event: K, p?: EventMap[K]) => {
    listenerMap[event]?.forEach(fn => fn(p));
  },
};

// Use fixed IP for celular real na mesma rede WiFi
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.86.9:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 segundos para chamadas que usam IA (Gemini pode demorar)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Single-flight do refresh: quando várias requisições recebem 401 ao mesmo tempo
// (ex: detalhe da receita + minha-avaliacao + comentarios + favoritado disparados
// juntos), apenas UMA renova o token. As demais aguardam o mesmo resultado.
// Sem isso, o backend rotaciona o refresh_token na 1ª renovação e as concorrentes
// falham com 401 → sessão cai indevidamente ("Não foi possível carregar a receita").
let refreshPromise: Promise<string | null> | null = null;

async function renovarAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const newAccessToken = response.data.access_token || response.data.accessToken;
    const newRefreshToken = response.data.refresh_token || response.data.refreshToken;
    if (!newAccessToken) return null;
    await SecureStore.setItemAsync('accessToken', newAccessToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);
    }
    api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    return newAccessToken;
  } catch {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    return null;
  }
}

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

    Sentry.withScope((scope) => {
      scope.setTag('api.url', error.config?.url || 'unknown');
      scope.setTag('api.method', error.config?.method || 'unknown');
      scope.setExtra('status', error.response?.status);
      scope.setExtra('response', error.response?.data);
      scope.setExtra('baseURL', error.config?.baseURL);
      if (!error.response) {
        // Network error — sem resposta do servidor
        scope.setTag('error.type', 'network');
      }
      Sentry.captureException(error);
    });
    // 403 com upgrade:true → emite evento para mostrar paywall
    if (error.response?.status === 403) {
      const data = error.response.data as any;
      if (data?.upgrade) {
        apiEvents.emit('paywall', {
          feature: data.message || 'Recurso Premium',
          descricao: data.planoAtual ? `Seu plano atual é ${data.planoAtual}. Faça upgrade para continuar.` : undefined,
        });
        return Promise.reject(error);
      }
    }

    const originalRequest = error.config as any;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Reaproveita um refresh já em andamento (single-flight) — evita a corrida
      // que invalidava o refresh_token para as requisições concorrentes.
      if (!refreshPromise) {
        refreshPromise = renovarAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }

      apiEvents.emit('session-expired');
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    return Promise.reject(error);
  }
);

export default api;
