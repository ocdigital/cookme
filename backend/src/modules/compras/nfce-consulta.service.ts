import { Injectable, Logger } from '@nestjs/common';

/**
 * Consulta NFC-e a partir da URL do QR code — proxy server-side.
 *
 * Por que no backend e não no PWA: o navegador bloqueia o fetch para a SEFAZ
 * por CORS (a SEFAZ não emite Access-Control-Allow-Origin). O CookMe mobile é
 * React Native e o fetch nativo ignora CORS; um PWA (navegador) não pode. Então
 * o PWA manda a URL para cá e o servidor busca e parseia.
 *
 * Ressalva: a SEFAZ bloqueia IPs de datacenter com captcha. Este proxy funciona
 * de um IP residencial (dev local); em VPS pode cair no captcha — nesse caso o
 * fluxo real seria o app do usuário buscar direto (como o CookMe faz).
 *
 * Parser portado de mobile/src/services/nfce.ts.
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

@Injectable()
export class NfceConsultaService {
  private readonly logger = new Logger(NfceConsultaService.name);

  async consultar(urlQrCode: string): Promise<NfceResult> {
    if (!/^https?:\/\//i.test(urlQrCode)) {
      throw new Error('QR não é NFC-e (esperada uma URL). SAT/CF-e não suportado.');
    }
    const axios = (await import('axios')).default;
    const res = await axios.get(urlQrCode, {
      timeout: 15000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });
    const html: string = typeof res.data === 'string' ? res.data : String(res.data);
    if (!html || html.length < 500) {
      throw new Error('Resposta da SEFAZ muito curta — possível bloqueio ou CAPTCHA');
    }

    const xmlResult = this.parseXml(html);
    if (xmlResult && xmlResult.itens.length > 0) return xmlResult;

    const htmlResult = this.parseHtmlFallback(html);
    if (htmlResult.itens.length === 0) {
      throw new Error('Nenhum item encontrado no cupom — formato não reconhecido');
    }
    return htmlResult;
  }

  // ── Parser XML (nfeProc/NFe inline) ──────────────────────────────────────
  private tag(xml: string, t: string): string {
    const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i'));
    return m ? m[1].trim() : '';
  }
  private tags(xml: string, t: string): string[] {
    const re = new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'gi');
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) out.push(m[1].trim());
    return out;
  }
  private parseXml(xml: string): NfceResult | null {
    if (!xml.includes('<NFe') && !xml.includes('<nfeProc')) return null;
    const emit = this.tag(xml, 'emit');
    const nome = this.tag(emit || xml, 'xNome') || this.tag(emit || xml, 'xFant');
    const cnpj = this.tag(emit || xml, 'CNPJ');
    const total = parseFloat(this.tag(this.tag(xml, 'ICMSTot') || xml, 'vNF')) || 0;
    const itens: NfceItem[] = [];
    for (const det of this.tags(xml, 'det')) {
      const prod = this.tag(det, 'prod');
      if (!prod) continue;
      const nomeItem = this.tag(prod, 'xProd').trim();
      const codigo = this.tag(prod, 'cEAN') || this.tag(prod, 'cProd');
      const qtde = parseFloat(this.tag(prod, 'qCom').replace(',', '.')) || 1;
      const unidade = this.tag(prod, 'uCom') || 'UN';
      const vlUnit = parseFloat(this.tag(prod, 'vUnCom').replace(',', '.')) || 0;
      const vlTotal = parseFloat(this.tag(prod, 'vProd').replace(',', '.')) || 0;
      if (nomeItem && nomeItem.length > 1) {
        itens.push({ nome: nomeItem, codigo, quantidade: qtde, unidade, valor_unitario: vlUnit, valor_total: vlTotal });
      }
    }
    if (itens.length === 0) return null;
    return { estabelecimento: { nome, cnpj }, itens, total };
  }

  // ── Parser HTML (fallback) ───────────────────────────────────────────────
  private brl(s: string): number { return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0; }
  private parseHtmlFallback(html: string): NfceResult {
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(div|p|li|tr|td|th|span|h[1-6]|table|tbody|thead|tfoot)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ');
    const linhas = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    let nomeEstab = '', cnpjEstab = '', total = 0;
    const itens: NfceItem[] = [];
    for (let j = 0; j < Math.min(linhas.length, 20); j++) {
      const l = linhas[j];
      if (/CNPJ\s*:/i.test(l)) cnpjEstab = l.replace(/CNPJ\s*:/i, '').trim();
      if (!nomeEstab && j >= 1 && l.length > 3 && !/CNPJ|CPF|IE:|Inscrição|Endereço|Rua|Av\.|Tel|Fone|CEP|\d{2}\/\d{2}\/\d{4}|http|DOCUMENTO|AUXILIAR|NOTA FISCAL|CONSUMIDOR|NFC-e|SAT|DANFE/i.test(l)) nomeEstab = l;
    }
    for (let t = 0; t < linhas.length; t++) {
      if (/valor\s+total\s+r\$\s*:/i.test(linhas[t]) || /^valor\s+a\s+pagar/i.test(linhas[t])) {
        for (let k = t + 1; k < Math.min(t + 5, linhas.length); k++) { const v = this.brl(linhas[k]); if (v > 0) { total = v; break; } }
      }
    }
    const CAB = /^(CNPJ|CPF|IE:|Inscrição|Endereço|Rua|Av\.|Tel|Fone|CEP|Subtotal|Total|Desconto|Troco|Valor|Forma|Pagamento|Protocolo|Chave|Ambiente|Versão|Documento|Consumidor|Tributo|Secretaria|NFC-e|SAT|Data|Emissão|Número|Série)/i;
    const estabLower = nomeEstab.toLowerCase().trim();
    for (let i = 0; i < linhas.length; i++) {
      if (/^\(c[oó]digo:/i.test(linhas[i]) && i > 0) {
        const nomeCand = linhas[i - 1];
        if (!nomeCand || nomeCand.length < 2 || CAB.test(nomeCand) ||
            (estabLower && nomeCand.toLowerCase().trim() === estabLower) || /^[\d.,\s]+$/.test(nomeCand)) continue;
        let codigo = '', qtde = 1, unidade = 'UN', vlUnit = 0, vlTotal = 0;
        const cm = linhas[i].match(/\(c[oó]digo:\s*([^)]+)\)/i);
        if (cm) codigo = cm[1].trim(); else if (i + 1 < linhas.length) codigo = linhas[i + 1].replace(')', '').trim();
        for (let j = i + 1; j < Math.min(i + 20, linhas.length); j++) {
          const lj = linhas[j].toLowerCase();
          if (/^qtde\.\s*:/.test(lj)) {
            qtde = parseFloat((linhas[j].split(':')[1] || '').trim().replace(',', '.')) || 1;
            if (!qtde && j + 1 < linhas.length) qtde = parseFloat(linhas[j + 1].replace(',', '.')) || 1;
          } else if (/^un\s*:/.test(lj)) {
            unidade = (linhas[j].split(':')[1] || '').trim() || (j + 1 < linhas.length ? linhas[j + 1] : 'UN');
          } else if (/^vl\.\s*unit\./i.test(linhas[j])) {
            for (let k = j + 1; k < Math.min(j + 5, linhas.length); k++) { vlUnit = this.brl(linhas[k]); if (vlUnit) break; }
          } else if (/^vl\.\s*total$/i.test(linhas[j])) {
            for (let k = j + 1; k < Math.min(j + 5, linhas.length); k++) { vlTotal = this.brl(linhas[k]); if (vlTotal) break; }
            i = j; break;
          } else if (/^\(c[oó]digo:/i.test(linhas[j]) && j > i + 1) { i = j - 1; break; }
        }
        if (nomeCand && (vlTotal > 0 || vlUnit > 0)) {
          itens.push({ nome: nomeCand, codigo, quantidade: qtde, unidade, valor_unitario: vlUnit || (qtde > 0 ? vlTotal / qtde : vlTotal), valor_total: vlTotal });
        }
      }
    }
    return { estabelecimento: { nome: nomeEstab, cnpj: cnpjEstab }, itens, total };
  }
}
