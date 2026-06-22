import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { maybeCompleteAuthSession } from 'expo-web-browser';
import api, { apiEvents } from '../services/api';
import { queryClient } from '../lib/queryClient';
import { User, AuthResponse } from '../types';

maybeCompleteAuthSession();

// IDs do Google OAuth — preencher no Google Cloud Console
// https://console.cloud.google.com → APIs & Services → Credentials
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (nome: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  isGoogleAvailable: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  isSignedIn: boolean;
  isNewUser: boolean;
  isAppleAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Expo Go: proxy fixo — registrar no Google Cloud Console como redirect autorizado
  // Build nativo: usa scheme cookme://
  const isExpoGo = Constants.appOwnership === 'expo';
  const redirectUri = isExpoGo
    ? 'https://auth.expo.io/@eduocdigital/cookme-mobile'
    : AuthSession.makeRedirectUri({ scheme: 'cookme' });

  const googleAvailable = Platform.OS === 'android'
    ? !!(GOOGLE_ANDROID_CLIENT_ID ?? GOOGLE_WEB_CLIENT_ID)
    : Platform.OS === 'ios'
    ? !!(GOOGLE_IOS_CLIENT_ID ?? GOOGLE_WEB_CLIENT_ID)
    : !!GOOGLE_WEB_CLIENT_ID;

  const [_googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID ?? GOOGLE_WEB_CLIENT_ID ?? 'placeholder',
    iosClientId: GOOGLE_IOS_CLIENT_ID ?? GOOGLE_WEB_CLIENT_ID ?? 'placeholder',
    webClientId: GOOGLE_WEB_CLIENT_ID ?? 'placeholder',
    redirectUri,
    responseType: 'id_token',
    usePKCE: false,
  });

  useEffect(() => {
    bootstrapAsync();
    AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable).catch(() => {});

    const handleSessionExpired = () => {
      setUser(null);
      queryClient.clear();
    };
    apiEvents.on('session-expired', handleSessionExpired);
    return () => apiEvents.off('session-expired', handleSessionExpired);
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const params = googleResponse.params as any;
      const auth = googleResponse.authentication as any;
      const idToken = params?.id_token || auth?.id_token || auth?.idToken;
      if (idToken) handleSocialAuthResponse(() => api.post('/auth/google-login', { idToken }));
    }
  }, [googleResponse]);

  const handleSocialAuthResponse = async (apiFn: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFn();
      const { access_token, refresh_token, user: userData } = response.data;
      if (!access_token || !userData) throw new Error('Resposta inválida do servidor');
      await SecureStore.setItemAsync('accessToken', access_token);
      if (refresh_token) await SecureStore.setItemAsync('refreshToken', refresh_token);
      setUser(userData);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Falha no login social';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapAsync = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        try {
          const response = await api.get('/usuarios/me');
          const userData = response.data.data || response.data.user || response.data;
          setUser(userData);
        } catch (err: any) {
          const status = err.response?.status;
          // Token inválido/expirado ou servidor inacessível — limpar sessão
          if (status === 401 || status === 403 || !err.response) {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            setUser(null);
          }
          console.error('Failed to restore token:', err);
        }
      }
    } catch (e) {
      console.error('Failed to restore token:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
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

      // Limpar cache do usuário anterior antes de logar
      queryClient.clear();
      await AsyncStorage.removeItem('cookme-query-cache-v2');

      await SecureStore.setItemAsync('accessToken', accessToken);
      if (rememberMe && refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      } else {
        await SecureStore.deleteItemAsync('refreshToken');
      }

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
      await AsyncStorage.setItem('isNewUser', '1');

      setIsNewUser(true);
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

  const loginWithGoogle = useCallback(async () => {
    const result = await promptGoogleAsync();
    if (result.type === 'cancel' || result.type === 'dismiss') return;
    if (result.type === 'error') throw new Error('Erro ao abrir login Google');
    // Response handled by useEffect above
  }, [promptGoogleAsync]);

  const loginWithApple = useCallback(async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean).join(' ') || undefined;
    await handleSocialAuthResponse(() =>
      api.post('/auth/apple-login', {
        identityToken: credential.identityToken,
        fullName,
      })
    );
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }, []);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      // Limpar cache do TanStack Query + AsyncStorage para não vazar dados entre usuários
      queryClient.clear();
      await AsyncStorage.removeItem('cookme-query-cache-v2');
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
    loginWithGoogle,
    loginWithApple,
    logout,
    updateUser,
    isSignedIn: !!user,
    isNewUser,
    isAppleAvailable,
    isGoogleAvailable: googleAvailable,
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
