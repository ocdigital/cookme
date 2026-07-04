/**
 * Detecção da UF a partir da chave de acesso (44 dígitos) do QR da NFC-e/CF-e.
 * Posições 1-2 da chave = código IBGE da UF do emissor.
 */
const CODIGO_IBGE_UF: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

/** UFs cobertas pelo caminho QR/SEFAZ atual (NFC-e SP + SAT-SP). */
export const UFS_SUPORTADAS_QR = new Set(['SP']);

/**
 * Extrai a chave de acesso de 44 dígitos do texto do QR
 * (URL com ?p=<chave>... ou formato pipe "chave|data|valor").
 */
export function extrairChaveDoQr(qrcodeTexto: string): string | null {
  const texto = (qrcodeTexto || '').trim();

  if (texto.startsWith('http')) {
    const match = texto.match(/[?&]p=([0-9]{44})/);
    return match ? match[1] : null;
  }

  const candidata = texto.split('|')[0]?.trim() ?? '';
  return /^[0-9]{44}$/.test(candidata) ? candidata : null;
}

/** UF do emissor a partir do texto do QR; null se chave ilegível/inválida. */
export function detectarUfDoQr(qrcodeTexto: string): string | null {
  const chave = extrairChaveDoQr(qrcodeTexto);
  if (!chave) return null;
  return CODIGO_IBGE_UF[chave.slice(0, 2)] ?? null;
}
