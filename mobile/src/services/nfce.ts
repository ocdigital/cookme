/**
 * Consulta NFC-e diretamente do dispositivo do usuário.
 * O fetch sai do IP do usuário, não do VPS — elimina o rate limit por IP.
 * Funciona apenas para QR codes NFC-e (URL). SAT/CF-e não são suportados.
 *
 * Estratégia:
 * 1. Tenta parsear o XML embutido na página HTML (tag <nfeProc> ou <NFe>)
 * 2. Fallback: regex estruturada no HTML buscando padrões fixos de produto
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

// ── Parser XML ────────────────────────────────────────────────────────────────
// O SEFAZ emite o XML da NFC-e inline no HTML em alguns estados.
// Extrai via regex sem precisar de DOM parser.

function extrairTagXml(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function extrairTodasTagsXml(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const result: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    result.push(m[1].trim());
  }
  return result;
}

function parseNfceXml(xml: string): NfceResult | null {
  // Verifica se é XML da NFC-e
  if (!xml.includes('<NFe') && !xml.includes('<nfeProc')) return null;

  // Estabelecimento
  const emit = extrairTagXml(xml, 'emit');
  const nomeEstab = extrairTagXml(emit || xml, 'xNome') || extrairTagXml(emit || xml, 'xFant');
  const cnpj = extrairTagXml(emit || xml, 'CNPJ');

  // Total
  const ICMSTot = extrairTagXml(xml, 'ICMSTot');
  const totalStr = extrairTagXml(ICMSTot || xml, 'vNF');
  const total = parseFloat(totalStr) || 0;

  // Itens — cada <det> contém um <prod>
  const dets = extrairTodasTagsXml(xml, 'det');
  const itens: NfceItem[] = [];

  for (const det of dets) {
    const prod = extrairTagXml(det, 'prod');
    if (!prod) continue;

    const nome = extrairTagXml(prod, 'xProd').trim();
    const codigo = extrairTagXml(prod, 'cEAN') || extrairTagXml(prod, 'cProd');
    const qtde = parseFloat(extrairTagXml(prod, 'qCom').replace(',', '.')) || 1;
    const unidade = extrairTagXml(prod, 'uCom') || 'UN';
    const vlUnit = parseFloat(extrairTagXml(prod, 'vUnCom').replace(',', '.')) || 0;
    const vlTotal = parseFloat(extrairTagXml(prod, 'vProd').replace(',', '.')) || 0;

    if (nome && nome.length > 1) {
      itens.push({ nome, codigo, quantidade: qtde, unidade, valor_unitario: vlUnit, valor_total: vlTotal });
    }
  }

  if (itens.length === 0) return null;

  return {
    estabelecimento: { nome: nomeEstab, cnpj },
    itens,
    total,
  };
}

// ── Parser HTML (fallback) ────────────────────────────────────────────────────
// Busca padrões fixos no HTML: tabelas de produto com classe/id conhecidos,
// ou sequência de campos com rótulos fixos ("Qtde.:", "Vl. Unit.:").
// NÃO tenta detectar nome de produto por heurística de linha.

function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseNfceHtmlFallback(html: string): NfceResult {
  // Extrai texto limpo
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(div|p|li|tr|td|th|span|h[1-6]|table|tbody|thead|tfoot)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ');

  const linhas = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  let nomeEstab = '';
  let cnpjEstab = '';
  let totalCupom = 0;
  const itens: NfceItem[] = [];

  // Extrai estabelecimento e CNPJ das primeiras 20 linhas
  for (let j = 0; j < Math.min(linhas.length, 20); j++) {
    const l = linhas[j];
    if (/CNPJ\s*:/i.test(l)) {
      cnpjEstab = l.replace(/CNPJ\s*:/i, '').trim();
    }
    if (!nomeEstab && j >= 1 && l.length > 3 && !/CNPJ|CPF|IE:|Inscrição|Endereço|Rua|Av\.|Tel|Fone|CEP|\d{2}\/\d{2}\/\d{4}|http|DOCUMENTO|AUXILIAR|NOTA FISCAL|CONSUMIDOR|NFC-e|SAT|DANFE/i.test(l)) {
      nomeEstab = l;
    }
  }

  // Extrai total
  for (const l of linhas) {
    if (/valor\s+total\s+r\$\s*:/i.test(l) || /^valor\s+a\s+pagar/i.test(l)) {
      const idx = linhas.indexOf(l);
      for (let k = idx + 1; k < Math.min(idx + 5, linhas.length); k++) {
        const v = parseBRL(linhas[k]);
        if (v > 0) { totalCupom = v; break; }
      }
    }
  }

  // Estratégia: busca blocos com rótulos fixos "Qtde.:" e "Vl. Total"
  // O nome do produto é a linha IMEDIATAMENTE ANTES de "(Código:" OU "Qtde.:"
  // MAS apenas se não for o nome do estabelecimento ou linha de cabeçalho.
  const CABECALHO_RE = /^(CNPJ|CPF|IE:|Inscrição|Endereço|Rua|Av\.|Tel|Fone|CEP|Subtotal|Total|Desconto|Troco|Valor|Forma|Pagamento|Protocolo|Chave|Ambiente|Versão|Documento|Consumidor|Tributo|Secretaria|NFC-e|SAT|Data|Emissão|Número|Série)/i;
  const ESTAB_LOWER = nomeEstab.toLowerCase().trim();

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];

    // Detecta início de produto: linha com "(Código:" indica que a linha anterior é o nome
    if (/^\(c[oó]digo:/i.test(l) && i > 0) {
      const nomeCandidato = linhas[i - 1];
      const nomeLower = nomeCandidato.toLowerCase().trim();

      // Rejeitar se for cabeçalho, estabelecimento, ou linha já vazia
      if (
        !nomeCandidato ||
        nomeCandidato.length < 2 ||
        CABECALHO_RE.test(nomeCandidato) ||
        (ESTAB_LOWER && nomeLower === ESTAB_LOWER) ||
        /^[\d.,\s]+$/.test(nomeCandidato)
      ) continue;

      // Coleta campos do bloco: qtde, unidade, vl unit, vl total
      let codigo = '';
      let qtde = 1;
      let unidade = 'UN';
      let vlUnit = 0;
      let vlTotal = 0;

      // Código vem logo após "(Código:"
      const codigoMatch = l.match(/\(c[oó]digo:\s*([^)]+)\)/i);
      if (codigoMatch) {
        codigo = codigoMatch[1].trim();
      } else if (i + 1 < linhas.length) {
        codigo = linhas[i + 1].replace(')', '').trim();
      }

      for (let j = i + 1; j < Math.min(i + 20, linhas.length); j++) {
        const lj = linhas[j].toLowerCase();
        if (/^qtde\.\s*:/.test(lj)) {
          const parts = linhas[j].split(':');
          qtde = parseFloat((parts[1] || '').trim().replace(',', '.')) || 1;
          if (!qtde && j + 1 < linhas.length) qtde = parseFloat(linhas[j + 1].replace(',', '.')) || 1;
        } else if (/^un\s*:/.test(lj)) {
          const parts = linhas[j].split(':');
          unidade = (parts[1] || '').trim() || (j + 1 < linhas.length ? linhas[j + 1] : 'UN');
        } else if (/^vl\.\s*unit\./i.test(linhas[j])) {
          for (let k = j + 1; k < Math.min(j + 5, linhas.length); k++) {
            vlUnit = parseBRL(linhas[k]);
            if (vlUnit) break;
          }
        } else if (/^vl\.\s*total$/i.test(linhas[j])) {
          for (let k = j + 1; k < Math.min(j + 5, linhas.length); k++) {
            vlTotal = parseBRL(linhas[k]);
            if (vlTotal) break;
          }
          i = j; // avança cursor para depois do bloco
          break;
        } else if (/^\(c[oó]digo:/i.test(linhas[j]) && j > i + 1) {
          // Início de próximo produto — encerra bloco atual
          i = j - 1;
          break;
        }
      }

      if (nomeCandidato && (vlTotal > 0 || vlUnit > 0)) {
        itens.push({
          nome: nomeCandidato,
          codigo,
          quantidade: qtde,
          unidade,
          valor_unitario: vlUnit || (qtde > 0 ? vlTotal / qtde : vlTotal),
          valor_total: vlTotal,
        });
      }
    }
  }

  return { estabelecimento: { nome: nomeEstab, cnpj: cnpjEstab }, itens, total: totalCupom };
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function consultarNFCe(urlQrCode: string): Promise<NfceResult> {
  const response = await fetch(urlQrCode, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
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

  // Tenta XML inline primeiro (mais confiável)
  const xmlResult = parseNfceXml(html);
  if (xmlResult && xmlResult.itens.length > 0) {
    return xmlResult;
  }

  // Fallback: HTML estruturado
  const htmlResult = parseNfceHtmlFallback(html);

  if (htmlResult.itens.length === 0) {
    throw new Error('Nenhum item encontrado no cupom — formato não reconhecido');
  }

  return htmlResult;
}
