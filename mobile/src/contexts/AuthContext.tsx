import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (nome: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap - check for existing token
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const response = await api.get('/usuarios/me');
        const userData = response.data.data || response.data.user || response.data;
        setUser(userData);
      }
    } catch (e) {
      console.error('Failed to restore token:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        senha: password,
      });

      const responseData = response.data as any;
      const accessToken = responseData.access_token || responseData.accessToken;
      const refreshToken = responseData.refresh_token || responseData.refreshToken;
      const userData = responseData.user;

      if (!accessToken || !userData) {
        throw new Error('Resposta inválida do servidor');
      }

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      setUser(userData);
      return userData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falha ao fazer login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (nome: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post<AuthResponse>('/auth/register', {
        nome,
        email,
        senha: password,
      });

      const responseData = response.data as any;
      const accessToken = responseData.access_token || responseData.accessToken;
      const refreshToken = responseData.refresh_token || responseData.refreshToken;
      const userData = responseData.user;

      if (!accessToken || !userData) {
        throw new Error('Resposta inválida do servidor');
      }

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      setUser(userData);
      return userData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falha ao criar conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isSignedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
