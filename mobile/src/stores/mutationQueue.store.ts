import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type QueuedMutation = {
  id: string;
  method: 'post' | 'patch' | 'put' | 'delete';
  url: string;
  data?: unknown;
  // Para update otimista: qual query key invalidar após sync
  invalidateKeys?: string[][];
  createdAt: number;
  retries: number;
};

type MutationQueueState = {
  queue: QueuedMutation[];
  isSyncing: boolean;
  enqueue: (mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retries'>) => void;
  dequeue: (id: string) => void;
  setIsSyncing: (v: boolean) => void;
  incrementRetry: (id: string) => void;
  clear: () => void;
};

export const useMutationQueueStore = create<MutationQueueState>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,

      enqueue: (mutation) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...mutation,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createdAt: Date.now(),
              retries: 0,
            },
          ],
        })),

      dequeue: (id) =>
        set((state) => ({ queue: state.queue.filter((m) => m.id !== id) })),

      setIsSyncing: (v) => set({ isSyncing: v }),

      incrementRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((m) =>
            m.id === id ? { ...m, retries: m.retries + 1 } : m,
          ),
        })),

      clear: () => set({ queue: [] }),
    }),
    {
      name: 'cookme-mutation-queue',
      storage: createJSONStorage(() => AsyncStorage),
      // Só persistir a fila, não o estado de syncing
      partialize: (state) => ({ queue: state.queue }),
    },
  ),
);
