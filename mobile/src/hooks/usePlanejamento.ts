import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import planejamentoService, { PlanejamentoItem } from '@/services/planejamento.service';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryClient';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import { useMutationQueueStore } from '@/stores/mutationQueue.store';

export function usePlanejamento(semana: number) {
  const queryClient = useQueryClient();
  const key = queryKeys.planejamentoSemana(semana);
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable;
  const { enqueue } = useMutationQueueStore();

  const { data, isFetching: loading, error } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const data = await planejamentoService.listarSemana(semana);
      return data.items;
    },
    staleTime: STALE_TIMES.planejamento,
    gcTime: GC_TIMES.planejamento,
    enabled: semana >= 1 && semana <= 4,
  });

  const items: PlanejamentoItem[] = data ?? [];
  const erro: string | null = error ? (error as any).response?.data?.message || (error as any).message || 'Erro' : null;

  const carregarSemana = useCallback((n: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.planejamentoSemana(n) });
  }, [queryClient]);

  const definirReceita = useCallback(async (
    sem: number,
    dia: number,
    tipo: 'almoco' | 'jantar',
    receitaId: string | null,
  ) => {
    const item = await planejamentoService.definirReceita(sem, dia, tipo, receitaId);
    queryClient.setQueryData<PlanejamentoItem[]>(queryKeys.planejamentoSemana(sem), (prev = []) => {
      const idx = prev.findIndex(i => i.dia_semana === dia && i.tipo_refeicao === tipo);
      const novos = [...prev];
      if (idx >= 0) novos[idx] = item;
      else novos.push(item);
      return novos;
    });
    return item;
  }, [queryClient]);

  const gerarAleatoria = useCallback(async (sem: number, apenasRegional = false) => {
    const data = await planejamentoService.gerarAleatoria(sem, apenasRegional);
    queryClient.setQueryData<PlanejamentoItem[]>(queryKeys.planejamentoSemana(sem), data.items);
    return data.items;
  }, [queryClient]);

  const marcarFeita = useCallback(async (id: string, avaliacao?: number) => {
    if (!isOnline) {
      // Offline: aplicar update otimista e enfileirar para sync
      queryClient.setQueryData<PlanejamentoItem[]>(key, (prev = []) =>
        prev.map(i => (i.id === id ? { ...i, feita: true } : i)),
      );
      enqueue({
        method: 'post',
        url: `/planejamento/${id}/feita`,
        data: avaliacao !== undefined ? { avaliacao } : {},
        invalidateKeys: [Array.from(key).map(String)],
      });
      // Retornar item otimista — sem acesso ao item real offline
      const prev = queryClient.getQueryData<PlanejamentoItem[]>(key) ?? [];
      return prev.find(i => i.id === id) ?? ({ id, feita: true } as unknown as PlanejamentoItem);
    }
    const updated = await planejamentoService.marcarFeita(id, avaliacao);
    queryClient.setQueryData<PlanejamentoItem[]>(key, (prev = []) =>
      prev.map(i => (i.id === id ? updated : i)),
    );
    return updated;
  }, [queryClient, key, isOnline, enqueue]);

  const limparDia = useCallback(async (sem: number, dia: number, tipo?: 'almoco' | 'jantar') => {
    await planejamentoService.limparDia(sem, dia, tipo);
    queryClient.setQueryData<PlanejamentoItem[]>(queryKeys.planejamentoSemana(sem), (prev = []) =>
      prev.filter(i => {
        if (i.dia_semana !== dia) return true;
        if (tipo && i.tipo_refeicao !== tipo) return true;
        return false;
      }),
    );
  }, [queryClient]);

  return {
    items,
    loading,
    erro,
    carregarSemana,
    definirReceita,
    gerarAleatoria,
    marcarFeita,
    limparDia,
  };
}
