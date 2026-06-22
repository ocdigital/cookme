import { Injectable } from '@nestjs/common';

export interface IngredienteNormalizado {
  nomeCanônico: string;
  quantidade?: number;
  unidade?: string;
  aGosto: boolean;
}

// Unidades de medida para remover — sorted longest-first to prevent 'l' matching 'lata', etc.
const UNIDADES_ARRAY = [
  'colheres', 'caixinha', 'unidade', 'unidades', 'tabletes', 'envelopes', 'pacotes',
  'pitadas', 'pedaços', 'pedacos', 'pedaco', 'bisnaga',
  'colher', 'tablete', 'xícara', 'xicara', 'xcara',
  'caixas', 'caixa', 'latas', 'pacote', 'sachê', 'sache', 'dentes',
  'cubos', 'fatias', 'ramos', 'folhas', 'pitada', 'punhado',
  'litros', 'litro',
  'maço', 'maco', 'buque', 'potes',
  'lata', 'copo', 'dente', 'cubinho', 'cubo', 'fatia', 'ramo', 'folha',
  'pote', 'fio', 'col', 'envelope',
  'un', 'kg', 'mg', 'ml', 'cs', 'ct',
  'g', 'l',
];

const UNIDADES = UNIDADES_ARRAY.join('|');

const REGEX_QUANTIDADE = new RegExp(
  `^[\\d½¼¾⅓⅔/.,]+[\\d,./\\s]*\\s*(?:(?:${UNIDADES})(?:inhos?|inhas?|s?)?)?\\s*(?:de\\s+)?`,
  'i',
);

// Remove quantidade numérica no FINAL da string (ex: "biscoito 200g", "queijo 1/2")
const REGEX_QUANTIDADE_FIM = new RegExp(
  `\\s*(?:de\\s+)?(?:(?:${UNIDADES})(?:inhos?|inhas?|s?)?\\s*)?[\\d½¼¾⅓⅔/.,]+\\s*$`,
  'i',
);

// Plurais irregulares em PT-BR — mapeia plural → singular
const PLURAIS_IRREGULARES: Record<string, string> = {
  'files': 'file',
  'oles': 'ole',
  'paes': 'pao',
  'raizes': 'raiz',
  'alfaces': 'alface',
  'nuzes': 'noz',
  'vozes': 'voz',
  'vezes': 'vez',
  'cruzes': 'cruz',
  'fazes': 'faz',
  'juizes': 'juiz',
  // ões → ão
  'limoes': 'limao',
  'pinhoes': 'pinhao',
  'meloes': 'melao',
  'feijoes': 'feijao',
  'quiabos': 'quiabo',
  'camaroes': 'camarao',
  'caldinhos': 'caldinho',
  // ães → ão
  'alemaes': 'alemao',
  'capitaes': 'capitao',
  // is → il (terminados em 'is' de singular em 'il')
  'funis': 'funil',
  'barris': 'barril',
  'perfis': 'perfil',
  'gentis': 'gentil',
  'cantis': 'cantil',
  // es → e
  'foles': 'fole',
  'roles': 'role',
  'potes': 'pote',
  'dotes': 'dote',
  // Específicos culinários
  'files de peixe': 'file de peixe',
  'files de frango': 'file de frango',
  'costelinhas': 'costelinha',
  'pitangas': 'pitanga',
  'jabuticabas': 'jabuticaba',
};

// "sopa de" no início = colher de sopa de (unidade)
const REGEX_SOPA_CHA = /^(?:(?:de\s+)?(?:sopa|chá|cha|sobremesa|café|cafe)\s+de\s+)/i;

// Estado de preparo ao final — remove adjetivos de forma e variedades
// Applied in a loop until stable (handles chained descriptors like "nanicas bem maduras")
const REGEX_PREPARO = /\s+(?:picadinh[ao]s?|picad[ao]s?|ralad[ao]s?|amassad[ao]s?|cozid[ao]s?|fatiad[ao]s?|cortad[ao]s?|desfiad[ao]s?|moíd[ao]s?|triurad[ao]s?|liquidificad[ao]s?|escorrid[ao]s?|escald[ao]s?|branquead[ao]s?|hidratad[ao]s?|temperad[ao]s?|refogad[ao]s?|fritad[ao]s?|assad[ao]s?|grelhad[ao]s?|ensopd[ao]s?|cozinhar?|em\s+(?:cubos?|cubinhos?|pedacos?|fatias?|tiras?|rodelas?|flocos?|po\b|po\s+fino|calcio)|sem\s+(?:pele|osso|semente|casca)|bem\b|muit[ao]s?|inteir[ao]s?|médi[ao]s?|medi[ao]s?|grande?s?|pequen[ao]s?|madur[ao]s?|fresc[ao]s?|sec[ao]s?|defumad[ao]s?|cru[as]?|nanicas?|prata|cavendish|d.agua|dagua|fitness|diet|light|integral|refinad[ao]s?|peneirad[ao]s?|fin[ao]s?|graud[ao]s?|amarelo?s?|verde?s?|vermelho?s?)(\s|$)/gi;

// Sinônimos regionais — mesma coisa, diferentes nomes por região do Brasil
// Normaliza qualquer variante para o nome canônico
const SINONIMOS_REGIONAIS: Record<string, string> = {
  // Mandioca (nordeste: macaxeira; sudeste/sul: aipim)
  'macaxeira': 'mandioca',
  'aipim': 'mandioca',
  'cassava': 'mandioca',
  'maniva': 'mandioca',
  // Bisteca / Costeleta suína
  'bisteca suina': 'bisteca',
  'bisteca de porco': 'bisteca',
  'chuleta': 'bisteca',
  'chuleta de porco': 'bisteca',
  'costeleta suina': 'bisteca',
  'costelinha de porco': 'costelinha',
  'costelinha suina': 'costelinha',
  'pork chop': 'bisteca',
  // Carne bovina cortes regionais
  'carne de boi': 'carne',
  'carne bovina': 'carne',
  'carne de primeira': 'carne',
  'carne de segunda': 'carne',
  'carne seca': 'carne seca',
  'charque': 'carne seca',
  'jabá': 'carne seca',
  'jaba': 'carne seca',
  'carne de sol': 'carne de sol',
  // Abóbora
  'jerimum': 'abobora',
  'moranga': 'abobora',
  'abobora japonesa': 'abobora',
  'cabotiá': 'abobora',
  'cabotia': 'abobora',
  // Quiabo
  'gombo': 'quiabo',
  // Inhame
  'cará': 'inhame',
  'cara': 'inhame',
  'taro': 'inhame',
  // Linguiça
  'chouriço': 'linguica',
  'chourico': 'linguica',
  'paio': 'linguica',
  'linguica calabresa': 'linguica calabresa',
  // Frutos do mar regionais
  'camarão cinza': 'camarao',
  'camarao rosa': 'camarao',
  'camarao pitu': 'camarao',
  // Banana
  'banana nanica': 'banana',
  'banana prata': 'banana',
  'banana da terra': 'banana da terra',
  'bananada terra': 'banana da terra',
  // Laranja
  'laranja lima': 'laranja',
  'laranja baía': 'laranja',
  // Couve-flor
  'couve flor': 'couve-flor',
  // Pimentão (variantes)
  'capsicum': 'pimentao',
  // Espinafre (nordeste usa ora-pro-nóbis com função similar)
  'ora pro nobis': 'espinafre',
  // Farinha de mandioca
  'farinha d agua': 'farinha de mandioca',
  'farinha seca': 'farinha de mandioca',
  'tapioca granulada': 'tapioca',
  'goma de tapioca': 'tapioca',
  'polvilho': 'polvilho',
  'polvilho doce': 'polvilho doce',
  'polvilho azedo': 'polvilho azedo',
  'amido de mandioca': 'polvilho doce',
  // Dendê
  'azeite de dende': 'azeite de dende',
  'azeite dende': 'azeite de dende',
  'oleo de dende': 'azeite de dende',
  // Pimenta regional
  'pimenta malagueta': 'pimenta malagueta',
  'pimenta de cheiro': 'pimenta de cheiro',
  'pimenta biquinho': 'pimenta biquinho',
  'pimenta dedo de moca': 'pimenta dedo de moca',
  // Feijão variantes
  'feijao carioca': 'feijao',
  'feijao preto': 'feijao preto',
  'feijao branco': 'feijao branco',
  'feijao mulatinho': 'feijao',
  'feijao rajado': 'feijao',
  'feijao de corda': 'feijao de corda',
  'feijao verde': 'feijao de corda',
  'caupi': 'feijao de corda',
  // Grão-de-bico
  'grao de bico': 'grao de bico',
  'grão de bico': 'grao de bico',
  'chickpea': 'grao de bico',
  // Amendoim
  'do amendoim': 'amendoim',
  // Caju
  'caju verde': 'caju',
  'castanha de caju': 'castanha de caju',
  'castanha do para': 'castanha do para',
  'castanha do brasil': 'castanha do para',
  // Maxixe
  'maxixe': 'maxixe',
  // Vinagreira (maranhão)
  'vinagreira': 'hibisco',
  'hibisco': 'hibisco',
};

// Termos expandidos para busca em sites — dado um ingrediente canônico, quais palavras buscar
const TERMOS_BUSCA: Record<string, string[]> = {
  // Suíno
  'bisteca': ['bisteca de porco', 'bisteca suína', 'chuleta de porco', 'costeleta suína'],
  'costelinha': ['costelinha de porco', 'costela suína', 'costelinha assada'],
  'lombo': ['lombo de porco', 'lombo suíno assado'],
  // Bovina
  'carne': ['carne assada', 'bife grelhado', 'carne ao molho'],
  'acem': ['acém bovino', 'carne de acem', 'acém ensopado'],
  'carne seca': ['carne seca refogada', 'carne seca de sol', 'charque'],
  'carne de sol': ['carne de sol', 'carne seca nordestina'],
  // Frango
  'frango': ['frango assado', 'frango grelhado', 'frango ao molho'],
  'peito de frango': ['peito de frango grelhado', 'filé de frango'],
  // Peixe
  'peixe': ['peixe assado', 'peixe grelhado', 'filé de peixe'],
  'sardinha': ['sardinha frita', 'sardinha assada', 'escabeche de sardinha'],
  // Tubérculos
  'mandioca': ['mandioca cozida', 'aipim frito', 'macaxeira assada', 'mandioca ao forno'],
  'batata': ['batata cozida', 'batata assada', 'batata frita'],
  'batata doce': ['batata doce assada', 'batata doce cozida'],
  'inhame': ['inhame cozido', 'inhame assado', 'cará refogado'],
  // Leguminosas
  'grao de bico': ['grão-de-bico cozido', 'salada de grão-de-bico', 'curry de grão-de-bico'],
  'lentilha': ['sopa de lentilha', 'lentilha refogada', 'lentilha com legumes'],
  'feijao preto': ['feijoada', 'feijão preto', 'feijão preto com arroz'],
  // Vegetais
  'brocolis': ['brócolis refogado', 'brócolis no alho', 'brócolis grelhado'],
  'abobrinha': ['abobrinha refogada', 'abobrinha grelhada', 'abobrinha recheada'],
  'abobora': ['abóbora assada', 'sopa de abóbora', 'jerimum cozido', 'abóbora refogada'],
  'berinjela': ['berinjela assada', 'berinjela refogada', 'berinjela à parmegiana'],
  'quiabo': ['quiabo refogado', 'quiabo com frango', 'quiabo ensopado'],
  // Proteínas populares
  'ovo': ['ovo mexido', 'omelete', 'ovo cozido', 'fritada de ovo'],
  'atum': ['atum ao molho', 'salada de atum', 'atum grelhado'],
  // Rucula
  'rucula': ['rúcula com tomate', 'salada de rúcula', 'massa com rúcula'],
  // Amendoim
  'amendoim': ['paçoca de amendoim', 'pé de moleque', 'brigadeiro de amendoim'],
};

// Mapeamento de sinônimos → nome canônico
const SINONIMOS: Record<string, string> = {
  // Alho
  'dente de alho': 'alho',
  'dentes de alho': 'alho',
  'alho amassado': 'alho',
  'alho picado': 'alho',
  // Cebola
  'cebola media': 'cebola',
  'cebola grande': 'cebola',
  'cebola pequena': 'cebola',
  'cebola branca': 'cebola',
  'cebola roxa': 'cebola roxa',
  // Tomate
  'tomate maduro': 'tomate',
  'tomates maduros': 'tomate',
  // Frango
  'peito de frango': 'peito de frango',
  'filé de frango': 'peito de frango',
  'frango em pedaços': 'frango',
  'frango temperado': 'frango',
  // Carne
  'carne bovina': 'carne',
  'carne de boi': 'carne',
  // Ovos
  'ovo inteiro': 'ovo',
  'ovos inteiros': 'ovo',
  // Leite
  'leite integral': 'leite',
  'leite desnatado': 'leite',
  'leite semi': 'leite',
  // Manteiga
  'margarina': 'manteiga',
  // Creme de leite
  'lata de creme': 'creme de leite',
  'caixinha de creme': 'creme de leite',
  'creme de leite fresco': 'creme de leite',
  // Macarrão
  'macarrao espaguete': 'macarrão espaguete',
  'macarrao parafuso': 'macarrão parafuso',
  'massa espaguete': 'macarrão espaguete',
  'pacote de macarrao': 'macarrão',
  // Molho de tomate
  'extrato de tomate': 'extrato de tomate',
  'polpa de tomate': 'molho de tomate',
  'passata de tomate': 'molho de tomate',
  // Tempero verde
  'cheiro verde': 'salsinha e cebolinha',
  'salsinha e cebolinha': 'salsinha e cebolinha',
  'cebolinha e salsinha': 'salsinha e cebolinha',
  'tempero verde': 'salsinha e cebolinha',
  // Caldo
  'cubo de caldo': 'caldo de galinha',
  'tablete de caldo': 'caldo de galinha',
  'caldo de galinha': 'caldo de galinha',
  'caldo de carne': 'caldo de carne',
  'caldo de legumes': 'caldo de legumes',
  // Pimentão
  'pimentao vermelho': 'pimentão vermelho',
  'pimentao verde': 'pimentão verde',
  'pimentao amarelo': 'pimentão amarelo',
  // Batata
  'batata media': 'batata',
  'batata grande': 'batata',
  // Queijo
  'queijo parmesao ralado': 'queijo parmesão',
  'queijo parmesao': 'queijo parmesão',
  'queijo mussarela': 'queijo mussarela',
  'queijo mozzarella': 'queijo mussarela',
  // Farinha
  'farinha de trigo peneirada': 'farinha de trigo',
  // Azeite
  'azeite de oliva': 'azeite de oliva',
  'azeite extravirgem': 'azeite de oliva',
  // Limão
  'suco de limao': 'limão',
  'raspas de limao': 'limão',
};

// Palavras que indicam "a gosto"
const A_GOSTO = /a\s+gosto|quanto\s+baste|\bqb\b|opcional|a\s+gosto|suficiente/i;

// Ingredientes que são sempre "a gosto" por natureza
const SEMPRE_A_GOSTO = new Set([
  'sal', 'pimenta', 'pimenta-do-reino', 'pimenta do reino',
  'azeite', 'oleo', 'vinagre', 'colorau', 'páprica', 'paprica',
  'orégano', 'oregano', 'cominho', 'louro', 'alecrim',
  'salsinha', 'cebolinha', 'coentro', 'hortelã',
]);

// Lixo que não é ingrediente culinário
const NAO_INGREDIENTE = new Set([
  'agua quente', 'agua fria', 'agua', 'gelo',
  'papel aluminio', 'papel manteiga', 'filme plastico',
  'palitos de dente', 'palito',
  'sal grosso',
  // Itens de cozinha, não ingredientes
  'panela', 'frigideira', 'forma', 'assadeira',
  'espatula', 'colher de pau',
  // Produtos industrializados não culinários (nomes de NFCe)
  'sobremesa lactea', 'iogurte liquido', 'bebida lactea',
  'queijo processado', 'requeijao cremoso light',
  'margarina vegetal', 'creme vegetal',
]);

// Padrões que indicam "isso não é ingrediente" (NFCe / código de produto)
// Ex: "Sobrem Lact Batavo C/2", "Bisct Recheado", "Suco Cxinha Pet"
const REGEX_NAO_CULINARIO = [
  /\bc\/\d/i,              // C/2, C/6 (sigla de "com X unidades")
  /\blact\b/i,             // abreviação de "lácteo/lactea" em nome NCF
  /\bbisct\b/i,            // biscoito abreviado
  /\bsob\s+\w{2,4}\b/i,   // "Sob Lact" (Sobremesa Láctea abrev.)
  /^[A-Z][a-z]{0,3}\s+[A-Z][a-z]{0,3}/,  // padrão "Abrev Abrev" (NFCe)
];

@Injectable()
export class IngredientNormalizerService {

  /**
   * Normaliza texto bruto de ingrediente → nome canônico limpo.
   * Ex: "2 dentes de alho amassado" → "alho"
   * Ex: "1 lata de creme de leite" → "creme de leite"
   */
  normalizar(textoRaw: string): IngredienteNormalizado | null {
    const aGosto = A_GOSTO.test(textoRaw);

    let texto = textoRaw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')  // remove acentos para processamento
      .replace(/\(.*?\)/g, '')           // remove parênteses
      .replace(/[,;]/g, ' ')             // commas/semicolons → space (handles "grandes, sem pele")
      .replace(/\s+com\s+.*$/, '')       // remove "com cebola e alho" and everything after
      .replace(/a\s+gosto|quanto\s+baste|\bqb\b|opcional/gi, '')
      .trim();

    // Remove quantidade numérica inicial
    texto = texto.replace(REGEX_QUANTIDADE, '');

    // Remove "sopa de" / "chá de" que ficaram após remover número
    texto = texto.replace(REGEX_SOPA_CHA, '');

    // Remove "de " inicial residual
    texto = texto.replace(/^de\s+/, '');

    // Remove adjetivos de preparo ao final — loop until stable (handles chained: "nanicas bem maduras")
    let prev = '';
    while (prev !== texto) {
      prev = texto;
      texto = texto.replace(REGEX_PREPARO, ' ').trim();
    }

    // Remove quantidade numérica no FINAL (ex: "biscoito 200g", "queijo 1/2 kg")
    texto = texto.replace(REGEX_QUANTIDADE_FIM, '').trim();

    // Limpa espaços duplos
    texto = texto.replace(/\s{2,}/g, ' ').trim();

    // Plurais irregulares PT-BR antes da singularização padrão
    const textoIrregular = PLURAIS_IRREGULARES[texto];
    if (textoIrregular) {
      texto = textoIrregular;
    } else {
      // Singularize common Portuguese food plurals (bananas→banana, tomates→tomate, ovos→ovo)
      // Only last word, only if ends in vowel+s (safe: arroz ends in 'z', not 's')
      texto = texto.replace(/\b(\w+[aeiou])s\b$/i, '$1');
    }

    if (!texto || texto.length < 2) return null;
    if (NAO_INGREDIENTE.has(texto)) return null;

    // Descarta se parece código de produto (NFCe, abreviações industriais)
    if (REGEX_NAO_CULINARIO.some((r) => r.test(textoRaw))) return null;

    // Descarta fragmentos: começa com conjunção, preposição isolada, ou contém dígito residual
    if (/^(?:e|ou|de|do|da|dos|das|em|no|na|nos|nas|com|para|por)\s/i.test(texto)) return null;
    if (/\d/.test(texto)) return null;

    // Trunca em 4 palavras (nome do ingrediente não precisa ser mais longo)
    const nomeBase = texto.split(/\s+/).slice(0, 4).join(' ');

    // Verifica sinônimos regionais primeiro, depois sinonimos gerais
    const nomeCanônico = SINONIMOS_REGIONAIS[nomeBase] ?? SINONIMOS[nomeBase] ?? this.restaurarAcentos(nomeBase);

    // Verifica se é sempre a gosto
    const ehAGosto = aGosto || SEMPRE_A_GOSTO.has(nomeCanônico.split(' ')[0]);

    return { nomeCanônico, aGosto: ehAGosto };
  }

  /**
   * Extrai lista de chaves de busca de uma lista de ingredientes brutos.
   * Usado em ReceitaBancoService.extrairChaves().
   */
  extrairChaves(ingredientesRaw: string[]): string[] {
    const chaves = new Set<string>();
    for (const raw of ingredientesRaw) {
      const norm = this.normalizar(raw);
      if (norm && !norm.aGosto) {
        chaves.add(norm.nomeCanônico);
      }
    }
    return [...chaves].sort();
  }

  /**
   * Dado um ingrediente (qualquer forma, incluindo regional), retorna os termos
   * mais relevantes para buscar receitas em sites externos.
   * Ex: "bisteca suína" → ["bisteca de porco", "bisteca suína", "chuleta de porco", "costeleta suína"]
   * Ex: "macaxeira" → ["mandioca cozida", "aipim frito", "macaxeira assada", "mandioca ao forno"]
   */
  termosParaBusca(ingrediente: string): string[] {
    const norm = this.normalizar(ingrediente);
    const canonical = norm?.nomeCanônico ?? ingrediente.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

    // Busca termos pelo canônico
    const termos = TERMOS_BUSCA[canonical];
    if (termos?.length) return [canonical, ...termos];

    // Fallback: tenta match parcial nas chaves de TERMOS_BUSCA
    for (const [chave, expansao] of Object.entries(TERMOS_BUSCA)) {
      if (canonical.includes(chave) || chave.includes(canonical)) {
        return [canonical, ...expansao];
      }
    }

    // Sem expansão: busca apenas pelo nome canônico
    return [canonical];
  }

  /**
   * Normaliza lista do inventário do usuário para matching.
   * "Peito de Frango" → "peito de frango"
   */
  normalizarInventario(nomes: string[]): string[] {
    return nomes.map(n => {
      const norm = this.normalizar(n);
      return norm ? norm.nomeCanônico : n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    }).filter(Boolean);
  }

  // Restaura acentos comuns do português após normalização
  private restaurarAcentos(texto: string): string {
    const mapa: Record<string, string> = {
      'macarrao': 'macarrão',
      'feijao': 'feijão',
      'cao': 'cão',
      'maionese': 'maionese',
      'pimenta-do-reino': 'pimenta-do-reino',
      'abobrinha': 'abobrinha',
      'oregano': 'orégano',
      'paprica': 'páprica',
      'acucar': 'açúcar',
      'manteiga': 'manteiga',
      'mandioca': 'mandioca',
      'cenoura': 'cenoura',
      'cebola': 'cebola',
      'batata': 'batata',
    };
    // Tenta encontrar palavra-chave para restaurar acento mais comum
    for (const [sem, com] of Object.entries(mapa)) {
      if (texto === sem || texto.startsWith(sem + ' ')) {
        return texto.replace(sem, com);
      }
    }
    return texto;
  }
}
