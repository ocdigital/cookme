/**
 * Utilitários para o dado legado das receitas do seed `groq_seed` (2026-07),
 * que embutiu a lista de ingredientes DENTRO do modo_preparo como bloco
 * "INGREDIENTES:\n• ...\n\nMODO DE PREPARO:\n...", porque a entidade não tinha
 * coluna própria de ingredientes. Isso causa, na tela de detalhe:
 *   - lista de cima (ingredientes_chave) com menos itens que a real
 *   - lista embutida repetida como "passos" no modo de preparo
 *
 * Estas funções separam os dois e são a base do backfill.
 */

export interface ReceitaLegadoSeparada {
  /** Lista de ingredientes extraída do bloco (texto original), ou [] se não havia bloco */
  ingredientesTexto: string[];
  /** modo_preparo só com os passos, sem o bloco INGREDIENTES: */
  modoPreparoLimpo: string;
  /** true se o texto tinha o bloco embutido (precisava de separação) */
  tinhaBlocoEmbutido: boolean;
}

// Cabeçalhos aceitos (com/sem acento, dois-pontos opcional)
const RE_HEADER_ING = /^\s*ingredientes?\s*:?\s*$/i;
const RE_HEADER_PREPARO = /^\s*modo\s+de\s+preparo\s*:?\s*$/i;

/** Remove marcador de item ("• ", "- ", "* ", "1. ") do início de uma linha */
function limparMarcador(linha: string): string {
  return linha.replace(/^\s*(?:[•\-*•]|\d+[.)])\s*/, '').trim();
}

/**
 * Separa o bloco "INGREDIENTES:" embutido de um modo_preparo legado.
 * Se o texto não começar com o bloco, devolve o modo_preparo intacto e lista vazia
 * (receitas geradas pelo fluxo atual não têm o bloco — ficam inalteradas).
 */
export function separarReceitaLegado(modoPreparo: string | null | undefined): ReceitaLegadoSeparada {
  const vazio: ReceitaLegadoSeparada = {
    ingredientesTexto: [],
    modoPreparoLimpo: (modoPreparo ?? '').trim(),
    tinhaBlocoEmbutido: false,
  };
  if (!modoPreparo) return vazio;

  const linhas = modoPreparo.split('\n');

  // Acha o cabeçalho INGREDIENTES: e o de MODO DE PREPARO:
  const idxIng = linhas.findIndex((l) => RE_HEADER_ING.test(l));
  if (idxIng === -1) return vazio; // sem bloco embutido → não mexe

  const idxPreparo = linhas.findIndex((l, i) => i > idxIng && RE_HEADER_PREPARO.test(l));

  // Ingredientes = linhas entre o cabeçalho e o próximo cabeçalho (ou fim)
  const fimIng = idxPreparo === -1 ? linhas.length : idxPreparo;
  const ingredientesTexto = linhas
    .slice(idxIng + 1, fimIng)
    .map(limparMarcador)
    .filter((l) => l.length > 0);

  if (ingredientesTexto.length === 0) return vazio; // cabeçalho sem itens → trata como sem bloco

  // Passos = tudo depois de "MODO DE PREPARO:" (se existir), senão vazio
  const modoPreparoLimpo =
    idxPreparo === -1 ? '' : linhas.slice(idxPreparo + 1).join('\n').trim();

  return { ingredientesTexto, modoPreparoLimpo, tinhaBlocoEmbutido: true };
}
