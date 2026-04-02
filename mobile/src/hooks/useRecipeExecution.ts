import { useState, useCallback } from 'react';
import recipesService from '../services/recipes.service';
import inventarioService from '../services/inventario.service';

interface IngredienteNecessario {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  quantidade_disponivel: number;
}

interface UseRecipeExecutionState {
  execucao_id: string | null;
  receita_id: string | null;
  ingredientes_necessarios: IngredienteNecessario[];
  ingredientes_consumidos: Map<string, number>;
  status: 'idle' | 'iniciando' | 'em_andamento' | 'finalizando' | 'concluido';
  loading: boolean;
  erro: string | null;
  progresso: number; // percentual
}

interface UseRecipeExecution extends UseRecipeExecutionState {
  iniciarExecucao: (receitaId: string) => Promise<void>;
  consumirIngrediente: (ingredienteId: string, quantidade: number) => Promise<void>;
  finalizarExecucao: () => Promise<void>;
  reset: () => void;
}

export function useRecipeExecution(): UseRecipeExecution {
  const [state, setState] = useState<UseRecipeExecutionState>({
    execucao_id: null,
    receita_id: null,
    ingredientes_necessarios: [],
    ingredientes_consumidos: new Map(),
    status: 'idle',
    loading: false,
    erro: null,
    progresso: 0,
  });

  /**
   * Inicia execução de uma receita
   */
  const iniciarExecucao = useCallback(async (receitaId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null, status: 'iniciando' }));

      const resultado = await recipesService.iniciarExecucao(receitaId);

      setState((prev) => ({
        ...prev,
        execucao_id: resultado.execucao_id,
        receita_id: resultado.receita_id,
        ingredientes_necessarios: resultado.ingredientes_necessarios,
        ingredientes_consumidos: new Map(),
        status: 'em_andamento',
        loading: false,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error ? err.message : 'Erro ao iniciar execução';
      setState((prev) => ({
        ...prev,
        erro: mensagemErro,
        loading: false,
        status: 'idle',
      }));
      throw err;
    }
  }, []);

  /**
   * Consome um ingrediente da receita
   */
  const consumirIngrediente = useCallback(
    async (ingredienteId: string, quantidade: number) => {
      try {
        setState((prev) => ({ ...prev, loading: true, erro: null }));

        // Consumir do inventário
        await inventarioService.consumirProduto(ingredienteId, quantidade);

        // Atualizar lista de consumidos
        setState((prev) => {
          const novosMapa = new Map(prev.ingredientes_consumidos);
          const atual = novosMapa.get(ingredienteId) || 0;
          novosMapa.set(ingredienteId, atual + quantidade);

          // Calcular progresso
          const consumidos = novosMapa.size;
          const total = prev.ingredientes_necessarios.length;
          const progresso = total > 0 ? (consumidos / total) * 100 : 0;

          return {
            ...prev,
            ingredientes_consumidos: novosMapa,
            progresso: Math.round(progresso),
            loading: false,
          };
        });
      } catch (err) {
        const mensagemErro =
          err instanceof Error ? err.message : 'Erro ao consumir ingrediente';
        setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
        throw err;
      }
    },
    [],
  );

  /**
   * Finaliza execução da receita
   */
  const finalizarExecucao = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null, status: 'finalizando' }));

      if (!state.execucao_id || !state.receita_id) {
        throw new Error('Execução não foi iniciada');
      }

      await recipesService.finalizarExecucao(state.receita_id, state.execucao_id);

      setState((prev) => ({
        ...prev,
        status: 'concluido',
        loading: false,
        progresso: 100,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error ? err.message : 'Erro ao finalizar execução';
      setState((prev) => ({
        ...prev,
        erro: mensagemErro,
        loading: false,
        status: 'em_andamento',
      }));
      throw err;
    }
  }, [state.execucao_id, state.receita_id]);

  /**
   * Reseta o estado
   */
  const reset = useCallback(() => {
    setState({
      execucao_id: null,
      receita_id: null,
      ingredientes_necessarios: [],
      ingredientes_consumidos: new Map(),
      status: 'idle',
      loading: false,
      erro: null,
      progresso: 0,
    });
  }, []);

  return {
    ...state,
    iniciarExecucao,
    consumirIngrediente,
    finalizarExecucao,
    reset,
  };
}
