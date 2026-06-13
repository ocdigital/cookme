import { useState, useCallback } from 'react';
import recipeGeneratorService, { Receita } from '@/services/recipe-generator.service';

interface UseRecipeGeneratorState {
  receitas: Receita[];
  loading: boolean;
  erro: string | null;
}

export function useRecipeGenerator() {
  const [state, setState] = useState<UseRecipeGeneratorState>({
    receitas: [],
    loading: false,
    erro: null,
  });

  const gerarReceitas = useCallback(async (ingredientes: string[], forcarIA = false) => {
    setState({ receitas: [], loading: true, erro: null });

    try {
      const receitas = await recipeGeneratorService.gerarReceitas(ingredientes, forcarIA);
      setState({ receitas, loading: false, erro: null });
      return receitas;
    } catch (error: any) {
      const mensagem = error.response?.data?.message || error.message || 'Erro ao gerar receitas';
      setState({ receitas: [], loading: false, erro: mensagem });
      throw error;
    }
  }, []);

  const limpar = useCallback(() => {
    setState({ receitas: [], loading: false, erro: null });
  }, []);

  return {
    ...state,
    gerarReceitas,
    limpar,
  };
}
