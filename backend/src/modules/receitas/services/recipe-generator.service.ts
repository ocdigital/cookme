import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { ReceitaBancoService } from './receita-banco.service';
import { RecipeSearchService } from './recipe-search.service';
import { RecipeValidationService } from './recipe-validation.service';

export interface Receita {
  titulo: string;
  descricao: string;
  tempo_preparo: string;
  dificuldade: 'fácil' | 'médio' | 'difícil';
  ingredientes: string[];
  modo_preparo: string;
  rendimento: string;
  imagem_url?: string;
  is_nova?: boolean;
  url_fonte?: string;
  site_origem?: string;
  avaliacao?: number;
  tags_dieta?: string[];
  validation_score?: number | null;
  validation_issues?: string[];
}

@Injectable()
export class RecipeGeneratorService {
  private readonly logger = new Logger('RecipeGeneratorService');
  private geminiModel: any;
  private anthropic: Anthropic | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly receitaBancoService: ReceitaBancoService,
    private readonly recipeSearchService: RecipeSearchService,
    private readonly validationService: RecipeValidationService,
  ) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
    const anthropicKey = this.configService.get<string>('CLAUDE_API_KEY') ||
                         this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
  }

  async gerarReceitas(ingredientes: string[], forcarIA = false): Promise<Receita[]> {
    if (ingredientes.length === 0) return [];

    // 1. Banco compartilhado — receitas reais já salvas de buscas anteriores
    // forcarIA=true pula banco e vai direto para scraping (usuário quer novas receitas)
    let receitasDoBanco: any[] = [];
    if (!forcarIA) {
      this.logger.log(`🔍 Buscando no banco para ${ingredientes.length} ingredientes...`);
      receitasDoBanco = await this.receitaBancoService.buscarPorIngredientes(ingredientes, 0.4, 5);
      if (receitasDoBanco.length >= 5) {
        this.logger.log(`✅ Banco retornou ${receitasDoBanco.length} receitas`);
        return receitasDoBanco.map((r) => this.receitaBancoService.entidadeParaFormato(r));
      }
    } else {
      this.logger.log(`🔄 forcarIA=true — pulando banco, buscando novas na web`);
    }

    this.logger.log(`⚡ Banco retornou ${receitasDoBanco.length} receita(s) — buscando na web...`);

    // 2. Scraping de sites reais de receitas
    const quantidadeBuscar = forcarIA ? 6 : Math.max(3, 5 - receitasDoBanco.length);
    this.logger.log(`🌐 Buscando ${quantidadeBuscar} receita(s) na internet...`);
    let receitasWeb = await this.recipeSearchService.buscarReceitasReais(ingredientes, quantidadeBuscar);

    if (receitasWeb.length === 0) {
      this.logger.warn('⚠️ Nenhuma receita encontrada nos sites');
      return receitasDoBanco.map((r) => this.receitaBancoService.entidadeParaFormato(r));
    }

    // 3. Filtra receitas web pelo cobertura de ingredientes do usuário
    const normalizados = ingredientes.map(i =>
      i.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    );

    const receitasFiltradas = receitasWeb.filter(receita => {
      const chaves = this.receitaBancoService.extrairChaves(receita.ingredientes);
      if (chaves.length === 0) return false;

      let pesoTotal = 0;
      let pesoEncontrado = 0;
      for (const chave of chaves) {
        const peso = this.receitaBancoService.pesoIngrediente(chave, receita.titulo);
        pesoTotal += peso;
        // Normaliza a chave também (remove acentos) para comparação consistente
        const chaveNorm = chave.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (normalizados.some(n => n.includes(chaveNorm) || chaveNorm.includes(n))) {
          pesoEncontrado += peso;
        }
      }

      const cobertura = pesoTotal > 0 ? pesoEncontrado / pesoTotal : 0;
      if (cobertura >= 0.25) {
        this.logger.log(`✅ "${receita.titulo}" cobertura ${Math.round(cobertura * 100)}%`);
        return true;
      }
      this.logger.debug(`❌ "${receita.titulo}" cobertura ${Math.round(cobertura * 100)}% — descartada`);
      return false;
    });

    receitasWeb = receitasFiltradas.slice(0, quantidadeBuscar);

    if (receitasWeb.length === 0) {
      this.logger.warn('⚠️ Nenhuma receita web passou o filtro de cobertura — retornando banco');
      return receitasDoBanco.map((r) => this.receitaBancoService.entidadeParaFormato(r));
    }

    // 4. Reescreve, valida e busca imagem (Mestre Cuca pipeline)
    const enriquecidas = await Promise.all(receitasWeb.map(r => this.enriquecerReceita(r)));
    receitasWeb = enriquecidas.filter((r): r is Receita => r !== null).map(r => ({ ...r, is_nova: true }));

    // 5. Salva receitas reais no banco para próximos usuários
    this.logger.log(`💾 Salvando ${receitasWeb.length} receita(s) no banco...`);
    await Promise.allSettled(
      receitasWeb.map((r) =>
        this.receitaBancoService.salvarReceitaGerada(r).catch((err) =>
          this.logger.error(`❌ Falha ao salvar "${r.titulo}": ${err.message}`),
        ),
      ),
    );

    // 6. Combina banco + web
    const receitasBancoFormatadas = receitasDoBanco.map((r) =>
      this.receitaBancoService.entidadeParaFormato(r),
    );
    const resultado = [...receitasBancoFormatadas, ...receitasWeb].slice(0, 5);

    this.logger.log(
      `✨ Total: ${resultado.length} receita(s) (${receitasDoBanco.length} banco + ${receitasWeb.length} web)`,
    );
    return resultado;
  }

  async importarReceitaPorUrl(url: string, proprietarioId?: string): Promise<{ receita: any; nova: boolean }> {
    const scraped = await this.recipeSearchService.scraparUrl(url);
    if (!scraped) throw new Error(`Não foi possível extrair receita de: ${url}`);

    const enriquecida = await this.enriquecerReceita(scraped);
    if (!enriquecida) throw new Error(`Receita "${scraped.titulo}" rejeitada pela validação automática`);
    const salva = await this.receitaBancoService.salvarReceitaGerada(enriquecida, proprietarioId);
    this.logger.log(`Importado "${salva.nome}" de ${url}${proprietarioId ? ` (privado: ${proprietarioId})` : ''}`);
    return { receita: this.receitaBancoService.entidadeParaFormato(salva), nova: true };
  }

  async popularReceitasFitness(): Promise<number> {
    return this.popularModoAlimentar('fitness');
  }

  async popularModoAlimentar(modo: 'normal' | 'fitness' | 'vegetariano' | 'vegano'): Promise<number> {
    const LABEL = { normal: '🍽️', fitness: '🏋️', vegetariano: '🥗', vegano: '🌱' }[modo];
    this.logger.log(`${LABEL} Populando banco: receitas ${modo} do TudoGostoso...`);

    let receitas: Receita[];
    if (modo === 'normal') {
      receitas = await this.recipeSearchService.buscarReceitasNormais(100);
    } else if (modo === 'fitness') {
      receitas = await this.recipeSearchService.buscarReceitasFitness(50);
    } else if (modo === 'vegetariano') {
      receitas = await this.recipeSearchService.buscarReceitasVegetarianas(50);
    } else {
      receitas = await this.recipeSearchService.buscarReceitasVeganas(40);
    }

    if (receitas.length === 0) return 0;

    let salvas = 0;
    let descartadas = 0;
    await Promise.allSettled(
      receitas.map(async (r) => {
        // Validação determinística obrigatória antes de salvar
        const det = this.validationService.validarDeterministico({
          titulo: r.titulo,
          ingredientes: r.ingredientes,
          modo_preparo: r.modo_preparo,
        });
        if (!det.ok) {
          this.logger.warn(`🚫 Descartando "${r.titulo}": ${det.motivo}`);
          descartadas++;
          return;
        }
        if (!r.imagem_url) r.imagem_url = await this.buscarImagemReceita(r.titulo);
        // Salva sem validação IA — moderação manual pelo admin ou batch posterior
        r.validation_score = null;
        r.validation_issues = [];
        await this.receitaBancoService.salvarReceitaGerada(r);
        salvas++;
      }),
    );

    this.logger.log(`✅ ${salvas} receitas ${modo} salvas, ${descartadas} descartadas`);
    return salvas;
  }

  async enriquecerReceita(receita: Receita): Promise<Receita | null> {
    const [modo_preparo, imagem_url, validacao] = await Promise.all([
      this.reescreverModoPreparo(receita.titulo, receita.ingredientes, receita.modo_preparo),
      receita.imagem_url ? Promise.resolve(receita.imagem_url) : this.buscarImagemReceita(receita.titulo),
      this.validationService.validar({
        titulo: receita.titulo,
        ingredientes: receita.ingredientes,
        modo_preparo: receita.modo_preparo,
        tempo_preparo: receita.tempo_preparo,
        rendimento: receita.rendimento,
      }),
    ]);

    if (validacao.status === 'descartar') {
      this.logger.warn(`"${receita.titulo}" descartada (score ${validacao.score}): ${validacao.issues.join(', ')}`);
      return null;
    }

    return {
      ...receita,
      modo_preparo,
      imagem_url,
      validation_score: validacao.score,
      validation_issues: validacao.issues,
    };
  }

  async reescreverModoPreparo(titulo: string, ingredientes: string[], modoOriginal: string): Promise<string> {
    if (!this.anthropic) return modoOriginal;
    try {
      const prompt = `Você é um chef que reescreve receitas. Reescreva o modo de preparo abaixo com suas próprias palavras.

REGRAS OBRIGATÓRIAS:
1. Use APENAS os ingredientes listados abaixo — NUNCA mencione ingredientes que não estão na lista
2. Mantenha os mesmos passos e técnicas do original
3. Use linguagem clara e amigável
4. NÃO adicione ingredientes, temperos ou itens extras

Receita: ${titulo}
Ingredientes disponíveis (USE APENAS ESTES): ${ingredientes.slice(0, 15).join(', ')}

Modo de preparo original (reescrever sem copiar):
${modoOriginal}

Retorne APENAS o modo de preparo reescrito, sem título, sem comentários.`;

      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      });
      const reescrito = (msg.content[0] as any).text.trim();
      if (reescrito && reescrito.length > 50) return reescrito;
    } catch (err: any) {
      this.logger.warn(`Falha ao reescrever modo_preparo de "${titulo}": ${err.message}`);
    }
    return modoOriginal;
  }

  async buscarImagemReceita(titulo: string): Promise<string | undefined> {
    try {
      const imagemUnsplash = await this.buscarImagemUnsplash(titulo);
      if (imagemUnsplash) return imagemUnsplash;
    } catch (err: any) {
      this.logger.error(`Erro ao buscar imagem para "${titulo}": ${err.message}`);
    }

    const placeholders = [
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504674900967-60f4a61f5a6e?w=400&h=300&fit=crop',
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  private async buscarImagemUnsplash(titulo: string): Promise<string | undefined> {
    const apiKey = this.configService.get<string>('UNSPLASH_API_KEY');
    if (!apiKey) return undefined;

    const tituloEn = titulo
      .toLowerCase()
      .replace(/\bfrango\b/g, 'chicken').replace(/\bcarne\b/g, 'beef').replace(/\bpeixe\b/g, 'fish')
      .replace(/\bcamarão\b|\bcamarao\b/g, 'shrimp').replace(/\bporco\b|\bsuíno\b/g, 'pork')
      .replace(/\barroz\b/g, 'rice').replace(/\bfeijão\b|\bfeijao\b/g, 'beans')
      .replace(/\bmacarrão\b|\bmacarrao\b/g, 'pasta').replace(/\bbolo\b/g, 'cake')
      .replace(/\bsopa\b/g, 'soup').replace(/\bsalada\b/g, 'salad').replace(/\bpão\b|\bpao\b/g, 'bread')
      .replace(/\bpizza\b/g, 'pizza').replace(/\btorta\b/g, 'pie').replace(/\bstrogonoff\b/g, 'stroganoff')
      .replace(/\bfeijoada\b/g, 'feijoada brazilian stew').replace(/\blasanha\b/g, 'lasagna')
      .replace(/\bchocolate\b/g, 'chocolate').replace(/\bmorango\b/g, 'strawberry');
    const queries = [`${tituloEn} food dish`, `${titulo} receita brasileira`, 'brazilian food dish plated'];
    const candidatas: { url: string; thumbUrl: string }[] = [];

    try {
      this.logger.debug(`📸 Buscando candidatas em Unsplash: "${titulo}"`);
      for (const query of queries) {
        if (candidatas.length >= 5) break;
        const response = await axios.get('https://api.unsplash.com/search/photos', {
          params: { query, per_page: 5, orientation: 'landscape' },
          headers: { Authorization: `Client-ID ${apiKey}` },
          timeout: 8000,
        });
        const results = response.data?.results ?? [];
        for (const r of results) {
          if (candidatas.length >= 5) break;
          const url = r.urls?.regular || r.urls?.small;
          const thumbUrl = r.urls?.thumb || r.urls?.small;
          if (url) candidatas.push({ url, thumbUrl });
        }
      }
    } catch (err: any) {
      this.logger.debug(`Unsplash error: ${err.message}`);
    }

    if (candidatas.length === 0) return undefined;
    if (candidatas.length === 1 || !this.geminiModel) return candidatas[0].url;

    // Gemini Vision: escolhe a candidata mais relevante para o título
    try {
      const thumbUrls = candidatas.map((c, i) => `${i}: ${c.thumbUrl}`).join('\n');
      const prompt = `Você é um chef avaliando imagens de comida. Qual das URLs abaixo melhor representa visualmente a receita "${titulo}"?

${thumbUrls}

Responda APENAS com o número do índice (0 a ${candidatas.length - 1}) ou -1 se nenhuma for adequada.`;

      const result = await this.geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const idx = parseInt(text.replace(/\D/g, '')) ?? -1;
      if (idx >= 0 && idx < candidatas.length) {
        this.logger.debug(`📸 Gemini escolheu candidata ${idx} para "${titulo}"`);
        return candidatas[idx].url;
      }
    } catch (err: any) {
      this.logger.debug(`Gemini Vision error para "${titulo}": ${err.message}`);
    }

    return candidatas[0].url;
  }
}
