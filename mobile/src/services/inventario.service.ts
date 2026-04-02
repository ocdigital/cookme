import api from './api';

export interface ProdutoInventario {
  id: string;
  nome: string;
  categoria: string;
  quantidade_disponivel: number;
  unidade: string;
  ingrediente_receita: boolean;
  confianca_classificacao: number;
  data_adicao: string;
  imagem_url?: string;
}

export interface InventarioResponse {
  total_produtos: number;
  alimentos: number;
  nao_alimentos: number;
  produtos: ProdutoInventario[];
}

export interface AtualizarInventarioRequest {
  produto_id: string;
  quantidade_disponivel: number;
}

class InventarioService {
  /**
   * Obtém inventário do usuário
   */
  async obterInventario(): Promise<InventarioResponse> {
    const response = await api.get<InventarioResponse>('/inventario');
    return response.data;
  }

  /**
   * Obtém apenas alimentos do inventário
   */
  async obterAlimentos(): Promise<ProdutoInventario[]> {
    const response = await api.get<ProdutoInventario[]>(
      '/inventario?ingrediente_receita=true',
    );
    return response.data;
  }

  /**
   * Obtém apenas não-alimentos
   */
  async obterNaoAlimentos(): Promise<ProdutoInventario[]> {
    const response = await api.get<ProdutoInventario[]>(
      '/inventario?ingrediente_receita=false',
    );
    return response.data;
  }

  /**
   * Atualiza quantidade de um produto
   */
  async atualizarQuantidade(
    produto_id: string,
    quantidade: number,
  ): Promise<ProdutoInventario> {
    const response = await api.put<ProdutoInventario>(
      `/inventario/${produto_id}`,
      {
        quantidade_disponivel: quantidade,
      },
    );
    return response.data;
  }

  /**
   * Remove produto do inventário
   */
  async removerProduto(produto_id: string): Promise<void> {
    await api.delete(`/inventario/${produto_id}`);
  }

  /**
   * Consome quantidade de um produto (para execução de receita)
   */
  async consumirProduto(
    produto_id: string,
    quantidade_consumida: number,
  ): Promise<ProdutoInventario> {
    const response = await api.post<ProdutoInventario>(
      `/inventario/${produto_id}/consumir`,
      {
        quantidade_consumida,
      },
    );
    return response.data;
  }
}

export default new InventarioService();
