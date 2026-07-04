import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductKnowledgeBase } from '../entities/product-knowledge-base.entity';
import { IngredientNormalizerService } from '../../receitas/services/ingredient-normalizer.service';
import { AbbreviationService } from './abbreviation.service';

// Palavras de marca/embalagem comuns em nomes de produtos de supermercado
// Usadas para extrair o nome base do ingrediente de nomes OCR sujos
const BRAND_WORDS = new Set([
  // Laticínios
  'italac', 'piracanjuba', 'vigor', 'lactel', 'elegê', 'elege', 'ccgl',
  'betania', 'leitbom', 'tirol', 'frimesa', 'ninho', 'moca', 'nestlé', 'nestle',
  'danone', 'batavo', 'gloria', 'quatá', 'quata', 'itambé', 'itambe', 'canaã', 'canaa',
  // Proteínas
  'sadia', 'perdigao', 'perdigão', 'seara', 'aurora', 'friboi', 'jbs', 'swift',
  'minerva', 'marfrig', 'socicam', 'rezende', 'copacol', 'pif paf', 'macedo',
  // Grãos / massas
  'camil', 'tio joao', 'tiojoao', 'broto legal', 'namorada', 'urbano', 'dacolonia',
  'quaker', 'mili', 'globo', 'isabela', 'adria', 'renata', 'dona benta',
  // Óleos / gorduras
  'liza', 'soya', 'salada', 'cocinero', 'qualy', 'becel', 'doriana',
  'aviacao', 'aviação', 'presidente', 'polenghi',
  // Temperos / molhos
  'maggi', 'knorr', 'ajinomoto', 'kitano', 'hikari', 'yoki', 'hemmer',
  'fugini', 'oderich', 'predilecta', 'cica', 'peixe', 'heinz', 'hellmanns',
  // Pães / doces
  'wickbold', 'bauducco', 'pullman', 'nutrella', 'plusvita', 'seven boys',
  'tostines', 'oreo', 'nesfit', 'fornas', 'ana maria', 'lune',
  // Genéricos de qualidade (não são ingredientes)
  'premium', 'especial', 'select', 'tradicional', 'original', 'classico',
  'light', 'zero', 'fit', 'extra', 'super', 'mega', 'ultra', 'plus', 'max', 'top',
  'gold', 'silver', 'boa', 'leve', 'bom', 'seleção',
  // Outros distribuidores
  'italac', 'naturelo', 'naturegg', 'hortifruti', 'coamo', 'unilever', 'bunge',
]);

// Sufixos/palavras de embalagem e peso que não identificam o ingrediente
const PACKAGING_PATTERNS = [
  // Medidas com números
  /\b\d+[,.]?\d*\s*(kg|g|gr|mg|ml|l|lt|litro|litros|un|unid|unidade|pc|pç|cx|caixa)\b/gi,
  /\bc\/\d+\b/gi,        // c/10, c/6, c/12
  /\b\d+x\d+\b/gi,       // 16x30
  /\b\d+\b/g,            // números soltos
  // Unidades SEM número (palavra isolada)
  /\b(kg|un|gr|ml|lt|cx|pct|fd|bdj)\b/gi,
  // Descritores de embalagem
  /\b(bandeja|bandeija|caixa|pote|pacote|lata|garrafa|saco|fardo|rolo|und|fardo|maco|maço)\b/gi,
  // Descritores de apresentação
  /\b(fatiado|fatiada|picado|picada|moido|moída|cozido|cozida|congelado|congelada|cong|resfriado)\b/gi,
  /\b(inteiro|inteira|fresco|fresca|seco|seca|defumado|defumada|grelhado|grelhada)\b/gi,
  /\b(organico|orgânico|organica|organica|natural|integral|refinado|refinada)\b/gi,
  /\b(vermelho|vermelha|verm|amarelo|amarela|am|verde|vd|roxo|roxa|branco|branca|bran|preto|preta)\b/gi,
  // Qualificativos genéricos
  /\b(tradicional|premium|original|especial|extra|super|light|zero|fit|gold|plus)\b/gi,
  /\b(grande|medio|medio|pequeno|pequena|familia|fam)\b/gi,
  // Formatação de produto
  /\b(ctampa|c\.tampa|com\s+tampa)\b/gi,
  /\b(rn|bebe|infantil)\b/gi,
  /\b(nanica|prata|maca|cavendish|caturra|tipo|variedade|var)\b/gi,  // variedades de frutas
  /\b(espiga|ramo|molho|bando|cacho)\b/gi,  // formas de venda
];

// Mapeamento direto de padrões OCR → ingrediente canônico
// Mais específico que o normalizer, cobre nomes de mercado
const OCR_MAPA: Array<[RegExp, string]> = [
  // Proteínas
  [/\bpeito\s+de?\s+frang/i, 'peito de frango'],
  [/\bfile\s+de?\s+frang/i, 'peito de frango'],
  [/\bfrang.{0,20}peito/i, 'peito de frango'],
  [/\basa\s+de?\s+frang/i, 'asa de frango'],
  [/\bcoxinha\s+da?\s+asa/i, 'coxinha da asa'],
  [/\bsobrecoxa/i, 'sobrecoxa de frango'],
  [/\bcoxa.{0,10}frang/i, 'coxa de frango'],
  [/\bfrang/i, 'frango'],
  [/\bcarne\s+moi/i, 'carne moída'],
  [/\bpatinho/i, 'carne moída'],
  [/\bpicanha/i, 'picanha'],
  [/\bacém/i, 'acém'],
  [/\bacem/i, 'acém'],
  [/\bcarne\s+bov/i, 'carne bovina'],
  [/\bcarne\s+por/i, 'carne suína'],
  [/\blombo/i, 'lombo suíno'],
  [/\bpernil/i, 'pernil suíno'],
  [/\bcostelinh/i, 'costelinha de porco'],
  [/\bbacon/i, 'bacon'],
  [/\blinguica\s+calah?r/i, 'linguiça calabresa'],
  [/\blinguica/i, 'linguiça'],
  [/\bpaio/i, 'paio'],
  [/\bcarne\s+sec/i, 'carne seca'],
  [/\bcharque/i, 'charque'],
  // Frutos do mar
  [/\btilapia/i, 'tilápia'],
  [/\bsalmao/i, 'salmão'],
  [/\bmerluza/i, 'merluza'],
  [/\bbacalhau/i, 'bacalhau'],
  [/\bcamarao/i, 'camarão'],
  [/\batum\s+lat/i, 'atum em lata'],
  [/\batum/i, 'atum'],
  // Laticínios
  [/\bqueijo\s+mussarel/i, 'queijo mussarela'],
  [/\bqueijo\s+parmesao/i, 'queijo parmesão'],
  [/\bqueijo\s+prato/i, 'queijo prato'],
  [/\bqueijo\s+coalh/i, 'queijo coalho'],
  [/\bqueijo\s+creamcheese/i, 'cream cheese'],
  [/\bcream.?cheese/i, 'cream cheese'],
  [/\brequeijao/i, 'requeijão'],
  [/\bqueijo/i, 'queijo'],
  [/\bcreme\s+de?\s+leite/i, 'creme de leite'],
  [/\bcr\s+leite\b/i, 'creme de leite'],
  [/\bleite\s+condensa/i, 'leite condensado'],
  [/\bleite\s+de?\s+coc/i, 'leite de coco'],
  [/\bleite\s+coca/i, 'leite de coco'],
  [/\bmanteiga/i, 'manteiga'],
  [/\bmargarina/i, 'manteiga'],
  [/\bleite\s+int/i, 'leite'],
  [/\bleite\s+desnat/i, 'leite desnatado'],
  [/\bleite\s+semi/i, 'leite semidesnatado'],
  [/\bleite\b/i, 'leite'],
  [/\biogurte|iog\b/i, 'iogurte'],
  [/\bcoalhada/i, 'coalhada'],
  [/\bricota/i, 'ricota'],
  // Grãos e carboidratos
  [/\barroz\s+bran/i, 'arroz branco'],
  [/\barroz\s+int/i, 'arroz integral'],
  [/\barroz/i, 'arroz'],
  [/\bfeijao\s+preto/i, 'feijão preto'],
  [/\bfeijao\s+caric/i, 'feijão carioca'],
  [/\bfeijao\s+mus|feijao\s+muin/i, 'feijão mulatinho'],
  [/\bfeijao/i, 'feijão'],
  [/\blentilha/i, 'lentilha'],
  [/\bgrao\s+de?\s+bico/i, 'grão-de-bico'],
  [/\bfar[ij]nha\s+de?\s+trig/i, 'farinha de trigo'],
  [/\bfar[ij]nha\s+de?\s+mand/i, 'farinha de mandioca'],
  [/\bfar[ij]nha\s+de?\s+avei/i, 'farinha de aveia'],
  [/\bmacarrao\s+espag/i, 'macarrão espaguete'],
  [/\bmacarrao\s+paraf/i, 'macarrão parafuso'],
  [/\bmacarrao/i, 'macarrão'],
  [/\bspaghetti|espague/i, 'macarrão espaguete'],
  [/\bmassa\s+de?\s+lasanh/i, 'lasanha'],
  // Vegetais
  [/\bbatata\s+doc/i, 'batata doce'],
  [/\bbatata\s+bal/i, 'batata'],
  [/\bbatata/i, 'batata'],
  [/\bmandioca\s+cong/i, 'mandioca'],
  [/\bmandioca/i, 'mandioca'],
  [/\babobrinha/i, 'abobrinha'],
  [/\babobora/i, 'abóbora'],
  [/\bcabotia/i, 'abóbora cabotiá'],
  [/\bberingela/i, 'berinjela'],
  [/\bcenoura/i, 'cenoura'],
  [/\bcebola\s+rox/i, 'cebola roxa'],
  [/\bcebola/i, 'cebola'],
  [/\balho\s+por/i, 'alho-poró'],
  [/\balho/i, 'alho'],
  [/\btomate\s+cerij/i, 'tomate cereja'],
  [/\btomate/i, 'tomate'],
  [/\bpimentao\s+verm/i, 'pimentão vermelho'],
  [/\bpimentao\s+ama/i, 'pimentão amarelo'],
  [/\bpimentao\s+verd/i, 'pimentão verde'],
  [/\bpimentao/i, 'pimentão'],
  [/\bchuch/i, 'chuchu'],
  [/\bbrocol/i, 'brócolis'],
  [/\bcouveflor|couve.flor/i, 'couve-flor'],
  [/\bcouve\s+mini/i, 'couve de bruxelas'],
  [/\bcouve/i, 'couve'],
  [/\bespinafre/i, 'espinafre'],
  [/\brepolho/i, 'repolho'],
  [/\balface/i, 'alface'],
  [/\bsalsao/i, 'salsão'],
  [/\bcepola|cebolinha/i, 'cebolinha'],
  [/\bsalsa\b|salsinha/i, 'salsinha'],
  [/\bcoentro/i, 'coentro'],
  [/\bmilho\s+cong/i, 'milho verde'],
  [/\bmilho/i, 'milho'],
  [/\bervilha/i, 'ervilha'],
  [/\bquiabo/i, 'quiabo'],
  [/\bbeterraba/i, 'beterraba'],
  // Frutas
  [/\blimao\s+si/i, 'limão siciliano'],
  [/\blimao/i, 'limão'],
  [/\b(pocan|pokan|ponkan)\b/i, 'ponkan'],
  [/\blaranja/i, 'laranja'],
  [/\babacaxi/i, 'abacaxi'],
  [/\bmorango/i, 'morango'],
  [/\bmanga/i, 'manga'],
  [/\bcaqui/i, 'caqui'],
  [/\buva/i, 'uva'],
  [/\bmaça|maca\b/i, 'maçã'],
  [/\bbanan/i, 'banana'],
  [/\bmelao/i, 'melão'],
  [/\bmelanci/i, 'melancia'],
  [/\bpapaia|mamao/i, 'mamão papaia'],
  // Ovos
  [/\bovos?\s+caipira/i, 'ovo'],
  [/\bovos?\s+bran/i, 'ovo'],
  [/\bovos?\s+org/i, 'ovo'],
  [/\bovos?\s+verm/i, 'ovo'],
  [/\bovos?/i, 'ovo'],
  // Óleos e gorduras
  [/\bazeite/i, 'azeite de oliva'],
  [/\boleo\s+de?\s+coc/i, 'óleo de coco'],
  [/\boleo/i, 'óleo'],
  // Temperos e condimentos
  [/\bextrato\s+de?\s+tomate/i, 'extrato de tomate'],
  [/\bmolho\s+de?\s+tomate/i, 'molho de tomate'],
  [/\bpassata/i, 'molho de tomate'],
  [/\bmolho\s+shoyu/i, 'shoyu'],
  [/\bcaldo\s+de?\s+galin/i, 'caldo de galinha'],
  [/\bcaldo\s+de?\s+carne/i, 'caldo de carne'],
  [/\bcaldo\s+de?\s+legum/i, 'caldo de legumes'],
  [/\bfubá|fuba\b/i, 'fubá'],
  [/\bpolvilho/i, 'polvilho'],
  [/\bfarofa/i, 'farofa'],
  [/\bpanko/i, 'farinha de rosca'],
  [/\bfar[ij]nha\s+de?\s+rosc/i, 'farinha de rosca'],
  // Chocolate (before "leite" to catch "ao leite")
  [/\bchocolate\s+ao?\s+leite/i, 'chocolate ao leite'],
  [/\bchoc.{0,10}leite/i, 'chocolate ao leite'],
  [/\bchocolate\s+amarg/i, 'chocolate amargo'],
  [/\bchocolate\s+bran/i, 'chocolate branco'],
  [/\bchocolate\b/i, 'chocolate'],
  [/\bchoc\b/i, 'chocolate'],
  // Biscoito / bolacha (não são ingredientes de receita mas precisam ter canonical)
  [/\bbiscoito/i, 'biscoito'],
  [/\bbolacha/i, 'bolacha'],
  // Pão
  [/\bpao\s+de?\s+queijo/i, 'pão de queijo'],
  [/\bpao\s+de?\s+forma/i, 'pão de forma'],
  [/\bpao\s+fran/i, 'pão francês'],
  [/\bpao\s+de?\s+mel/i, 'pão de mel'],
  [/\bpao/i, 'pão'],
  // Doces e panificação
  [/\bfermento\s+biol/i, 'fermento biológico'],
  [/\bfermento/i, 'fermento em pó'],
  [/\bacucar\s+mascav/i, 'açúcar mascavo'],
  [/\bacucar\s+confeit/i, 'açúcar de confeiteiro'],
  [/\bacucar/i, 'açúcar'],
  [/\bchocolate\s+ao?\s+leite/i, 'chocolate ao leite'],
  [/\bchocolate\s+amarg/i, 'chocolate amargo'],
  [/\bchocolate\s+bran/i, 'chocolate branco'],
  [/\bchocolate/i, 'chocolate'],
  [/\bgelatin/i, 'gelatina'],
  [/\bpolpa\s+de?\s+fruta/i, 'polpa de fruta'],
  // Bebidas
  [/\bvinho\s+tint/i, 'vinho tinto'],
  [/\bvinho\s+bran/i, 'vinho branco'],
  [/\bcerveja/i, 'cerveja'],
  [/\bleite\s+de?\s+coc/i, 'leite de coco'],
];

@Injectable()
export class OcrAliasService {
  private readonly logger = new Logger(OcrAliasService.name);

  constructor(
    @InjectRepository(ProductKnowledgeBase)
    private readonly knowledgeRepo: Repository<ProductKnowledgeBase>,
    private readonly normalizer: IngredientNormalizerService,
    private readonly abbreviationService: AbbreviationService,
  ) {}

  /**
   * Resolve o nome canônico de ingrediente a partir de um nome OCR sujo.
   * Ex: "Ovos Caipira Naturegg Verm C/10" → "ovo"
   * Ex: "Leite Italac Int C/Tampa 1L" → "leite"
   *
   * Fluxo:
   * 1. Lookup exato no banco (normalized_name)
   * 2. Fuzzy lookup via pg_trgm (typos OCR, ex: "Laraganja" → "Laranja")
   * 3. Aplicar OCR_MAPA (regras por padrão regex)
   * 4. Aplicar IngredientNormalizerService (regras linguísticas)
   * 5. Fallback: primeiras palavras normalizadas
   */
  async resolverNomeCanônico(nomeOcr: string, codigoBarras?: string): Promise<string> {
    const normalizedKey = this.normalizarChave(nomeOcr);

    // 0. EAN aprendido — chave canônica definitiva, ignora variação de nome
    if (codigoBarras) {
      const porEan = await this.knowledgeRepo.findOne({
        where: { codigo_barras: codigoBarras },
        select: ['canonical_ingredient'],
      });
      if (porEan?.canonical_ingredient) {
        this.logger.debug(`EAN ${codigoBarras}: "${nomeOcr}" → "${porEan.canonical_ingredient}"`);
        return porEan.canonical_ingredient;
      }
    }

    // 1. Tabela de abreviações (passo mais rápido — memória)
    const abbrMatch = this.abbreviationService.expand(nomeOcr);
    if (abbrMatch) {
      this.logger.debug(`Abreviação: "${nomeOcr}" → "${abbrMatch.expanded}" (ingrediente=${abbrMatch.is_ingredient})`);
      await this.persistirCanonical(normalizedKey, nomeOcr, abbrMatch.expanded, abbrMatch.is_ingredient, codigoBarras);
      return abbrMatch.expanded;
    }

    // 2. Lookup exato no banco
    const cached = await this.knowledgeRepo.findOne({
      where: { normalized_name: normalizedKey },
      select: ['canonical_ingredient'],
    });

    if (cached?.canonical_ingredient) {
      if (codigoBarras) {
        await this.persistirCanonical(normalizedKey, nomeOcr, cached.canonical_ingredient, undefined, codigoBarras);
      }
      return cached.canonical_ingredient;
    }

    // 3. Fuzzy lookup via trigram (pega typos OCR e variações de nome)
    const fuzzyResult = await this.fuzzyLookup(nomeOcr);
    if (fuzzyResult) {
      await this.persistirCanonical(normalizedKey, nomeOcr, fuzzyResult, undefined, codigoBarras);
      return fuzzyResult;
    }

    // 4. Tentar OCR_MAPA (padrões específicos de supermercado)
    const textoLimpo = nomeOcr.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const [regex, canonical] of OCR_MAPA) {
      if (regex.test(textoLimpo)) {
        // Persiste para cache futuro
        await this.persistirCanonical(normalizedKey, nomeOcr, canonical, undefined, codigoBarras);
        return canonical;
      }
    }

    // 5. IngredientNormalizerService
    const norm = this.normalizer.normalizar(nomeOcr);
    if (norm && norm.nomeCanônico && norm.nomeCanônico.length > 1) {
      const canonical = norm.nomeCanônico;
      await this.persistirCanonical(normalizedKey, nomeOcr, canonical, undefined, codigoBarras);
      return canonical;
    }

    // 6. Fallback: limpar embalagem e pegar primeiras 2 palavras
    const fallback = this.fallbackLimpar(nomeOcr);
    return fallback;
  }

  /**
   * Resolve nomes para uma lista (batch). Retorna Map<nomeOcr, canonical>.
   */
  async resolverLote(nomesOcr: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    await Promise.all(
      nomesOcr.map(async nome => {
        result.set(nome, await this.resolverNomeCanônico(nome));
      })
    );
    return result;
  }

  /**
   * Atualiza manualmente o canonical_ingredient de um produto.
   * Chamado quando usuário corrige o nome no app.
   */
  async registrarCorreção(nomeOcr: string, nomeCanônico: string): Promise<void> {
    const normalizedKey = this.normalizarChave(nomeOcr);
    const existing = await this.knowledgeRepo.findOne({ where: { normalized_name: normalizedKey } });
    if (existing) {
      await this.knowledgeRepo.update(existing.id, { canonical_ingredient: nomeCanônico });
    }
  }

  /**
   * Busca fuzzy no product_knowledge_base usando pg_trgm.
   * Threshold 0.25 → captura typos OCR com até ~30% de caracteres errados.
   * Ignora acentos ao comparar (via lower + unaccent no lado JS).
   */
  private async fuzzyLookup(nomeOcr: string): Promise<string | null> {
    try {
      // Limpa o nome antes do fuzzy (remove unidades e marcas) para melhorar similaridade
      const nomeLimpo = this.fallbackLimpar(nomeOcr);
      if (nomeLimpo.length < 3) return null;

      const rows: Array<{ canonical_ingredient: string; sim: number }> = await this.knowledgeRepo.query(
        `SELECT canonical_ingredient,
                similarity(lower(product_name), lower($1)) as sim
         FROM product_knowledge_base
         WHERE similarity(lower(product_name), lower($1)) > 0.25
           AND canonical_ingredient IS NOT NULL
           AND canonical_ingredient != ''
           AND ingrediente_receita = true
         ORDER BY sim DESC
         LIMIT 1`,
        [nomeLimpo],
      );

      if (rows.length > 0 && rows[0].sim >= 0.25) {
        this.logger.debug(`Fuzzy match: "${nomeOcr}" → "${rows[0].canonical_ingredient}" (sim=${rows[0].sim.toFixed(2)})`);
        return rows[0].canonical_ingredient;
      }
    } catch (e) {
      this.logger.warn(`Fuzzy lookup falhou: ${e.message}`);
    }
    return null;
  }

  private normalizarChave(nome: string): string {
    return nome
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  private async persistirCanonical(
    normalizedKey: string,
    nomeOcr: string,
    canonical: string,
    isIngredient?: boolean,
    codigoBarras?: string,
  ): Promise<void> {
    try {
      const existing = await this.knowledgeRepo.findOne({ where: { normalized_name: normalizedKey } });
      if (existing) {
        const update: Partial<ProductKnowledgeBase> = {};
        if (!existing.canonical_ingredient) update.canonical_ingredient = canonical;
        if (isIngredient !== undefined) update.ingrediente_receita = isIngredient;
        // Aprende o EAN — recompra do mesmo produto resolve sem heurística
        if (codigoBarras && !existing.codigo_barras) update.codigo_barras = codigoBarras;
        if (Object.keys(update).length > 0) {
          await this.knowledgeRepo.update(existing.id, update);
          this.logger.debug(`KB atualizado: "${nomeOcr}" → "${canonical}"`);
        }
      }
    } catch (e) {
      // não bloqueia fluxo
    }
  }

  private fallbackLimpar(nome: string): string {
    let texto = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    // Remove padrões de embalagem
    for (const pattern of PACKAGING_PATTERNS) {
      texto = texto.replace(pattern, ' ');
    }

    // Remove palavras de marca conhecidas
    const palavras = texto.split(/\s+/).filter(p => p.length > 1 && !BRAND_WORDS.has(p));

    return palavras.slice(0, 3).join(' ').trim() || nome.toLowerCase().trim().split(/\s+/).slice(0, 3).join(' ');
  }
}
