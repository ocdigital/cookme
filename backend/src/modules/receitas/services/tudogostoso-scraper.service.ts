import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { Receita as ReceitaGerada } from './recipe-generator.service';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
  'Connection': 'keep-alive',
};

const CONDIMENTOS = new Set(['sal', 'pimenta', 'azeite', 'oleo', 'agua', 'acucar', 'vinagre']);

@Injectable()
export class TudoGostosoScraperService {
  private readonly logger = new Logger('TudoGostosoScraperService');
  private readonly BASE_URL = 'https://www.tudogostoso.com.br';

  async buscarReceitasPorKeyword(keyword: string, quantidade: number): Promise<ReceitaGerada[]> {
    this.logger.log(`🔍 TudoGostoso keyword: "${keyword}"`);
    const urls = await this.buscarUrls(keyword, quantidade * 3);
    if (urls.length === 0) return [];

    const receitas: ReceitaGerada[] = [];
    for (const url of urls) {
      if (receitas.length >= quantidade) break;
      try {
        const receita = await this.scraparReceita(url);
        if (receita) {
          receitas.push(receita);
          this.logger.log(`✅ TudoGostoso: "${receita.titulo}" scraped`);
        }
      } catch (err: any) {
        this.logger.warn(`⚠️ TudoGostoso keyword: falha em ${url}: ${err.message}`);
      }
    }
    return receitas;
  }

  async buscarReceitasPorCategoria(categoriaUrl: string, quantidade: number): Promise<ReceitaGerada[]> {
    this.logger.log(`🏷️ TudoGostoso: scraping categoria ${categoriaUrl}`);

    let html: string;
    try {
      html = await this.fetchComAxios(categoriaUrl);
    } catch (err: any) {
      this.logger.warn(`Axios falhou para categoria: ${err.message}`);
      html = await this.fetchComPuppeteer(categoriaUrl);
    }

    // Extrai URLs do JSON embutido na página ("url": "https://...receita/...html")
    const urlRegex = /"url"\s*:\s*"(https?:\/\/www\.tudogostoso\.com\.br\/receita\/[^"]+\.html)"/g;
    const urls = new Set<string>();
    let match;
    while ((match = urlRegex.exec(html)) !== null) {
      urls.add(match[1]);
    }

    // Fallback: tenta extração por href
    if (urls.size === 0) {
      this.extrairUrlsReceitas(html).forEach((u) => urls.add(u));
    }

    this.logger.log(`🔗 TudoGostoso categoria: ${urls.size} URLs encontradas`);
    if (urls.size === 0) return [];

    const receitas: ReceitaGerada[] = [];
    for (const url of urls) {
      if (receitas.length >= quantidade) break;
      try {
        const receita = await this.scraparReceita(url);
        if (receita) {
          receitas.push(receita);
          this.logger.log(`✅ TudoGostoso: "${receita.titulo}" scraped`);
        }
      } catch (err: any) {
        this.logger.warn(`⚠️ TudoGostoso: falha em ${url}: ${err.message}`);
      }
    }

    return receitas;
  }

  async buscarReceitas(ingredientes: string[], quantidade: number): Promise<ReceitaGerada[]> {
    const principais = ingredientes
      .filter((i) => {
        const norm = i.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        return !CONDIMENTOS.has(norm.split(' ')[0]);
      })
      .slice(0, 4); // pega até 4 ingredientes protagonistas

    if (principais.length === 0) return [];

    // Busca por ingrediente individual — TudoGostoso não ranqueia bem multi-ingrediente
    // Busca todos os protagonistas para ter variedade (mandioca, banana, cebola, etc.)
    const todasUrls = new Set<string>();
    for (const ingrediente of principais) {
      this.logger.log(`🔍 TudoGostoso: buscando "${ingrediente}"`);
      const urls = await this.buscarUrls(ingrediente, quantidade * 3); // até 9 por ingrediente
      urls.forEach(u => todasUrls.add(u));
      // Não quebra cedo — sempre busca todos os protagonistas
    }

    if (todasUrls.size === 0) {
      this.logger.warn('TudoGostoso: nenhuma URL de receita encontrada');
      return [];
    }

    this.logger.log(`🔗 TudoGostoso: ${todasUrls.size} URLs únicas encontradas`);

    const receitas: ReceitaGerada[] = [];
    for (const url of todasUrls) {
      if (receitas.length >= quantidade * 3) break; // busca mais que o pedido para filtrar depois
      try {
        const receita = await this.scraparReceita(url);
        if (receita) {
          receitas.push(receita);
          this.logger.log(`✅ TudoGostoso: "${receita.titulo}" scraped`);
        }
      } catch (err: any) {
        this.logger.warn(`⚠️ TudoGostoso: falha ao scraper ${url}: ${err.message}`);
      }
    }

    return receitas;
  }

  private async buscarUrls(query: string, limite: number): Promise<string[]> {
    const todas = new Set<string>();
    const paginas = Math.ceil(limite / 20) + 1; // cada página tem ~20 resultados

    for (let p = 1; p <= paginas && todas.size < limite; p++) {
      const searchUrl = `${this.BASE_URL}/busca/?q=${encodeURIComponent(query)}&page=${p}`;
      try {
        const html = await this.fetchComAxios(searchUrl);
        const urls = this.extrairUrlsReceitas(html);
        if (urls.length === 0) break; // sem mais páginas
        urls.forEach(u => todas.add(u));
      } catch (err: any) {
        this.logger.debug(`Axios page ${p} failed: ${err.message}`);
        if (p === 1) {
          const fallback = await this.buscarUrlsComPuppeteer(query, limite);
          fallback.forEach(u => todas.add(u));
        }
        break;
      }
    }

    return Array.from(todas).slice(0, limite);
  }

  private extrairUrlsReceitas(html: string): string[] {
    const regex = /href="((?:https:\/\/www\.tudogostoso\.com\.br)?\/receita\/[\w-]+\.html)"/g;
    const urls = new Set<string>();
    let match;
    while ((match = regex.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : this.BASE_URL + match[1];
      urls.add(url);
    }
    return Array.from(urls);
  }

  private async buscarUrlsComPuppeteer(query: string, limite: number): Promise<string[]> {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setUserAgent(HEADERS['User-Agent']);

      const searchUrl = `${this.BASE_URL}/busca/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const hrefs: string[] = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/receita/"]')).map(
          (a) => (a as HTMLAnchorElement).href,
        ),
      );

      return hrefs
        .filter((h) => h.includes('/receita/') && h.endsWith('.html'))
        .filter((h, i, arr) => arr.indexOf(h) === i)
        .slice(0, limite);
    } catch (err: any) {
      this.logger.error(`Puppeteer search failed: ${err.message}`);
      return [];
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  async scraparReceita(url: string): Promise<ReceitaGerada | null> {
    let html: string;
    try {
      html = await this.fetchComAxios(url);
    } catch {
      html = await this.fetchComPuppeteer(url);
    }
    return this.parsarJsonLd(html, url);
  }

  private parsarJsonLd(html: string, url: string): ReceitaGerada | null {
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
                    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1];

    const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const schemas = Array.isArray(data) ? data : [data];

        for (const schema of schemas) {
          if (schema['@type'] === 'Recipe') {
            const receita = this.schemaParaReceita(schema, url, ogImage);
            if (receita) return receita;
          }
        }
      } catch {
        // JSON inválido, próximo script
      }
    }

    return null;
  }

  private decodeHtml(str: string): string {
    if (!str) return str;
    const entities: Record<string, string> = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
      '&aacute;': 'á', '&Aacute;': 'Á', '&eacute;': 'é', '&Eacute;': 'É',
      '&iacute;': 'í', '&Iacute;': 'Í', '&oacute;': 'ó', '&Oacute;': 'Ó',
      '&uacute;': 'ú', '&Uacute;': 'Ú', '&atilde;': 'ã', '&Atilde;': 'Ã',
      '&otilde;': 'õ', '&Otilde;': 'Õ', '&ccedil;': 'ç', '&Ccedil;': 'Ç',
      '&agrave;': 'à', '&Agrave;': 'À', '&egrave;': 'è', '&Egrave;': 'È',
      '&acirc;': 'â', '&ecirc;': 'ê', '&ocirc;': 'ô', '&ntilde;': 'ñ',
      '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&laquo;': '«', '&raquo;': '»',
    };
    let result = str;
    let prev = '';
    while (prev !== result) {
      prev = result;
      result = result
        .replace(/&[a-zA-Z]+;/g, (m) => entities[m] ?? m)
        .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    }
    return result;
  }

  private schemaParaReceita(schema: any, url: string, ogImage?: string): ReceitaGerada | null {
    const titulo = this.decodeHtml(schema.name || schema.headline);
    if (!titulo) return null;

    const ingredientes: string[] = Array.isArray(schema.recipeIngredient)
      ? schema.recipeIngredient.filter(Boolean).map((i: string) => this.decodeHtml(i))
      : [];

    if (ingredientes.length === 0) return null;

    let modoPreparo: string;
    if (Array.isArray(schema.recipeInstructions)) {
      const passos = schema.recipeInstructions.map((step: any, i: number) => {
        const text = typeof step === 'string' ? step : step.text || '';
        return `${i + 1}. ${this.decodeHtml(text.trim())}`;
      });
      modoPreparo = JSON.stringify(passos);
    } else {
      modoPreparo = this.decodeHtml(String(schema.recipeInstructions || ''));
    }

    const tempoMinutos = this.parseDuration(schema.totalTime || schema.cookTime || schema.prepTime);
    const porcoes = this.parseYield(schema.recipeYield);
    const imagem = this.extrairImagem(schema.image) || ogImage;
    const avaliacao = schema.aggregateRating?.ratingValue
      ? parseFloat(schema.aggregateRating.ratingValue)
      : undefined;

    return {
      titulo,
      descricao: '',
      tempo_preparo: `${tempoMinutos} minutos`,
      dificuldade: 'médio',
      ingredientes,
      modo_preparo: modoPreparo,
      rendimento: `${porcoes} porções`,
      imagem_url: imagem || undefined,
      url_fonte: url,
      site_origem: 'TudoGostoso',
      avaliacao,
    };
  }

  private parseDuration(duration: string): number {
    if (!duration) return 30;
    const hours = parseInt(duration.match(/(\d+)H/)?.[1] || '0');
    const minutes = parseInt(duration.match(/(\d+)M/)?.[1] || '0');
    return hours * 60 + minutes || 30;
  }

  private parseYield(recipeYield: any): number {
    if (!recipeYield) return 4;
    const str = Array.isArray(recipeYield) ? recipeYield[0] : recipeYield;
    return parseInt(String(str).match(/\d+/)?.[0] || '4') || 4;
  }

  private extrairImagem(image: any): string | undefined {
    if (!image) return undefined;
    if (typeof image === 'string') return image;
    if (Array.isArray(image)) {
      const first = image[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return image.url || image['@value'];
  }

  private async fetchComAxios(url: string): Promise<string> {
    const response = await axios.get(url, { headers: HEADERS, timeout: 15000, maxRedirects: 3 });
    return response.data;
  }

  private async fetchComPuppeteer(url: string): Promise<string> {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setUserAgent(HEADERS['User-Agent']);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return page.content();
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }
}
