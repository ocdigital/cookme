import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Receita as ReceitaGerada } from './recipe-generator.service';
import { TudoGostosoScraperService } from './tudogostoso-scraper.service';
import { ReceiteriaCrawlerService } from './receiteria-scraper.service';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

@Injectable()
export class RecipeSearchService {
  private readonly logger = new Logger('RecipeSearchService');
  private geminiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tudoGostoso: TudoGostosoScraperService,
    private readonly receiteria: ReceiteriaCrawlerService,
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
    const CATEGORIA_FITNESS = 'https://www.tudogostoso.com.br/categorias/1340-fitness';
    const receitas = await this.tudoGostoso.buscarReceitasPorCategoria(CATEGORIA_FITNESS, quantidade);
    return receitas.map((r) => ({ ...r, tags_dieta: ['fitness'] }));
  }

  async buscarReceitasVegetarianas(quantidade = 30): Promise<ReceitaGerada[]> {
    const receitas = await this.tudoGostoso.buscarReceitasPorKeyword('receita vegetariana', quantidade);
    return receitas.map((r) => ({ ...r, tags_dieta: ['vegetariano'] }));
  }

  async buscarReceitasVeganas(quantidade = 20): Promise<ReceitaGerada[]> {
    const receitas = await this.tudoGostoso.buscarReceitasPorKeyword('receita vegana', quantidade);
    return receitas.map((r) => ({ ...r, tags_dieta: ['vegano', 'vegetariano'] }));
  }

  // Receitas normais: keywords variadas para diversidade sem sobrecarregar Puppeteer
  async buscarReceitasNormais(quantidade = 40): Promise<ReceitaGerada[]> {
    const KEYWORDS = [
      { kw: 'frango grelhado',    qtd: 8 },
      { kw: 'carne assada',       qtd: 8 },
      { kw: 'macarrão ao molho',  qtd: 6 },
      { kw: 'peixe grelhado',     qtd: 6 },
      { kw: 'sopa caldo',         qtd: 6 },
      { kw: 'arroz feijão',       qtd: 6 },
    ];

    const todas: ReceitaGerada[] = [];
    for (const { kw, qtd } of KEYWORDS) {
      if (todas.length >= quantidade) break;
      try {
        const receitas = await this.tudoGostoso.buscarReceitasPorKeyword(kw, qtd);
        todas.push(...receitas);
      } catch (err: any) {
        this.logger.warn(`Keyword "${kw}" falhou: ${err.message}`);
      }
    }
    return todas.slice(0, quantidade);
  }

  async scraparUrl(url: string): Promise<ReceitaGerada | null> {
    if (url.includes('receiteria.com.br')) {
      return this.receiteria.scraparReceita(url);
    }
    return this.tudoGostoso.scraparReceita(url);
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
