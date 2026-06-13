import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Receita as ReceitaGerada } from './recipe-generator.service';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

@Injectable()
export class ReceiteriaCrawlerService {
  private readonly logger = new Logger('ReceiteriaCrawlerService');
  private readonly BASE = 'https://www.receiteria.com.br';

  async buscarReceitas(ingredientes: string[], quantidade: number): Promise<ReceitaGerada[]> {
    const principal = ingredientes[0];
    if (!principal) return [];
    return this.buscarPorKeyword(principal, quantidade);
  }

  async buscarPorKeyword(keyword: string, quantidade: number): Promise<ReceitaGerada[]> {
    this.logger.log(`🔍 Receiteria keyword: "${keyword}"`);
    const urls = await this.buscarUrls(keyword, quantidade * 3);
    if (urls.length === 0) return [];

    const receitas: ReceitaGerada[] = [];
    for (const url of urls) {
      if (receitas.length >= quantidade) break;
      try {
        const receita = await this.scraparReceita(url);
        if (receita) {
          receitas.push(receita);
          this.logger.log(`✅ Receiteria: "${receita.titulo}"`);
        }
      } catch (err: any) {
        this.logger.debug(`Receiteria falhou ${url}: ${err.message}`);
      }
    }
    return receitas;
  }

  async scraparReceita(url: string): Promise<ReceitaGerada | null> {
    const html = await this.fetch(url);
    return this.parsarJsonLd(html, url);
  }

  private async buscarUrls(keyword: string, limite: number): Promise<string[]> {
    try {
      const html = await this.fetch(`${this.BASE}/busca/?q=${encodeURIComponent(keyword)}`);
      const urls = this.extrairUrlsReceitas(html);
      this.logger.debug(`Receiteria busca "${keyword}": ${urls.length} URLs`);
      return urls.slice(0, limite);
    } catch (err: any) {
      this.logger.warn(`Receiteria busca falhou: ${err.message}`);
      return [];
    }
  }

  private extrairUrlsReceitas(html: string): string[] {
    // Receiteria usa padrão: /receita/nome-da-receita/
    const regex = /href="((?:https?:\/\/www\.receiteria\.com\.br)?\/receita\/[\w-]+\/)"/g;
    const urls = new Set<string>();
    let match;
    while ((match = regex.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : this.BASE + match[1];
      urls.add(url);
    }
    return Array.from(urls);
  }

  private parsarJsonLd(html: string, url: string): ReceitaGerada | null {
    const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const schemas = Array.isArray(data) ? data : [data];
        for (const schema of schemas) {
          if (schema['@type'] === 'Recipe') {
            const receita = this.schemaParaReceita(schema, url);
            if (receita) return receita;
          }
        }
      } catch {
        // JSON inválido, próximo script
      }
    }
    return null;
  }

  private schemaParaReceita(schema: any, url: string): ReceitaGerada | null {
    const titulo = schema.name || schema.headline;
    if (!titulo) return null;

    const ingredientes: string[] = Array.isArray(schema.recipeIngredient)
      ? schema.recipeIngredient.filter(Boolean)
      : [];

    if (ingredientes.length === 0) return null;

    let modoPreparo: string;
    if (Array.isArray(schema.recipeInstructions)) {
      const passos = schema.recipeInstructions.map((step: any, i: number) => {
        const text = typeof step === 'string' ? step : step.text || '';
        return `${i + 1}. ${text.trim()}`;
      });
      modoPreparo = JSON.stringify(passos);
    } else {
      modoPreparo = String(schema.recipeInstructions || '');
    }

    const tempoMinutos = this.parseDuration(schema.totalTime || schema.cookTime || schema.prepTime);
    const porcoes = this.parseYield(schema.recipeYield);
    const imagem = this.extrairImagem(schema.image);
    const avaliacao = schema.aggregateRating?.ratingValue
      ? parseFloat(schema.aggregateRating.ratingValue)
      : undefined;

    return {
      titulo,
      descricao: schema.description || '',
      tempo_preparo: `${tempoMinutos} minutos`,
      dificuldade: 'médio',
      ingredientes,
      modo_preparo: modoPreparo,
      rendimento: `${porcoes} porções`,
      imagem_url: undefined,
      url_fonte: url,
      site_origem: 'Receiteria',
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

  private async fetch(url: string): Promise<string> {
    const response = await axios.get(url, { headers: HEADERS, timeout: 15000, maxRedirects: 3 });
    return response.data;
  }
}
