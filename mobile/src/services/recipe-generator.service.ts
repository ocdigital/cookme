import api from './api';

export interface Receita {
  titulo: string;
  descricao: string;
  tempo_preparo: string;
  dificuldade: 'fácil' | 'médio' | 'difícil';
  ingredientes: string[];
  modo_preparo: string;
  rendimento: string;
  imagem_url?: string;
  is_nova?: boolean;
}

export interface ReceitasResponse {
  usuario_id: string;
  receitas_geradas: number;
  receitas: Receita[];
  timestamp: string;
}

class RecipeGeneratorService {
  async gerarReceitas(ingredientes: string[], forcarIA = false): Promise<Receita[]> {
    try {
      const response = await api.post<ReceitasResponse>('/receitas/gerar', {
        ingredientes,
        forcar_ia: forcarIA,
      });

      return response.data.receitas || [];
    } catch (error) {
      console.error('Erro ao gerar receitas:', error);
      throw error;
    }
  }
}

export default new RecipeGeneratorService();
