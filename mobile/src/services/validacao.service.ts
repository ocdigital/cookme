import api from './api';

export interface ProdutoParaValidar {
  id?: string;
  nome: string;
  categoria: string;
  confianca_classificacao: number;
  requer_validacao_manual: boolean;
  motivo: string;
  ingrediente_receita: boolean;
}

export interface ValidacaoResponse {
  status: 'sucesso' | 'requer_validacao';
  produtos_adicionados: number;
  produtos_para_validar: ProdutoParaValidar[];
  resumo: {
    total_extraido: number;
    alimentos: number;
    nao_alimentos: number;
    confianca_media: number;
  };
  message: string;
}

export interface ValidarProdutoRequest {
  produto_id: string;
  ingrediente_receita: boolean;
  motivo?: string;
}

class ValidacaoService {
  /**
   * Importa cupom: OCR → Classificação → Salva
   * Retorna produtos que precisam validação manual
   */
  async importarCupom(
    photos: Array<{ ocrText: string; photoNumber: number }>,
    data_compra?: string,
    loja?: string,
    usar_ia: boolean = true,
  ): Promise<ValidacaoResponse> {
    const response = await api.post<ValidacaoResponse>('/receitas/import/cupom', {
      photos,
      data_compra,
      loja,
      usar_ia,
    });
    return response.data;
  }

  /**
   * Valida manualmente um produto
   */
  async validarProduto(
    produto_id: string,
    ingrediente_receita: boolean,
    motivo?: string,
  ): Promise<{ status: string; message: string }> {
    const response = await api.post('/receitas/import/validar', {
      produto_id,
      ingrediente_receita,
      motivo,
    });
    return response.data;
  }

  /**
   * Obtém produtos pendentes de validação
   */
  async obterProdutosPendentes(): Promise<ProdutoParaValidar[]> {
    const response = await api.get<ProdutoParaValidar[]>(
      '/receitas/import/pendentes',
    );
    return response.data;
  }
}

export default new ValidacaoService();
