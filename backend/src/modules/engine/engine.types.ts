/**
 * Contrato público da Engine de Canonização — o mesmo shape que a futura
 * API B2B expõe (ver ANALISE_API_CANONIZACAO.md §1). O CookMe é o cliente nº 1.
 */

export type EstagioResolucao =
  | 'ean'         // EAN aprendido na KB — certeza máxima
  | 'dicionario'  // dicionário de abreviações (memória)
  | 'kb'          // knowledge base exata (normalized_name)
  | 'fuzzy'       // similaridade trigram (typos de OCR)
  | 'regex'       // padrões de mercado (OCR_MAPA)
  | 'normalizer'  // normalização linguística
  | 'ia'          // LLM (cauda longa — resultado aprende na KB)
  | 'fallback';   // limpeza heurística — confiança baixa

export interface ItemEntrada {
  descricao: string;
  ean?: string;
  preco?: number;
  quantidade?: number;
  unidade?: string;
}

export interface ItemCanonizado {
  descricao_original: string;
  produto_canonico: string;
  marca: string | null;
  eh_alimento: boolean | null; // null = indeterminado (aguarda classificação)
  ean: string | null;
  preco: number | null;
  quantidade: number | null;
  /** 0..1 — honesto: o consumidor decide o que fazer com itens de baixa confiança */
  confianca: number;
  estagio: EstagioResolucao;
}

/** Confiança base por estágio — calibrada pela natureza de cada resolução. */
export const CONFIANCA_POR_ESTAGIO: Record<EstagioResolucao, number> = {
  ean: 0.99,        // recompra do mesmo código de barras — quase certeza
  dicionario: 0.95, // curadoria humana explícita
  kb: 0.92,         // já resolvido e persistido antes
  regex: 0.88,      // padrão específico de mercado
  fuzzy: 0.75,      // typo-match — bom mas falível
  ia: 0.7,          // LLM com prompt dedicado — bom, não determinístico
  normalizer: 0.55, // heurística linguística genérica
  fallback: 0.3,    // limpeza bruta — sinalizar para revisão
};

/** Limiar abaixo do qual a cauda longa vai para o tier de IA (se habilitado). */
export const LIMIAR_IA = 0.6;
