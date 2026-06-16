import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// TTLs em ms — alinhados com docs/OFFLINE_PLAN.md
export const STALE_TIMES = {
  receita_individual: 1000 * 60 * 60 * 24,   // 24h
  receitas_lista:     1000 * 60 * 10,          // 10min
  inventario:         1000 * 60 * 5,           // 5min
  planejamento:       1000 * 60 * 15,          // 15min
  listas:             1000 * 60 * 5,           // 5min
  favoritas:          1000 * 60 * 30,          // 30min
  perfil:             1000 * 60 * 60,          // 1h
  notificacoes:       1000 * 60 * 1,           // 1min
  historico:          1000 * 60 * 60,          // 1h
} as const;

export const GC_TIMES = {
  receita_individual: 1000 * 60 * 60 * 24 * 7, // 7 dias
  receitas_lista:     1000 * 60 * 60,            // 1h
  inventario:         1000 * 60 * 60 * 2,        // 2h
  planejamento:       1000 * 60 * 60 * 24,       // 24h
  listas:             1000 * 60 * 60 * 24,       // 24h
  favoritas:          1000 * 60 * 60 * 24 * 7,   // 7 dias
  perfil:             1000 * 60 * 60 * 24 * 7,   // 7 dias
  notificacoes:       1000 * 60 * 5,             // 5min
  historico:          1000 * 60 * 60 * 24 * 7,   // 7 dias
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.receitas_lista,
      gcTime: GC_TIMES.receitas_lista,
      retry: (failureCount, error: any) => {
        // Não retry em erros 4xx (auth, not found)
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 2;
      },
      // Exibir dados do cache mesmo offline — nunca tela em branco
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
    },
  },
});

// AsyncStorage como persister (compatível com Expo Go)
// Migrar para MMKV em produção quando sair do Expo Go
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const persister = createSyncStoragePersister({
  storage: asyncStorageAdapter as any,
  key: 'cookme-query-cache',
  throttleTime: 1000,
});
