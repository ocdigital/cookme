import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Receita as ReceitaGerada } from './recipe-generator.service';
import { TudoGostosoScraperService } from './tudogostoso-scraper.service';
import { ReceiteriaCrawlerService } from './receiteria-scraper.service';
import { SocialRecipeExtractorService, detectarFonte } from './social-recipe-extractor.service';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

const DOMINIOS_CONHECIDOS = [
  'tudogostoso.com.br', 'receiteria.com.br', 'panelinha.com.br',
  'cybercook.com.br', 'receitasnestle.com.br', 'receitasnestlebr.com.br',
];

@Injectable()
export class RecipeSearchService {
  private readonly logger = new Logger('RecipeSearchService');
  private geminiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tudoGostoso: TudoGostosoScraperService,
    private readonly receiteria: ReceiteriaCrawlerService,
    private readonly socialExtractor: SocialRecipeExtractorService,
  ) {
    this.geminiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  /**
   * Busca receitas reais em múltiplos sites brasileiros.
   * TudoGostoso primeiro; se insuficiente, completa com Receiteria.
   */
  async buscarReceitasReais(ingredientes: string[], quantidade = 3): Promise<ReceitaGerada[]> {
    const resultados: ReceitaGerada[] = [];
    const titulosVistos = new Set<string>();

    const adicionarUnicas = (receitas: ReceitaGerada[]) => {
      for (const r of receitas) {
        const chave = r.titulo.toLowerCase().trim();
        if (!titulosVistos.has(chave)) {
          titulosVistos.add(chave);
          resultados.push(r);
        }
      }
    };

    // 1. TudoGostoso
    try {
      const tg = await this.tudoGostoso.buscarReceitas(ingredientes, quantidade);
      adicionarUnicas(tg);
      this.logger.log(`TudoGostoso: ${tg.length} receita(s)`);
    } catch (err: any) {
      this.logger.warn(`TudoGostoso falhou: ${err.message}`);
    }

    // 2. Receiteria — complementa se TudoGostoso não trouxe suficiente
    if (resultados.length < quantidade) {
      const faltando = quantidade - resultados.length;
      try {
        const re = await this.receiteria.buscarReceitas(ingredientes, faltando + 2);
        adicionarUnicas(re);
        this.logger.log(`Receiteria: ${re.length} receita(s)`);
      } catch (err: any) {
        this.logger.warn(`Receiteria falhou: ${err.message}`);
      }
    }

    if (resultados.length === 0) {
      this.logger.warn('Nenhum scraper retornou receitas');
    } else {
      this.logger.log(`✅ Total scrapers: ${resultados.length} receita(s)`);
    }

    return resultados.slice(0, quantidade);
  }

  async buscarReceitasFitness(quantidade = 20): Promise<ReceitaGerada[]> {
    const todas: ReceitaGerada[] = [];
    const titulosVistos = new Set<string>();

    const FONTES = [
      () => this.tudoGostoso.buscarReceitasPorCategoria('https://www.tudogostoso.com.br/categorias/1340-fitness', Math.ceil(quantidade * 0.6)),
      () => this.tudoGostoso.buscarReceitasPorKeyword('receita fitness low carb', Math.ceil(quantidade * 0.3)),
      () => this.tudoGostoso.buscarReceitasPorKeyword('receita saudavel proteina', Math.ceil(quantidade * 0.3)),
      () => this.receiteria.buscarReceitas(['frango', 'atum', 'aveia'], Math.ceil(quantidade * 0.3)),
    ];

    for (const fonte of FONTES) {
      if (todas.length >= quantidade) break;
      try {
        const receitas = await fonte();
        for (const r of receitas) {
          const chave = r.titulo.toLowerCase().trim();
          if (!titulosVistos.has(chave)) { titulosVistos.add(chave); todas.push(r); }
        }
      } catch { /* continua */ }
    }

    return todas.slice(0, quantidade).map((r) => ({ ...r, tags_dieta: ['fitness'] }));
  }

  async buscarReceitasVegetarianas(quantidade = 30): Promise<ReceitaGerada[]> {
    const todas: ReceitaGerada[] = [];
    const titulosVistos = new Set<string>();

    const KEYWORDS = ['receita vegetariana', 'prato vegetariano', 'quiche vegetariana', 'arroz vegetariano', 'macarrao vegetariano'];
    for (const kw of KEYWORDS) {
      if (todas.length >= quantidade) break;
      try {
        const receitas = await this.tudoGostoso.buscarReceitasPorKeyword(kw, Math.ceil(quantidade / KEYWORDS.length) + 5);
        for (const r of receitas) {
          const chave = r.titulo.toLowerCase().trim();
          if (!titulosVistos.has(chave)) { titulosVistos.add(chave); todas.push(r); }
        }
      } catch { /* continua */ }
    }

    // Complementa com Receiteria
    if (todas.length < quantidade) {
      try {
        const re = await this.receiteria.buscarReceitas(['legumes', 'tofu', 'queijo'], quantidade - todas.length + 5);
        for (const r of re) {
          const chave = r.titulo.toLowerCase().trim();
          if (!titulosVistos.has(chave)) { titulosVistos.add(chave); todas.push(r); }
        }
      } catch { /* continua */ }
    }

    return todas.slice(0, quantidade).map((r) => ({ ...r, tags_dieta: ['vegetariano'] }));
  }

  async buscarReceitasVeganas(quantidade = 20): Promise<ReceitaGerada[]> {
    const todas: ReceitaGerada[] = [];
    const titulosVistos = new Set<string>();

    const KEYWORDS = ['receita vegana', 'prato vegano', 'sobremesa vegana', 'bolo vegano'];
    for (const kw of KEYWORDS) {
      if (todas.length >= quantidade) break;
      try {
        const receitas = await this.tudoGostoso.buscarReceitasPorKeyword(kw, Math.ceil(quantidade / KEYWORDS.length) + 5);
        for (const r of receitas) {
          const chave = r.titulo.toLowerCase().trim();
          if (!titulosVistos.has(chave)) { titulosVistos.add(chave); todas.push(r); }
        }
      } catch { /* continua */ }
    }

    if (todas.length < quantidade) {
      try {
        const re = await this.receiteria.buscarReceitas(['grão-de-bico', 'lentilha', 'tofu'], quantidade - todas.length + 5);
        for (const r of re) {
          const chave = r.titulo.toLowerCase().trim();
          if (!titulosVistos.has(chave)) { titulosVistos.add(chave); todas.push(r); }
        }
      } catch { /* continua */ }
    }

    return todas.slice(0, quantidade).map((r) => ({ ...r, tags_dieta: ['vegano', 'vegetariano'] }));
  }

  // Receitas normais: categorias + keywords para máxima diversidade
  async buscarReceitasNormais(quantidade = 40): Promise<ReceitaGerada[]> {
    const todas: ReceitaGerada[] = [];
    const titulosVistos = new Set<string>();

    const adicionar = (receitas: ReceitaGerada[]) => {
      for (const r of receitas) {
        const chave = r.titulo.toLowerCase().trim();
        if (!titulosVistos.has(chave)) { titulosVistos.add(chave); todas.push(r); }
      }
    };

    // 1. Categorias do TudoGostoso (centenas de receitas cada)
    const CATEGORIAS = [
      'https://www.tudogostoso.com.br/categorias/2-carnes',
      'https://www.tudogostoso.com.br/categorias/3-aves',
      'https://www.tudogostoso.com.br/categorias/4-peixes-e-frutos-do-mar',
      'https://www.tudogostoso.com.br/categorias/8-massas',
      'https://www.tudogostoso.com.br/categorias/10-sopas-e-caldos',
      'https://www.tudogostoso.com.br/categorias/12-arroz-e-risoto',
      'https://www.tudogostoso.com.br/categorias/14-saladas',
    ];

    const porCategoria = Math.ceil(quantidade / CATEGORIAS.length) + 5;
    for (const url of CATEGORIAS) {
      if (todas.length >= quantidade) break;
      try {
        const receitas = await this.tudoGostoso.buscarReceitasPorCategoria(url, porCategoria);
        adicionar(receitas);
        this.logger.log(`Categoria ${url.split('/').pop()}: ${receitas.length} receitas`);
      } catch (err: any) {
        this.logger.warn(`Categoria falhou ${url}: ${err.message}`);
      }
    }

    // 2. Keywords complementares se ainda não atingiu quantidade
    const KEYWORDS = [
      'frango grelhado', 'carne assada', 'macarrão ao molho', 'peixe grelhado',
      'bife acebolado', 'lasanha', 'strogonoff frango', 'costela assada',
      'camarão alho', 'torta frango', 'carne moida', 'risoto frango',
    ];

    for (const kw of KEYWORDS) {
      if (todas.length >= quantidade) break;
      try {
        const receitas = await this.tudoGostoso.buscarReceitasPorKeyword(kw, 8);
        adicionar(receitas);
      } catch { /* continua */ }
    }

    // 3. Receiteria como fonte extra
    if (todas.length < quantidade) {
      try {
        const re = await this.receiteria.buscarReceitas(['frango', 'carne', 'peixe'], quantidade - todas.length + 10);
        adicionar(re);
      } catch { /* continua */ }
    }

    return todas.slice(0, quantidade);
  }

  /**
   * Retorna apenas título + URL de receitas encontradas na web — sem scraping de conteúdo.
   * Usado para mostrar lista de previews ao usuário antes de ele escolher o que importar.
   */
  async buscarPreviewsNaWeb(
    ingredientes: string[],
    quantidade = 10,
  ): Promise<Array<{ titulo: string; url: string; site: string }>> {
    try {
      return await this.tudoGostoso.buscarPreviewsUrls(ingredientes, quantidade);
    } catch (err: any) {
      this.logger.warn(`buscarPreviewsNaWeb falhou: ${err.message}`);
      return [];
    }
  }

  async scraparUrl(url: string): Promise<ReceitaGerada | null> {
    // Sites brasileiros conhecidos — scraper dedicado
    if (url.includes('receiteria.com.br')) {
      return this.receiteria.scraparReceita(url);
    }
    if (url.includes('tudogostoso.com.br')) {
      return this.tudoGostoso.scraparReceita(url);
    }
    // Redes sociais e qualquer outro site — extrator universal com Claude
    const fonte = detectarFonte(url);
    const isSocial = fonte !== 'generic';
    const isSiteConhecido = DOMINIOS_CONHECIDOS.some(d => url.includes(d));

    if (isSocial || !isSiteConhecido) {
      return this.socialExtractor.extrairReceita(url);
    }
    // Fallback para sites genéricos de receita
    return this.socialExtractor.extrairReceita(url);
  }

  /**
   * Sugere substituições para ingredientes faltando em uma receita.
   * Usa Gemini para sugestões contextuais (feature separada, não geração).
   */
  async sugerirSubstituicoes(
    receita: ReceitaGerada,
    ingredientesDisponiveis: string[],
    ingredientesFaltando: string[],
  ): Promise<{ ingrediente: string; substituicao: string }[]> {
    if (!this.geminiKey || ingredientesFaltando.length === 0) return [];

    const prompt = `Na receita "${receita.titulo}", o usuário não tem: ${ingredientesFaltando.join(', ')}.
Ingredientes que ele TEM: ${ingredientesDisponiveis.slice(0, 10).join(', ')}.

Para cada ingrediente faltando, sugira UMA substituição prática usando o que ele tem ou ingredientes muito comuns.
Se não houver substituição razoável, diga "Sem substituição — ingrediente essencial".

Retorne APENAS JSON array:
[{"ingrediente": "creme de leite", "substituicao": "iogurte natural integral (mesma cremosidade)"}]`;

    try {
      const response = await axios.post(
        `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${this.geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        },
        { timeout: 15000 },
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }
}
