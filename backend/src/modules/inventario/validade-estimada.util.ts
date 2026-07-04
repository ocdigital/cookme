/**
 * Validade estimada por categoria de alimento (Fase 7.1 do PLANO_CORRECOES.md).
 * Cupom fiscal não traz validade e ninguém digita item a item — a estimativa
 * automática é o que torna o loop anti-desperdício visível sem esforço.
 * Prioridade: validade manual/escaneada > validade_padrao_dias do produto >
 * heurística por nome > default conservador.
 */
const REGRAS_VALIDADE: Array<[RegExp, number]> = [
  // Alta perecibilidade
  [/\b(alface|rucula|agriao|espinafre|couve|cheiro.verde|salsinha|cebolinha|coentro|folha)\b/i, 5],
  [/\b(peixe|tilapia|salmao|merluza|camarao|frutos do mar)\b/i, 2],
  [/\b(frango|carne|picanha|patinho|acem|alcatra|costela|lombo|pernil|linguica|moida|bife|file|sobrecoxa|coxa|peito)\b/i, 3],
  [/\b(leite fresco|leite pasteurizado|nata|creme fresco)\b/i, 5],
  // Laticínios ANTES das frutas — "iogurte morango" é iogurte, morango é sabor
  [/\b(leite|iogurte|requeijao|coalhada|ricota|queijo fresco|minas)\b/i, 7],
  [/\b(morango|framboesa|amora|uva|mamao|banana|abacate)\b/i, 5],
  [/\b(pao|paes|bisnaguinha|pao de forma|frances)\b/i, 5],
  // Média
  [/\b(tomate|pepino|abobrinha|berinjela|pimentao|brocolis|couve.flor|fruta|laranja|limao|maca)\b/i, 7],
  [/\b(ovo|ovos)\b/i, 30],
  [/\b(queijo|mussarela|parmesao|prato|provolone)\b/i, 15],
  [/\b(manteiga|margarina|cream cheese)\b/i, 30],
  [/\b(cenoura|beterraba|batata|cebola|alho|mandioca|abobora|inhame|chuchu)\b/i, 21],
  [/\b(presunto|mortadela|salame|peito de peru|frios)\b/i, 7],
  [/\b(bacon|calabresa|defumad)\b/i, 15],
  // Congelados
  [/\b(congelad\w*|freezer)/i, 90],
  // Longa duração
  [/\b(arroz|feijao|lentilha|grao.de.bico|macarrao|massa|farinha|fuba|aveia|acucar|sal|milho de pipoca)\b/i, 365],
  [/\b(enlatad|lata|conserva|atum|sardinha|milho verde|ervilha|molho de tomate|extrato)\b/i, 365],
  [/\b(oleo|azeite|vinagre|ketchup|mostarda|maionese|shoyu)\b/i, 180],
  [/\b(cafe|cha|achocolatado|leite em po|leite condensado|creme de leite)\b/i, 180],
  [/\b(tempero|oregano|pimenta|cominho|colorau|canela|especiaria)\b/i, 180],
  [/\b(biscoito|bolacha|torrada|cereal|granola|barra)\b/i, 90],
];

const DEFAULT_DIAS = 30;

/**
 * Dias de validade estimados para um produto.
 * `validadePadraoDias` (coluna produtos.validade_padrao_dias) tem precedência
 * sobre a heurística por nome.
 */
export function estimarValidadeDias(nomeProduto: string, validadePadraoDias?: number | null): number {
  if (validadePadraoDias && validadePadraoDias > 0) return validadePadraoDias;

  const nome = (nomeProduto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  for (const [regex, dias] of REGRAS_VALIDADE) {
    if (regex.test(nome)) return dias;
  }
  return DEFAULT_DIAS;
}

/** Data de validade estimada a partir da data de compra. */
export function estimarDataValidade(
  nomeProduto: string,
  dataCompra: Date = new Date(),
  validadePadraoDias?: number | null,
): Date {
  const dias = estimarValidadeDias(nomeProduto, validadePadraoDias);
  const data = new Date(dataCompra);
  data.setDate(data.getDate() + dias);
  return data;
}
