import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from '../types';
import { authService } from '../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount (localStorage = persistent, sessionStorage = session-only)
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = true): Promise<string> => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      const { access_token, refresh_token, user } = response.data;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('accessToken', access_token);
      if (refresh_token) storage.setItem('refreshToken', refresh_token);

      // Clear the other storage to avoid conflicts
      if (rememberMe) {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }

      setUser(user as User);

      return user?.deve_trocar_senha ? '/trocar-senha' : '/dashboard';
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data.data);
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
