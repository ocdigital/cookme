/**
 * Espelho do contrato público da Engine (food-canonizer-api). Fonte de
 * verdade real é o repo da Engine — ver PLANO_EXTRACAO_ENGINE.md §4.5, que
 * já prevê substituir este espelho por um client gerado do OpenAPI.
 */
export interface ItemEntrada {
  descricao: string;
  ean?: string;
  preco?: number;
  quantidade?: number;
  unidade?: string;
}

export type EstagioResolucao =
  | 'ean'
  | 'correcao'
  | 'dicionario'
  | 'kb'
  | 'fuzzy'
  | 'regex'
  | 'normalizer'
  | 'ia'
  | 'fallback'
  | 'pendente';

export interface ItemCanonizado {
  descricao_original: string;
  produto_canonico: string;
  marca: string | null;
  eh_alimento: boolean | null;
  ean: string | null;
  preco: number | null;
  quantidade: number | null;
  confianca: number;
  estagio: EstagioResolucao;
  nucleo: string | null;
  especificador: string | null;
}
