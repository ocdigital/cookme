import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import api from '@/services/api';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { useMutationQueueStore, QueuedMutation } from '@/stores/mutationQueue.store';

type OfflineMutationOptions<TData, TVariables> = {
  method: QueuedMutation['method'];
  url: string | ((variables: TVariables) => string);
  // Quais queries invalidar após sucesso (online) ou sync (offline)
  invalidateKeys?: string[][];
  // Update otimista: atualiza o cache localmente antes da resposta do servidor
  optimisticUpdate?: (variables: TVariables) => void;
  // Rollback se falhar online
  onRollback?: (variables: TVariables) => void;
} & Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;

/**
 * Hook de mutation com suporte offline.
 * - Online: executa imediatamente com update otimista
 * - Offline: aplica update otimista + enfileira para sync quando reconectar
 */
export function useOfflineMutation<TData = unknown, TVariables = void>(
  options: OfflineMutationOptions<TData, TVariables>,
) {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable;
  const { enqueue } = useMutationQueueStore();
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, Error, TVariables>({
    ...options,
    mutationFn: async (variables) => {
      const resolvedUrl = typeof options.url === 'function' ? options.url(variables) : options.url;

      if (!isOnline) {
        // Offline: enfileirar e simular sucesso
        enqueue({
          method: options.method,
          url: resolvedUrl,
          data: variables as unknown,
          invalidateKeys: options.invalidateKeys,
        });
        // Aplicar update otimista no cache
        options.optimisticUpdate?.(variables);
        // Retornar null como sucesso simulado
        return null as unknown as TData;
      }

      // Online: executar imediatamente
      const response = options.method === 'delete'
        ? await api.delete(resolvedUrl)
        : await api[options.method](resolvedUrl, variables as any);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options.invalidateKeys && isOnline) {
        options.invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      }
      (options as any).onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onRollback?.(variables);
      (options as any).onError?.(error, variables, context);
    },
  });

  return mutation;
}

/**
 * Hook que processa a fila de mutações quando reconectar.
 * Colocar uma única vez no root do app (em _layout.tsx).
 */
export function useMutationQueueSync() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable;
  const { queue, dequeue, incrementRetry, setIsSyncing } = useMutationQueueStore();
  const queryClient = useQueryClient();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!isOnline || queue.length === 0 || isProcessing.current) return;

    const processQueue = async () => {
      isProcessing.current = true;
      setIsSyncing(true);

      for (const mutation of [...queue]) {
        // Descartar mutações com muitas tentativas (evitar loop eterno)
        if (mutation.retries >= 5) {
          dequeue(mutation.id);
          continue;
        }

        try {
          if (mutation.method === 'delete') {
            await api.delete(mutation.url);
          } else {
            await api[mutation.method](mutation.url, mutation.data as any);
          }
          dequeue(mutation.id);

          // Invalidar queries para refetch
          if (mutation.invalidateKeys) {
            mutation.invalidateKeys.forEach((key) =>
              queryClient.invalidateQueries({ queryKey: key }),
            );
          }
        } catch (error: any) {
          // 404 = recurso foi deletado — skip silencioso
          if (error?.response?.status === 404) {
            dequeue(mutation.id);
            continue;
          }
          // 4xx = erro permanente (ex: validação) — skip
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            dequeue(mutation.id);
            continue;
          }
          // Erro de rede ou 5xx — incrementar retry para tentar depois
          incrementRetry(mutation.id);
        }
      }

      setIsSyncing(false);
      isProcessing.current = false;
    };

    processQueue();
  }, [isOnline, queue.length]);
}
