/**
 * Camada 1 + 1.5 do PLANO_PRECISAO_ENGINE.md — núcleo + especificador.
 *
 * Problema que resolve: "QUEIJO PROVOLONE" virava só "queijo" (perdia a
 * variedade); "FILE MERLUZA" virava só "filé" (perdia o peixe). Cadastrar
 * cada combinação à mão não escala (buraco sem fundo, §2 do plano).
 *
 * A virada: em vez de listar "queijo provolone", "queijo prato", "queijo
 * mussarela"... como entradas independentes, cadastramos o NÚCLEO ("queijo")
 * uma vez com a lista de ESPECIFICADORES válidos (provolone, prato, mussarela,
 * minas frescal...) e uma regra de composição (conector). Isso transforma
 * "cadastrar N compostos" em "reconhecer 1 padrão estrutural" — a Camada 1.5
 * (as próprias listas abaixo) é gerada consultando categorias completas
 * (queijos do varejo BR, cortes de peixe, cortes de carne) em vez de esperar
 * cada produto aparecer um a um.
 *
 * Guard-rails aplicados (ver PLANO_PRECISAO_ENGINE.md §11), e o que a primeira
 * rodada contra o golden set (255→238) ensinou sobre cada um:
 *
 *  A1  — especificador pode aparecer SEM o núcleo no texto do cupom
 *        ("PROVOLONE 200G" sem a palavra QUEIJO) → resolve pelo especificador.
 *        LIÇÃO: a permissão tem que ser POR ITEM, não por grupo inteiro.
 *        "provolone" é inequívoco; "prato" (do mesmo grupo QUEIJOS) NÃO é —
 *        "ARROZ PRATO FINO" tem "prato" sem ter nada a ver com queijo. Um
 *        especificador só pode dispensar o núcleo se ele próprio, sozinho,
 *        não tiver outro sentido comum em português de supermercado.
 *  A2  — a lista de especificadores é consultada ANTES de qualquer limpeza de
 *        marca/embalagem — "SALADA" (variedade de tomate) e "VERDE" (variedade
 *        de chá) não são descartados como ruído se estiverem cadastrados como
 *        especificador daquele núcleo. Mas por serem ambíguos, exigem o
 *        núcleo presente (não entram em permiteSemNucleo).
 *  A4  — matching por PREFIXO: o cupom trunca ("PROVOL", "MUSS", "PARM").
 *        LIÇÃO: prefixo de 4 chars colide fácil ("colo" pega colorau E
 *        colonial; "ling" pega linguiça E linguado). O matching por prefixo
 *        só é seguro DENTRO do mesmo núcleo (com o núcleo confirmado no
 *        texto) — nunca em modo permiteSemNucleo, onde a ambiguidade cross-
 *        categoria é inaceitável. validarPrefixosUnicos() barra colisão
 *        dentro do próprio grupo em teste.
 *  A5  — conector por GRUPO de especificador, não por núcleo inteiro: "queijo"
 *        nunca usa "de" (queijo provolone); peixes usam "de" (filé de
 *        merluza); cortes bovinos/suínos não usam "de" (filé mignon).
 *  A10 — especificador multi-palavra é uma unidade no dicionário ("minas
 *        frescal"), nunca esperamos que "minas" e "frescal" combinem sozinhos.
 *  A11 — este mecanismo roda ANTES do dicionário genérico de abreviações no
 *        pipeline (ver ocr-alias.service.ts) — senão o prefix-match de 1 token
 *        do dicionário responde primeiro e engole o especificador.
 *
 * Nunca inventa: se o texto não casa com nenhum especificador cadastrado,
 * devolve só o núcleo — confiança honesta em vez de composto forjado.
 */

export interface Especificador {
  /** Forma sem acento, como comparada no texto (ex: 'provolone', 'minas frescal'). */
  chave: string;
  /**
   * A1: permite resolver SEM o núcleo aparecer no texto ("PROVOLONE 200G" sem
   * "QUEIJO"). Só true para termos inequívocos — nomes próprios de produto
   * que não têm outro significado comum em cupom de supermercado. Todo item
   * ambíguo (mesmo que pareça óbvio) deve ficar false: é o modo seguro.
   */
  semNucleo: boolean;
  /**
   * A4: permite casar por PREFIXO truncado (mín. 4 chars) quando o núcleo
   * já foi confirmado no texto. Nunca combinado com semNucleo=true (a
   * ambiguidade de prefixo cross-categoria não é aceitável sem o núcleo
   * como âncora). Desligado por padrão para itens curtos ou com prefixo
   * arriscado — ver validarPrefixosUnicos.
   */
  prefixo: boolean;
}

export interface GrupoEspecificador {
  /** Conector entre núcleo e especificador: "" (queijo provolone) ou "de" (filé de merluza). */
  conector: '' | 'de';
  itens: Especificador[];
}

export interface NucleoComEspecificador {
  /** Como o núcleo aparece no texto (regex, já sem acento). */
  padraoNucleo: RegExp;
  /** Nome canônico do núcleo puro, usado quando nenhum especificador casa. */
  nomeNucleo: string;
  grupos: GrupoEspecificador[];
  /**
   * A1 tem um limite: um especificador "inequívoco" (ex: mussarela) deixa de
   * sê-lo quando outro produto o usa como SABOR/recheio ("PIZZA MUSSARELA").
   * Se qualquer um destes padrões aparecer no texto, o modo semNucleo é
   * desligado para este núcleo — exige a palavra do núcleo confirmada.
   */
  bloqueiaSemNucleoSe?: RegExp[];
}

function esp(
  chave: string,
  opts: Partial<Pick<Especificador, 'semNucleo' | 'prefixo'>> = {},
): Especificador {
  return {
    chave,
    semNucleo: opts.semNucleo ?? false,
    prefixo: opts.prefixo ?? false,
  };
}

// ── Queijos do varejo brasileiro (Camada 1.5: lista gerada, revisada uma vez) ─
// "prato", "reino", "lanche" NÃO são semNucleo: têm outro sentido comum
// (prato de comida, pimenta do reino, lanche/refeição) — só resolvem como
// queijo com a palavra "queijo" confirmada no texto.
const QUEIJOS: GrupoEspecificador = {
  conector: '',
  itens: [
    esp('provolone', { semNucleo: true, prefixo: true }),
    esp('mussarela', { semNucleo: true, prefixo: true }),
    esp('muzzarela', { semNucleo: true, prefixo: true }),
    esp('prato', { prefixo: true }),
    esp('coalho', { semNucleo: true, prefixo: true }),
    esp('minas frescal'),
    esp('minas padrao'),
    esp('minas curado'),
    esp('parmesao', { semNucleo: true }), // "PARM RALADO" sem "queijo" deve resolver sozinho
    esp('parmesao ralado', { semNucleo: true }),
    esp('gorgonzola', { semNucleo: true, prefixo: true }),
    esp('brie', { semNucleo: true }),
    esp('gouda', { semNucleo: true }),
    esp('cheddar', { semNucleo: true, prefixo: true }),
    esp('reino'), // "pimenta do reino" — nunca sem núcleo
    esp('colonial', { prefixo: true }),
    esp('canastra', { semNucleo: true }),
    esp('meia cura'),
    esp('estepe'),
    esp('tilsit', { semNucleo: true }),
    esp('lanche'), // ambíguo com "lanche" refeição
    esp('quartirolo', { semNucleo: true }),
    esp('catupiry', { semNucleo: true, prefixo: true }),
    esp('roquefort', { semNucleo: true }),
    esp('emmental', { semNucleo: true }),
    esp('edam', { semNucleo: true }),
    esp('camembert', { semNucleo: true }),
  ],
};

// Cream cheese, ricota são canônicos PRÓPRIOS no CookMe (o golden espera
// "ricota"/"cream cheese" sozinhos, não "queijo ricota") — ficam fora do
// grupo QUEIJOS de propósito; resolvidos pelo OCR_MAPA existente.

// ── Cortes de peixe (Camada 1.5) — sempre "filé DE peixe" ────────────────────
// "sardinha" e "salmão" são canônicos próprios no golden (não "filé de X")
// quando aparecem sozinhos — só compõem com "filé de" quando a palavra
// "filé"/"file" está confirmada no texto (semNucleo=false para ambos).
const PEIXES: GrupoEspecificador = {
  conector: 'de',
  itens: [
    esp('merluza', { semNucleo: true, prefixo: true }),
    esp('tilapia', { semNucleo: true, prefixo: true }),
    esp('salmao', { prefixo: true }),
    esp('pescada', { prefixo: true }),
    esp('cacao', { semNucleo: true }),
    esp('bacalhau', { semNucleo: true, prefixo: true }),
    esp('sardinha', { prefixo: true }),
    esp('corvina', { semNucleo: true }),
    esp('pintado', { semNucleo: true }),
    esp('dourado'), // ambíguo (cor/fruta) sem contexto de peixe
    esp('namorado', { semNucleo: true }),
    esp('linguado'), // prefixo "ling" colide com linguiça — nunca prefixo
    esp('panga', { semNucleo: true }),
    esp('robalo', { semNucleo: true }),
    esp('badejo', { semNucleo: true }),
    esp('garoupa', { semNucleo: true }),
    esp('anchova', { semNucleo: true }),
    esp('peixe branco'),
  ],
};

// ── Cortes bovinos/suínos usados após "filé" (sem "de" — nome próprio do corte) ─
const CORTES_FILE: GrupoEspecificador = {
  conector: '',
  itens: [
    esp('mignon', { semNucleo: true, prefixo: true }),
    esp('de costela'),
    esp('suino'),
    // "peito" fica de fora de propósito: "FILE PEITO DE FRANGO" já é resolvido
    // corretamente pelo COMPOSTOS_PRIORITARIOS/OCR_MAPA existentes como
    // "peito de frango" — se entrasse aqui, "filé peito" venceria antes e
    // perderia o frango (bug real encontrado ao rodar contra o golden set).
  ],
};

// ── Variedades de tomate (A2: "salada" não é ruído aqui) — sempre exige núcleo
const VARIEDADES_TOMATE: GrupoEspecificador = {
  conector: '',
  itens: [
    esp('salada'),
    esp('italiano'),
    esp('cereja'),
    esp('debora'),
    esp('heirloom', { semNucleo: true }),
    esp('grape'),
  ],
};

// ── Variedades de chá (A2: "verde" não é cor aqui, é o produto) — exige núcleo
const VARIEDADES_CHA: GrupoEspecificador = {
  conector: '',
  itens: [
    esp('verde'),
    esp('preto'),
    esp('branco'),
    esp('mate'),
    esp('camomila', { semNucleo: true }),
    esp('hortela'),
    esp('erva doce'),
    esp('capim cidreira'),
  ],
};

export const NUCLEOS_COM_ESPECIFICADOR: NucleoComEspecificador[] = [
  {
    padraoNucleo: /\bqueijo\b/,
    nomeNucleo: 'queijo',
    grupos: [QUEIJOS],
    // "PIZZA MUSSARELA", "PAO DE QUEIJO" etc: mussarela vira sabor/recheio de
    // outro produto, não o núcleo "queijo" — sem a palavra queijo, não resolve.
    bloqueiaSemNucleoSe: [
      /\bpizza\b/,
      /\bpao\b/,
      /\bsanduiche\b/,
      /\bmacarrao\b/,
      /\blasanha\b/,
    ],
  },
  {
    padraoNucleo: /\bfile\b/,
    nomeNucleo: 'filé',
    grupos: [PEIXES, CORTES_FILE],
  },
  {
    padraoNucleo: /\btomate\b/,
    nomeNucleo: 'tomate',
    grupos: [VARIEDADES_TOMATE],
  },
  { padraoNucleo: /\bcha\b/, nomeNucleo: 'chá', grupos: [VARIEDADES_CHA] },
];

/** Prefixo mínimo pra matching truncado (A4) — abaixo disso, risco de ambiguidade. */
const PREFIXO_MINIMO = 4;

/** Restaura os acentos comuns dos especificadores cadastrados (dicionário sabe a grafia certa). */
function comAcento(especificadorSemAcento: string): string {
  const MAPA: Record<string, string> = {
    parmesao: 'parmesão',
    'parmesao ralado': 'parmesão ralado',
    'minas padrao': 'minas padrão',
    cacao: 'cação',
    tilapia: 'tilápia',
    salmao: 'salmão',
    suino: 'suíno',
    hortela: 'hortelã',
  };
  return MAPA[especificadorSemAcento] ?? especificadorSemAcento;
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tenta casar especificadores dentro de um texto. `permitirApenasSemNucleo`
 * restringe a busca aos itens marcados semNucleo=true (modo A1, sem âncora
 * do núcleo no texto — mais arriscado, só para termos inequívocos). Com o
 * núcleo confirmado, todos os itens do grupo entram na disputa, e o matching
 * por prefixo (A4) só se aplica aos marcados prefixo=true.
 */
function casarEspecificador(
  texto: string,
  itens: Especificador[],
  permitirApenasSemNucleo: boolean,
): string | null {
  const candidatos = permitirApenasSemNucleo
    ? itens.filter((i) => i.semNucleo)
    : itens;
  // mais longo primeiro: evita que um prefixo curto case antes do mais
  // específico ("minas frescal" antes de qualquer coisa que comece "minas")
  const ordenados = [...candidatos].sort(
    (a, b) => b.chave.length - a.chave.length,
  );

  for (const item of ordenados) {
    const escapado = escaparRegex(item.chave);
    if (new RegExp(`\\b${escapado}\\b`).test(texto)) return item.chave;
  }
  // segunda passada: só prefixo, e só quando NÃO estamos em modo semNucleo
  // (prefixo sem âncora do núcleo é ambiguidade demais entre categorias)
  if (!permitirApenasSemNucleo) {
    for (const item of ordenados) {
      if (!item.prefixo || item.chave.includes(' ')) continue;
      const prefixo = escaparRegex(item.chave.slice(0, PREFIXO_MINIMO));
      if (new RegExp(`\\b${prefixo}\\w*\\b`).test(texto)) return item.chave;
    }
  }
  return null;
}

/**
 * Resolve núcleo + especificador a partir do texto (já sem acento, minúsculo).
 * Retorna null se o texto não contém nenhum núcleo cadastrado — segue o
 * pipeline normal (dicionário, OCR_MAPA etc).
 *
 * Se o núcleo aparece mas nenhum especificador casa: devolve só o núcleo
 * (confiança honesta — nunca inventa, guard-rail do plano).
 * Se um especificador semNucleo=true casa e o núcleo NÃO aparece no texto
 * (A1): ainda resolve, compondo núcleo+especificador — caso do PDV que omite
 * a palavra do núcleo (ex: "PROVOLONE 200G" sem "QUEIJO").
 */
/**
 * Casos onde o "especificador" vem ANTES do núcleo e forma um nome de corte
 * próprio, não uma composição núcleo+especificador ("contra filé" é um corte
 * inteiro, não "filé" + especificador "contra"). Checados antes da busca
 * genérica por núcleo para não perder a palavra que vem na frente.
 */
const PREFIXOS_DE_CORTE: Array<[RegExp, string]> = [
  [/\bcontra\s*.{0,4}\bfile\b/, 'contra filé'],
];

/**
 * Resolve núcleo + especificador quando há CERTEZA de composição (achou o
 * especificador). Retorna null quando não há composição segura — mesmo que o
 * núcleo apareça no texto — para não roubar a vez de regras mais específicas
 * do pipeline (dicionário/OCR_MAPA) que ainda não rodaram (A11: bug real
 * encontrado — "EXTR TOMATE" perdia para o núcleo "tomate" puro, quando o
 * dicionário de abreviações resolveria "extrato de tomate" corretamente).
 * Use resolverApenasNucleo() como fallback de última instância, depois que
 * o resto do pipeline (dicionário, kb, fuzzy, OCR_MAPA, normalizer) falhar.
 */
export function resolverNucleoEspecificador(
  textoOriginalSemAcento: string,
): { canonical: string; especificador: string; nucleo: string } | null {
  const texto = textoOriginalSemAcento;

  for (const [regex, canonical] of PREFIXOS_DE_CORTE) {
    if (regex.test(texto))
      return { canonical, especificador: canonical, nucleo: canonical };
  }

  for (const config of NUCLEOS_COM_ESPECIFICADOR) {
    const nucleoPresente = config.padraoNucleo.test(texto);
    const bloqueado =
      config.bloqueiaSemNucleoSe?.some((re) => re.test(texto)) ?? false;

    if (!nucleoPresente) {
      if (bloqueado) continue; // ex: "PIZZA MUSSARELA" — mussarela é sabor, não queijo sozinho
      // Sem o núcleo: só tenta especificadores inequívocos (semNucleo=true),
      // sem matching por prefixo (ambiguidade cross-categoria inaceitável).
      for (const grupo of config.grupos) {
        const achado = casarEspecificador(texto, grupo.itens, true);
        if (achado) return montarComposto(config, grupo, achado);
      }
      continue;
    }

    // Núcleo confirmado no texto: todos os especificadores do grupo entram
    // na disputa, incluindo os que exigem o núcleo (prato, reino, salada...)
    // e o matching por prefixo dos marcados prefixo=true.
    for (const grupo of config.grupos) {
      const achado = casarEspecificador(texto, grupo.itens, false);
      if (achado) return montarComposto(config, grupo, achado);
    }
    // Núcleo presente mas nenhum especificador casou: NÃO devolve aqui — deixa
    // o pipeline tentar dicionário/OCR_MAPA primeiro. Ver resolverApenasNucleo.
  }

  return null;
}

function montarComposto(
  config: NucleoComEspecificador,
  grupo: GrupoEspecificador,
  achado: string,
): { canonical: string; especificador: string; nucleo: string } {
  const espComAcento = comAcento(achado);
  const canonical =
    grupo.conector === 'de'
      ? `${config.nomeNucleo} de ${espComAcento}`
      : `${config.nomeNucleo} ${espComAcento}`;
  return { canonical, especificador: espComAcento, nucleo: config.nomeNucleo };
}

/**
 * Fallback fraco: se o texto tem um núcleo cadastrado mas nenhum
 * especificador casou, devolve o núcleo puro. Só deve ser chamado depois que
 * TODO o resto do pipeline (dicionário, kb, fuzzy, OCR_MAPA, normalizer) já
 * falhou — é mais honesto que o fallback genérico de "primeiras palavras",
 * mas menos específico que qualquer regra dedicada que já exista.
 */
export function resolverApenasNucleo(
  textoOriginalSemAcento: string,
): string | null {
  for (const config of NUCLEOS_COM_ESPECIFICADOR) {
    if (config.padraoNucleo.test(textoOriginalSemAcento))
      return config.nomeNucleo;
  }
  return null;
}

/**
 * Valida que nenhum prefixo de PREFIXO_MINIMO chars colide entre dois
 * especificadores marcados prefixo=true do MESMO grupo — se colidir, o
 * truncamento do cupom (A4) fica ambíguo dentro da própria categoria.
 * Chamada em teste — checagem de qualidade do dicionário, não roda em runtime.
 */
export function validarPrefixosUnicos(): string[] {
  const problemas: string[] = [];
  for (const config of NUCLEOS_COM_ESPECIFICADOR) {
    for (const grupo of config.grupos) {
      const candidatos = grupo.itens.filter(
        (i) => i.prefixo && !i.chave.includes(' '),
      );
      const prefixos = new Map<string, string>();
      for (const item of candidatos) {
        const prefixo = item.chave.slice(0, PREFIXO_MINIMO);
        if (prefixos.has(prefixo) && prefixos.get(prefixo) !== item.chave) {
          problemas.push(
            `Núcleo "${config.nomeNucleo}": prefixo "${prefixo}" ambíguo entre "${prefixos.get(prefixo)}" e "${item.chave}"`,
          );
        }
        prefixos.set(prefixo, item.chave);
      }
    }
  }
  return problemas;
}
