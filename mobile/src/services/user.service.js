import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import * as SecureStore from 'expo-secure-store';

// ============================================
// User Service - Gerencia chamadas de API para perfil e preferências
// ============================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const userService = {
  // ============================================
  // PROFILE ENDPOINTS
  // ============================================

  /**
   * Obter perfil do usuário atual
   * GET /usuarios/me
   */
  async getProfile() {
    try {
      const response = await api.get('/usuarios/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  },

  /**
   * Atualizar perfil do usuário
   * PATCH /usuarios/me
   * @param {Object} profileData - { nome, telefone, avatar_url }
   */
  async updateProfile(profileData) {
    try {
      const response = await api.patch('/usuarios/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  /**
   * Deletar conta do usuário
   * DELETE /usuarios/me
   */
  async deleteAccount() {
    try {
      const response = await api.delete('/usuarios/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      throw error;
    }
  },

  /**
   * Alterar senha do usuário
   * PATCH /usuarios/me/password
   * @param {Object} passwordData - { senhaAtual, senhaNova }
   */
  async changePassword(passwordData) {
    try {
      const response = await api.patch('/usuarios/me/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  },

  // ============================================
  // PREFERENCES ENDPOINTS
  // ============================================

  /**
   * Obter preferências do usuário
   * GET /usuarios/me/preferencias
   */
  async getPreferences() {
    try {
      const response = await api.get('/usuarios/me/preferencias');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter preferências:', error);
      throw error;
    }
  },

  /**
   * Atualizar preferências do usuário
   * PATCH /usuarios/me/preferencias
   * @param {Object} preferences - preferências a atualizar
   */
  async updatePreferences(preferences) {
    try {
      const response = await api.patch('/usuarios/me/preferencias', preferences);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Limpar cache local de preferências
   */
  async clearLocalPreferences() {
    try {
      await SecureStore.deleteItemAsync('userPreferences');
      return true;
    } catch (error) {
      console.error('Erro ao limpar preferências:', error);
      return false;
    }
  },

  /**
   * Obter dados do usuário completos (perfil + preferências)
   */
  async getUserData() {
    try {
      const profile = await this.getProfile();
      const preferences = await this.getPreferences();
      return {
        profile,
        preferences,
      };
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  },
};

export { userService };
