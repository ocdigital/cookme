import { useState, useCallback } from 'react';
import validacaoService, {
  ProdutoParaValidar,
  ValidacaoResponse,
} from '../services/validacao.service';

interface UseValidacaoState {
  produtos_para_validar: ProdutoParaValidar[];
  produtos_validados: Map<string, boolean>;
  loading: boolean;
  erro: string | null;
  ultimoResultado: ValidacaoResponse | null;
}

interface UseValidacao extends UseValidacaoState {
  importarCupom: (
    photos: Array<{ ocrText: string; photoNumber: number }>,
    data_compra?: string,
    loja?: string,
  ) => Promise<ValidacaoResponse>;
  validarProduto: (
    produto_id: string,
    ingrediente_receita: boolean,
    motivo?: string,
  ) => Promise<void>;
  obterPendentes: () => Promise<void>;
  limpar: () => void;
  percentualValidacao: () => number;
}

export function useValidacao(): UseValidacao {
  const [state, setState] = useState<UseValidacaoState>({
    produtos_para_validar: [],
    produtos_validados: new Map(),
    loading: false,
    erro: null,
    ultimoResultado: null,
  });

  /**
   * Importar cupom: OCR → Classificação → Salvar
   * Retorna produtos que precisam validação
   */
  const importarCupom = useCallback(
    async (
      photos: Array<{ ocrText: string; photoNumber: number }>,
      data_compra?: string,
      loja?: string,
    ): Promise<ValidacaoResponse> => {
      try {
        setState((prev) => ({ ...prev, loading: true, erro: null }));

        const resultado = await validacaoService.importarCupom(
          photos,
          data_compra,
          loja,
          true, // usar IA
        );

        setState((prev) => ({
          ...prev,
          produtos_para_validar: resultado.produtos_para_validar,
          ultimoResultado: resultado,
          loading: false,
        }));

        return resultado;
      } catch (err) {
        const mensagemErro =
          err instanceof Error ? err.message : 'Erro ao importar cupom';
        setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
        throw err;
      }
    },
    [],
  );

  /**
   * Validar um produto manualmente
   */
  const validarProduto = useCallback(
    async (
      produto_id: string,
      ingrediente_receita: boolean,
      motivo?: string,
    ) => {
      try {
        setState((prev) => ({ ...prev, loading: true, erro: null }));

        await validacaoService.validarProduto(
          produto_id,
          ingrediente_receita,
          motivo,
        );

        // Atualizar mapa de validações
        setState((prev) => {
          const novoMapa = new Map(prev.produtos_validados);
          novoMapa.set(produto_id, ingrediente_receita);

          return {
            ...prev,
            produtos_validados: novoMapa,
            loading: false,
          };
        });
      } catch (err) {
        const mensagemErro =
          err instanceof Error ? err.message : 'Erro ao validar produto';
        setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
        throw err;
      }
    },
    [],
  );

  /**
   * Obter produtos pendentes de validação
   */
  const obterPendentes = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, erro: null }));

      const pendentes = await validacaoService.obterProdutosPendentes();

      setState((prev) => ({
        ...prev,
        produtos_para_validar: pendentes,
        loading: false,
      }));
    } catch (err) {
      const mensagemErro =
        err instanceof Error ? err.message : 'Erro ao buscar pendentes';
      setState((prev) => ({ ...prev, erro: mensagemErro, loading: false }));
      throw err;
    }
  }, []);

  /**
   * Limpar estado
   */
  const limpar = useCallback(() => {
    setState({
      produtos_para_validar: [],
      produtos_validados: new Map(),
      loading: false,
      erro: null,
      ultimoResultado: null,
    });
  }, []);

  /**
   * Calcular percentual de validação
   */
  const percentualValidacao = useCallback(() => {
    if (state.produtos_para_validar.length === 0) return 100;

    const validados = state.produtos_validados.size;
    const total = state.produtos_para_validar.length;

    return Math.round((validados / total) * 100);
  }, [state.produtos_para_validar, state.produtos_validados]);

  return {
    ...state,
    importarCupom,
    validarProduto,
    obterPendentes,
    limpar,
    percentualValidacao,
  };
}
