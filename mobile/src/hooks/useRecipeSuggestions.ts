import { useState, useCallback } from 'react';
import recipesService, {
  SuggestionResult,
  ReceitaSugerida,
} from '../services/recipes.service';

interface UseRecipeSuggestionsState {
  receitas_sugeridas: ReceitaSugerida[];
  total_ingredientes_disponiveis: number;
  ingredientes_usados: string[];
  query_utilizada: string;
  receitas_encontradas: number;
  loading: boolean;
  erro: string | null;
}

interface UseRecipeSuggestions extends UseRecipeSuggestionsState {
  obterSugestoes: () => Promise<void>;
  limpar: () => void;
  ordenarPorMatch: () => void;
}

export function useRecipeSuggestions(): UseRecipeSuggestions {
  const [state, setState] = useState<UseRecipeSuggestionsState>({
    receitas_sugeridas: [],
    total_ingredientes_disponiveis: 0,
    ingredientes_usados: [],
    query_utilizada: '',
    receitas_encontradas: 0,
    loading: false,
    erro: null,
  });

  /**
   * Obtém sugestões de receitas baseado no inventário
   */
  const obterSugestoes = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null }));

      const resultado = await recipesService.obterSugestoes();

      setState((prev) => ({
        ...prev,
        receitas_sugeridas: resultado.receitas_sugeridas,
        total_ingredientes_disponiveis:
          resultado.total_ingredientes_disponiveis,
        ingredientes_usados: resultado.resumo.ingredientes_usados,
        query_utilizada: resultado.query_utilizada,
        receitas_encontradas: resultado.resumo.receitas_encontradas,
        loading: false,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error
          ? err.message
          : 'Erro ao buscar sugestões de receitas';
      setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Ordena receitas por número de ingredientes match (mais match = melhor)
   */
  const ordenarPorMatch = useCallback(() => {
    setState((prev) => {
      const ordenadas = [...prev.receitas_sugeridas].sort(
        (a, b) => b.ingredientes_match.length - a.ingredientes_match.length,
      );

      return {
        ...prev,
        receitas_sugeridas: ordenadas,
      };
    });
  }, []);

  /**
   * Limpa o estado
   */
  const limpar = useCallback(() => {
    setState({
      receitas_sugeridas: [],
      total_ingredientes_disponiveis: 0,
      ingredientes_usados: [],
      query_utilizada: '',
      receitas_encontradas: 0,
      loading: false,
      erro: null,
    });
  }, []);

  return {
    ...state,
    obterSugestoes,
    ordenarPorMatch,
    limpar,
  };
}
