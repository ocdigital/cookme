import { useState, useCallback } from 'react';
import planejamentoService, { PlanejamentoItem, SemanaResponse } from '@/services/planejamento.service';

interface State {
  items: PlanejamentoItem[];
  loading: boolean;
  erro: string | null;
}

export function usePlanejamento() {
  const [state, setState] = useState<State>({ items: [], loading: false, erro: null });

  const carregarSemana = useCallback(async (semana: number) => {
    setState(s => ({ ...s, loading: true, erro: null }));
    try {
      const data = await planejamentoService.listarSemana(semana);
      setState({ items: data.items, loading: false, erro: null });
      return data.items;
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Erro ao carregar planejamento';
      setState({ items: [], loading: false, erro: msg });
      throw e;
    }
  }, []);

  const definirReceita = useCallback(async (
    semana: number,
    dia: number,
    tipo: 'almoco' | 'jantar',
    receitaId: string | null,
  ) => {
    const item = await planejamentoService.definirReceita(semana, dia, tipo, receitaId);
    setState(s => {
      const idx = s.items.findIndex(i => i.dia_semana === dia && i.tipo_refeicao === tipo);
      const novos = [...s.items];
      if (idx >= 0) novos[idx] = item;
      else novos.push(item);
      return { ...s, items: novos };
    });
    return item;
  }, []);

  const gerarAleatoria = useCallback(async (semana: number, apenasRegional = false) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const data = await planejamentoService.gerarAleatoria(semana, apenasRegional);
      setState({ items: data.items, loading: false, erro: null });
      return data.items;
    } catch (e: any) {
      setState(s => ({ ...s, loading: false }));
      throw e;
    }
  }, []);

  const marcarFeita = useCallback(async (id: string, avaliacao?: number) => {
    const updated = await planejamentoService.marcarFeita(id, avaliacao);
    setState(s => ({
      ...s,
      items: s.items.map(i => (i.id === id ? updated : i)),
    }));
    return updated;
  }, []);

  const limparDia = useCallback(async (semana: number, dia: number, tipo?: 'almoco' | 'jantar') => {
    await planejamentoService.limparDia(semana, dia, tipo);
    setState(s => ({
      ...s,
      items: s.items.filter(i => {
        if (i.dia_semana !== dia) return true;
        if (tipo && i.tipo_refeicao !== tipo) return true;
        return false;
      }),
    }));
  }, []);

  return {
    ...state,
    carregarSemana,
    definirReceita,
    gerarAleatoria,
    marcarFeita,
    limparDia,
  };
}
