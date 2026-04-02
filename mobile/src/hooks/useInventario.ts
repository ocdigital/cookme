import { useState, useCallback, useEffect } from 'react';
import inventarioService, {
  ProdutoInventario,
} from '../services/inventario.service';

interface UseInventarioState {
  produtos: ProdutoInventario[];
  alimentos: ProdutoInventario[];
  nao_alimentos: ProdutoInventario[];
  loading: boolean;
  erro: string | null;
  stats: {
    total_produtos: number;
    alimentos: number;
    nao_alimentos: number;
  };
}

interface UseInventario extends UseInventarioState {
  obterInventario: () => Promise<void>;
  obterAlimentos: () => Promise<void>;
  obterNaoAlimentos: () => Promise<void>;
  atualizarQuantidade: (produto_id: string, quantidade: number) => Promise<void>;
  removerProduto: (produto_id: string) => Promise<void>;
  consumirProduto: (
    produto_id: string,
    quantidade_consumida: number,
  ) => Promise<void>;
  limpar: () => void;
  refrescar: () => Promise<void>;
}

export function useInventario(): UseInventario {
  const [state, setState] = useState<UseInventarioState>({
    produtos: [],
    alimentos: [],
    nao_alimentos: [],
    loading: false,
    erro: null,
    stats: {
      total_produtos: 0,
      alimentos: 0,
      nao_alimentos: 0,
    },
  });

  /**
   * Carrega inventário completo do usuário
   */
  const obterInventario = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null }));

      const response = await inventarioService.obterInventario();

      setState((prev) => ({
        ...prev,
        produtos: response.produtos || [],
        stats: {
          total_produtos: response.total_produtos,
          alimentos: response.alimentos,
          nao_alimentos: response.nao_alimentos,
        },
        loading: false,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error ? err.message : 'Erro ao carregar inventário';
      setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Carrega apenas alimentos do inventário
   */
  const obterAlimentos = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null }));

      const alimentos = await inventarioService.obterAlimentos();

      setState((prev) => ({
        ...prev,
        alimentos,
        loading: false,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error
          ? err.message
          : 'Erro ao carregar alimentos do inventário';
      setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Carrega apenas não-alimentos do inventário
   */
  const obterNaoAlimentos = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null }));

      const nao_alimentos = await inventarioService.obterNaoAlimentos();

      setState((prev) => ({
        ...prev,
        nao_alimentos,
        loading: false,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error
          ? err.message
          : 'Erro ao carregar não-alimentos do inventário';
      setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Atualiza quantidade de um produto
   */
  const atualizarQuantidade = useCallback(
    async (produto_id: string, quantidade: number) => {
      try {
        setState((prev) => ({ ...prev, loading: true, erro: null }));

        const produtoAtualizado = await inventarioService.atualizarQuantidade(
          produto_id,
          quantidade,
        );

        // Atualizar lista local
        setState((prev) => {
          const novosProdutos = prev.produtos.map((p) =>
            p.id === produto_id ? produtoAtualizado : p,
          );

          return {
            ...prev,
            produtos: novosProdutos,
            loading: false,
          };
        });
      } catch (err) {
        const mensagemErro =
          err instanceof Error
            ? err.message
            : 'Erro ao atualizar quantidade';
        setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
        throw err;
      }
    },
    [],
  );

  /**
   * Remove um produto do inventário
   */
  const removerProduto = useCallback(async (produto_id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null }));

      await inventarioService.removerProduto(produto_id);

      // Remover da lista local
      setState((prev) => {
        const novosProdutos = prev.produtos.filter((p) => p.id !== produto_id);

        // Recalcular stats
        const novasStats = {
          total_produtos: novosProdutos.length,
          alimentos: novosProdutos.filter((p) => p.ingrediente_receita).length,
          nao_alimentos: novosProdutos.filter((p) => !p.ingrediente_receita)
            .length,
        };

        return {
          ...prev,
          produtos: novosProdutos,
          stats: novasStats,
          loading: false,
        };
      });
    } catch (err) {
      const mensagemErro =
        err instanceof Error ? err.message : 'Erro ao remover produto';
      setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Consome quantidade de um produto
   */
  const consumirProduto = useCallback(
    async (produto_id: string, quantidade_consumida: number) => {
      try {
        setState((prev) => ({ ...prev, loading: true, erro: null }));

        const produtoConsumido = await inventarioService.consumirProduto(
          produto_id,
          quantidade_consumida,
        );

        // Atualizar lista local
        setState((prev) => {
          const novosProdutos = prev.produtos.map((p) =>
            p.id === produto_id ? produtoConsumido : p,
          );

          return {
            ...prev,
            produtos: novosProdutos,
            loading: false,
          };
        });
      } catch (err) {
        const mensagemErro =
          err instanceof Error ? err.message : 'Erro ao consumir produto';
        setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
        throw err;
      }
    },
    [],
  );

  /**
   * Limpa o estado
   */
  const limpar = useCallback(() => {
    setState({
      produtos: [],
      alimentos: [],
      nao_alimentos: [],
      loading: false,
      erro: null,
      stats: {
        total_produtos: 0,
        alimentos: 0,
        nao_alimentos: 0,
      },
    });
  }, []);

  /**
   * Recarrega o inventário completo
   */
  const refrescar = useCallback(async () => {
    return obterInventario();
  }, [obterInventario]);

  // Auto-load inventário ao montar o hook
  useEffect(() => {
    obterInventario();
  }, [obterInventario]);

  return {
    ...state,
    obterInventario,
    obterAlimentos,
    obterNaoAlimentos,
    atualizarQuantidade,
    removerProduto,
    consumirProduto,
    limpar,
    refrescar,
  };
}
