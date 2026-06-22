/**
 * Consulta NFC-e diretamente do dispositivo do usuário.
 * O fetch sai do IP do usuário, não do VPS — elimina o rate limit por IP.
 * Funciona apenas para QR codes NFC-e (URL). SAT/CF-e não são suportados.
 */

export interface NfceItem {
  nome: string;
  codigo?: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export interface NfceResult {
  estabelecimento: { nome: string; cnpj: string };
  itens: NfceItem[];
  total: number;
}

const KEYWORDS = [
  'qtde.:',
  'un:',
  'vl. unit.:',
  'vl. total',
  'valor total r$:',
  'descontos r$:',
  'valor a pagar r$:',
  'forma de pagamento:',
  'valor pago r$:',
  'troco',
  '(código:',
  ')',
  'consulta resumida',
  'documento auxiliar',
  'secretaria da fazenda',
  'cnpj:',
  'chave de acesso',
  'protocolo',
  'consumidor',
  'tributos',
  'informações',
  'ambiente',
  'emissão:',
  'versão',
];

function isKeyword(line: string): boolean {
  const l = line.toLowerCase().trim();
  if (!l || l.length < 3) return true;
  return KEYWORDS.some((k) => l.startsWith(k));
}

function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseNfceHtml(html: string): NfceResult {
  // Extrai texto simples do HTML — sem DOM parser no RN, usa regex básico
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(div|p|li|tr|td|th|span|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');

  const linhas = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const n = linhas.length;
  const itens: NfceItem[] = [];
  let totalCupom = 0;
  let nomeEstab = '';
  let cnpjEstab = '';

  // Extrai CNPJ e nome do estabelecimento
  for (let j = 0; j < Math.min(n, 40); j++) {
    const l = linhas[j];
    if (l.toUpperCase().includes('CNPJ:')) {
      cnpjEstab = l.replace(/CNPJ:/i, '').trim();
    }
    if (!nomeEstab && l && !isKeyword(l) && !l.includes('CNPJ') && l.length > 5 && j > 5) {
      nomeEstab = l;
    }
  }

  // Máquina de estados: detecta produto pela linha seguida de "(Código:"
  let i = 0;
  while (i < n) {
    const linha = linhas[i];

    // Total do cupom
    if (linha.toLowerCase().startsWith('valor total r$:')) {
      for (let k = i + 1; k < Math.min(i + 5, n); k++) {
        if (linhas[k]) {
          totalCupom = parseBRL(linhas[k]);
          break;
        }
      }
    }

    // Detecta início de bloco de produto
    if (linha && !isKeyword(linha) && linha.length > 3) {
      const lookahead = Math.min(i + 10, n);
      const temCodigo = linhas.slice(i + 1, lookahead).some((l) =>
        l.toLowerCase().includes('(código:') || l.toLowerCase().includes('(codigo:'),
      );

      if (temCodigo) {
        let nomeProduto = linha;
        let codigo = '';
        let qtde = 1.0;
        let unidade = 'UN';
        let vlUnit = 0;
        let vlTotal = 0;

        let j = i + 1;
        while (j < Math.min(i + 40, n)) {
          const lj = linhas[j];
          const ljL = lj.toLowerCase();

          if (ljL.includes('(código:') || ljL.includes('(codigo:')) {
            for (let k = j + 1; k < Math.min(j + 5, n); k++) {
              if (linhas[k]) {
                codigo = linhas[k].replace(')', '').trim();
                break;
              }
            }
          } else if (ljL.startsWith('qtde.:')) {
            const partes = lj.split(':');
            if (partes[1]?.trim()) {
              qtde = parseFloat(partes[1].trim().replace(',', '.')) || 1;
            } else {
              for (let k = j + 1; k < Math.min(j + 4, n); k++) {
                if (linhas[k]) {
                  qtde = parseFloat(linhas[k].replace(',', '.')) || 1;
                  break;
                }
              }
            }
          } else if (ljL.startsWith('un:')) {
            const partes = lj.split(':');
            if (partes[1]?.trim()) {
              unidade = partes[1].trim();
            } else {
              for (let k = j + 1; k < Math.min(j + 4, n); k++) {
                if (linhas[k]) {
                  unidade = linhas[k];
                  break;
                }
              }
            }
          } else if (ljL.startsWith('vl. unit.:')) {
            for (let k = j + 1; k < Math.min(j + 6, n); k++) {
              const lk = linhas[k].trim();
              if (lk) {
                vlUnit = parseBRL(lk);
                if (vlUnit) break;
              }
            }
          } else if (ljL === 'vl. total') {
            for (let k = j + 1; k < Math.min(j + 6, n); k++) {
              const lk = linhas[k].trim();
              if (lk) {
                vlTotal = parseBRL(lk);
                if (vlTotal) break;
              }
            }
            // fim do bloco
            i = j;
            break;
          }

          j++;
        }

        if (nomeProduto && (vlTotal > 0 || vlUnit > 0)) {
          itens.push({
            nome: nomeProduto,
            codigo,
            quantidade: qtde,
            unidade,
            valor_unitario: vlUnit || (qtde > 0 ? vlTotal / qtde : vlTotal),
            valor_total: vlTotal,
          });
        }
      }
    }

    i++;
  }

  return {
    estabelecimento: { nome: nomeEstab, cnpj: cnpjEstab },
    itens,
    total: totalCupom,
  };
}

export async function consultarNFCe(urlQrCode: string): Promise<NfceResult> {
  const response = await fetch(urlQrCode, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`SEFAZ retornou HTTP ${response.status}`);
  }

  const html = await response.text();

  if (html.length < 500) {
    throw new Error('Resposta do SEFAZ muito curta — possível bloqueio ou CAPTCHA');
  }

  const result = parseNfceHtml(html);

  if (result.itens.length === 0) {
    throw new Error('Nenhum item encontrado no cupom — formato não reconhecido');
  }

  return result;
}
