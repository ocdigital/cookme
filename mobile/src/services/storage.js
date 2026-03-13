// Storage seguro para Expo Go (celular)
import * as SecureStore from 'expo-secure-store';

// Usar apenas SecureStore para mobile seguro
const storage = {
  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Erro ao obter item ${key}:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`Erro ao salvar item ${key}:`, error);
    }
  },

  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`Erro ao remover item ${key}:`, error);
    }
  },
};

export default storage;
