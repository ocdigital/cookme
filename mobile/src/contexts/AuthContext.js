import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se usuário está autenticado ao iniciar app
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          // Se getMe falhar, apenas remover autenticação silenciosamente
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Erros ao verificar autenticação não são críticos
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, senha) => {
    try {
      const { user: userData } = await authService.login(email, senha);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      console.error('Erro resposta:', error.response);
      console.error('Erro mensagem:', error.message);

      let errorMessage = 'Erro ao fazer login';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (email, senha, nome) => {
    try {
      const { user: userData } = await authService.register(email, senha, nome);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao criar conta',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export { AuthContext };
