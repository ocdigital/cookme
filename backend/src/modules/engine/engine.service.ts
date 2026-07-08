import { Injectable, Logger, Optional } from '@nestjs/common';
import { OcrAliasService, EstagioCanonizacao } from '../product-classification/services/ocr-alias.service';
import { ehNaoIngrediente } from '@common/nao-ingrediente.guard';
import { extrairMarca } from './marcas';
import { LlmCanonizadorService } from './llm-canonizador.service';
import {
  ItemEntrada,
  ItemCanonizado,
  EstagioResolucao,
  CONFIANCA_POR_ESTAGIO,
  LIMIAR_IA,
} from './engine.types';

const MAPA_ESTAGIO: Record<EstagioCanonizacao, EstagioResolucao> = {
  ean: 'ean',
  abreviacao: 'dicionario',
  kb_exato: 'kb',
  fuzzy: 'fuzzy',
  regex: 'regex',
  normalizer: 'normalizer',
  fallback: 'fallback',
};

/**
 * Engine de Canonização — a API interna única que o CookMe consome e que a
 * futura API B2B expõe (contrato em engine.types.ts / ANALISE_API_CANONIZACAO.md).
 *
 * Pipeline por item:
 *   1. resolução determinística em estágios (EAN → dicionário → KB → fuzzy →
 *      regex → normalizer → fallback), via OcrAliasService
 *   2. guard de não-ingrediente (sabonete/detergente nunca viram "alimento")
 *   3. extração de marca
 *   4. confidence score honesto por estágio
 *   5. cauda longa: confiança < LIMIAR_IA → tier de IA (se habilitado), cujo
 *      resultado APRENDE na KB — cada item custa IA no máximo uma vez, global
 */
@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(
    private readonly ocrAlias: OcrAliasService,
    @Optional() private readonly llmCanonizador?: LlmCanonizadorService,
  ) {}

  async canonizar(item: ItemEntrada): Promise<ItemCanonizado> {
    const descricao = (item.descricao || '').trim();

    // Guard determinístico: não-ingrediente decidido ANTES de qualquer resolução
    const naoIngrediente = ehNaoIngrediente(descricao);

    const { canonical, estagio: estagioInterno } = await this.ocrAlias.resolverComEstagio(
      descricao,
      item.ean,
    );
    let estagio = MAPA_ESTAGIO[estagioInterno];
    let produto = canonical;
    let confianca = CONFIANCA_POR_ESTAGIO[estagio];

    // Cauda longa: resolução fraca → IA (aprende na KB; próxima vez sai no estágio kb/ean)
    if (confianca < LIMIAR_IA && this.llmCanonizador?.habilitado && !naoIngrediente) {
      const ia = await this.llmCanonizador.canonizar(descricao, item.ean);
      if (ia) {
        produto = ia.produto_canonico;
        estagio = 'ia';
        confianca = CONFIANCA_POR_ESTAGIO.ia;
      }
    }

    return {
      descricao_original: descricao,
      produto_canonico: produto,
      marca: extrairMarca(descricao),
      eh_alimento: naoIngrediente ? false : null, // null = classificação IA decide depois
      ean: item.ean ?? null,
      preco: item.preco ?? null,
      quantidade: item.quantidade ?? null,
      confianca: naoIngrediente ? Math.max(confianca, 0.9) : confianca,
      estagio,
    };
  }

  async canonizarLote(itens: ItemEntrada[]): Promise<ItemCanonizado[]> {
    // Sequencial de propósito: itens repetidos no mesmo lote aproveitam o que
    // o anterior acabou de aprender (KB/EAN). Paralelizar por chunks se virar gargalo.
    const resultado: ItemCanonizado[] = [];
    for (const item of itens) {
      resultado.push(await this.canonizar(item));
    }
    return resultado;
  }
}
