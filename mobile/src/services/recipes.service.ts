import api from './api';

export interface ReceitaSugerida {
  titulo: string;
  url: string;
  ingredientes_match: string[];
  fonte: string;
  data_sugestao: string;
}

export interface SuggestionResult {
  total_ingredientes_disponiveis: number;
  receitas_sugeridas: ReceitaSugerida[];
  query_utilizada: string;
  resumo: {
    receitas_encontradas: number;
    ingredientes_usados: string[];
  };
}

export interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  modo_preparo: string;
  tempo_preparo?: number;
  rendimento_porcoes?: number;
  dificuldade: 'facil' | 'media' | 'dificil';
  tags_dieta?: string[];
  tags_preparo?: string[];
  categoria_receita?: string;
  imagem_url?: string;
  informacoes_nutricionais?: {
    calorias?: number;
    proteinas?: number;
    carboidratos?: number;
    gorduras?: number;
  };
  ingredientes?: Array<{
    id: string;
    nome: string;
    quantidade: number;
    unidade: string;
  }>;
  vezes_executada: number;
  avaliacao_media: number;
}

class RecipesService {
  /**
   * Obtém receitas sugeridas baseado no inventário do usuário
   */
  async obterSugestoes(): Promise<SuggestionResult> {
    const response = await api.get<SuggestionResult>('/receitas/sugestoes');
    return response.data;
  }

  /**
   * Obtém detalhes de uma receita específica
   */
  async obterReceita(receitaId: string): Promise<Receita> {
    const response = await api.get<Receita>(`/receitas/${receitaId}`);
    return response.data;
  }

  /**
   * Inicia execução de uma receita
   */
  async iniciarExecucao(receitaId: string): Promise<{
    execucao_id: string;
    receita_id: string;
    status: string;
    ingredientes_necessarios: Array<{
      id: string;
      nome: string;
      quantidade: number;
      unidade: string;
      quantidade_disponivel: number;
    }>;
  }> {
    const response = await api.post(`/receitas/${receitaId}/executar`, {});
    return response.data;
  }

  /**
   * Finaliza execução de uma receita
   */
  async finalizarExecucao(
    receitaId: string,
    executacaoId: string,
  ): Promise<{
    status: string;
    message: string;
    receita_id: string;
  }> {
    const response = await api.post(
      `/receitas/${receitaId}/executar/${executacaoId}/finalizar`,
      {},
    );
    return response.data;
  }

  /**
   * Lista receitas do catálogo
   */
  async listarReceitas(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Receita[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await api.get('/receitas', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Busca receitas por termo
   */
  async buscarReceitas(termo: string): Promise<Receita[]> {
    const response = await api.get<Receita[]>('/receitas/buscar', {
      params: { q: termo },
    });
    return response.data;
  }

  /**
   * Adiciona receita aos favoritos
   */
  async adicionarAosFavoritos(receitaId: string): Promise<void> {
    await api.post(`/receitas/${receitaId}/favoritar`, {});
  }

  /**
   * Remove receita dos favoritos
   */
  async removerDosFavoritos(receitaId: string): Promise<void> {
    await api.delete(`/receitas/${receitaId}/favoritar`);
  }

  /**
   * Obtém receitas favoritas do usuário
   */
  async obterFavoritas(): Promise<Receita[]> {
    const response = await api.get<Receita[]>('/receitas/favoritas');
    return response.data;
  }
}

export default new RecipesService();
