/**
 * GUARD CENTRAL: "isto pode entrar na despensa?"
 *
 * A despensa é o coração do CookMe — só INGREDIENTES DE RECEITA entram.
 * Este é o único lugar do código que decide, por nome, o que é não-ingrediente
 * (limpeza, higiene, descartáveis, pet, utilidades). Antes existiam três
 * regexes divergentes (compras OCR, validação, e o caminho QR sem nenhum) —
 * sabonete/lustra-móveis vazavam para a despensa quando a classificação IA
 * (assíncrona, dependente de quota do Gemini) não respondia.
 *
 * Regras de design:
 * - Determinístico e síncrono: NUNCA depende de IA ou de rede.
 * - Padrões compostos para evitar falso positivo: 'prato descartavel' (nunca
 *   '\bprato\b' — queijo prato!), 'agua sanit' (nunca 'agua'), 'papel manteiga'
 *   (nunca 'manteiga').
 * - Em dúvida, NÃO bloqueia — a classificação IA (camada 3) decide depois e a
 *   limpeza retroativa remove do inventário.
 * - Todo padrão novo nasce com caso de teste em nao-ingrediente.guard.spec.ts.
 */

const PADROES_NAO_INGREDIENTE: RegExp[] = [
  // ── Limpeza doméstica ──────────────────────────────────────────────────────
  /\b(agua\s+sanit|sanitaria|desinfetante|desinf\b|cloro\b|multiuso|limpador|limpa\s+\w+|lustra\s*\w*|polidor|removedor|tira\s*manchas?|alvejante|detergente|deterg\b|amaciante|amac\b|saponaceo|desengordurante|desengord)/,
  /\b(sabao|sab\s+(po|barra|liq|coco|glic))/,
  /\b(esponja|bombril|palha\s+de\s+aco|la\s+de\s+aco|fibra\s+limp)/,
  /\b(inseticida|raticida|repelente|naftalina|pedra\s+sanit|desodorizador|purificador\s+de\s+ar|mata\s+(mosca|barata|formiga))/,
  // Álcool de limpeza — exceto vinagre de álcool (culinário)
  /^(?!.*vinagre).*\balcool\b/,
  /\b(vassoura|rodo\b|balde|bacia|pano\s+(de\s+prato|de\s+chao|multiuso|limpeza)|flanela|luva\s+(borracha|latex|limpeza|descartavel))/,
  /\b(cera\s+(liquida|pasta|incolor|vermelha|auto)|lava\s+(auto|roupas?|loucas?))/,

  // ── Higiene pessoal / farmácia ─────────────────────────────────────────────
  /\b(sabonete|shampoo|xampu|condicionador|cond\s+cap|creme\s+(dental|de\s+barbear|trat|hidrat|corp)|pasta\s+de\s+dente|gel\s+dental|enxaguante|fio\s+dental|cotonete|hastes\s+flex|absorvente|absorv\b|protetor\s+(diario|solar)|fralda|lenco\s+umedecido|lencos\s+umedecidos)/,
  /\b(desodorante|desod\b|antitranspirante|barbeador|gilete|lamina\s+de\s+barbear|aparelho\s+de\s+barbear|perfume|colonia|esmalte|acetona|batom|rimel|maquiagem|delineador|base\s+facial)/,
  /\b(curativo|band\s*aid|gaze\b|esparadrapo|algodao\b|termometro|dipirona|paracetamol|ibuprofeno|dorflex|neosaldina|buscopan|vitamina\s+c\s+efervescente)/,
  /\b(papel\s+hig|pap\s+hig|escova\s+(dental|de\s+dente|cabelo)|esc\s+dent)/,

  // ── Descartáveis / papelaria / utilidades ──────────────────────────────────
  /\b(papel\s+(toalha|aluminio|alum|film|manteiga|sulfite)|pap\s+(toalha|alum)|guardanapo|filme\s+(pvc|plastico)|plastico\s+filme)/,
  /\b(copo\s+descart|prato\s+descart|talher\s+descart|canudo|marmitex\s+vazia?|forma\s+de\s+aluminio|bandeja\s+isopor|isopor\b)/,
  /\b(saco\s+(de\s+)?lixo|saco\s+(freezer|microfreez\w*|geladeira)|sacola|embalagem\b)/,
  /\b(palito\s+(de\s+)?(dente|fosforo|churrasco)|fosforo|velas?\b|acendedor|isqueiro|carvao)/,
  /\b(pilhas?\b|baterias?\b|lampada|extensao\s+eletrica|fita\s+(isolante|adesiva|crepe)|durex\b|cola\s+(branca|bastao|quente)|caneta|caderno)/,

  // ── Pet ────────────────────────────────────────────────────────────────────
  /\b(racao|bifinho|petisco\s+(caes|cao|gato|pet)|areia\s+(higienica|de\s+gato)|pet\s+food|osso\s+(caes|cao)|tapete\s+higienico)/,

  // ── Vestuário / casa ───────────────────────────────────────────────────────
  /\b(meias?\b|cuecas?\b|calcinha|chinelo|touca\s+descart|avental|pano\s+de\s+prato)/,

  // ── Abreviações curtas de cupom (formas truncadas reais de NFC-e) ──────────
  // Cupom fiscal trunca agressivamente: 'ESC COLGATE', 'ESP SCOTCH', 'LIMP MR
  // MUSCULO', 'KIT HIDR NIVEA'. Palavras isoladas de 3-4 letras são seguras
  // com \b...\b (não casam 'escarola', 'espinafre', 'limpeza' etc).
  /^sab\b/,
  /\bdet\b/,
  /\b(cond\s+cap|cr\s+(trat|hidrat|corp)|trat\s+cap)/,
  /\besc\b/,          // ESC COLGATE (escova)
  /\bescova\b/,       // escova de dentes/cabelo/roupa — nunca alimento
  /\besp\b/,          // ESP SCOTCH BRITE (esponja)
  /\blimp\b/,         // LIMP MR MUSCULO (limpador)
  /\bhidr\b/,         // KIT HIDR NIVEA (hidratante)

  // ── Utensílios / acessórios de cozinha (não são ingredientes) ──────────────
  /\b(filtro\s+(de\s+)?papel|filtro\s+cafe|coador)\b/,
  /\b(afiador|amolador|abridor\s+de\s+(lata|garrafa)|descascador|ralador\b|assadeira|frigideira|panela\b|tabua\s+de\s+(carne|corte))/,

  // ── Pet (formas de cupom: 'BISC BWAW CAES', 'RACAO P/ GATOS') ─────────────
  // ATENÇÃO: nunca usar \bpet\b isolado — "COCA COLA PET 2L" é garrafa PET
  /\b(caes|p\/\s*caes|para\s+caes|gatos\b|pet\s+food)/,

  // ── Marcas exclusivas de higiene/limpeza (nunca vendem alimento) ───────────
  /\b(nivea|colgate|oral\s*b|rexona|protex|palmolive|sanol|veja\b|cif\b|omo\b|comfort\b|downy|vanish|qboa|pinho\s+sol|mr\s+musculo)\b/,
];

/** Normaliza para matching: minúsculas, sem acento, espaços colapsados. */
function normalizar(nome: string): string {
  return (nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * true = NÃO é ingrediente de receita → não pode entrar na despensa.
 * Determinístico; em dúvida retorna false (IA decide depois).
 */
export function ehNaoIngrediente(nome: string): boolean {
  const n = normalizar(nome);
  if (!n) return false;
  return PADROES_NAO_INGREDIENTE.some((re) => re.test(n));
}

/** Filtra uma lista de nomes, separando ingredientes de não-ingredientes. */
export function separarNaoIngredientes<T>(
  itens: T[],
  getNome: (item: T) => string,
): { ingredientes: T[]; naoIngredientes: T[] } {
  const ingredientes: T[] = [];
  const naoIngredientes: T[] = [];
  for (const item of itens) {
    (ehNaoIngrediente(getNome(item)) ? naoIngredientes : ingredientes).push(item);
  }
  return { ingredientes, naoIngredientes };
}
