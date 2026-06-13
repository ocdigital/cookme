import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  validation_score?: number;
  validation_issues?: string[];
}

@Injectable()
export class RecipeGeneratorService {
  private readonly logger = new Logger('RecipeGeneratorService');
  private geminiModel: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly receitaBancoService: ReceitaBancoService,
    private readonly recipeSearchService: RecipeSearchService,
    private readonly validationService: RecipeValidationService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

  async importarReceitaPorUrl(url: string): Promise<{ receita: any; nova: boolean }> {
    const scraped = await this.recipeSearchService.scraparUrl(url);
    if (!scraped) throw new Error(`Não foi possível extrair receita de: ${url}`);

    const enriquecida = await this.enriquecerReceita(scraped);
    if (!enriquecida) throw new Error(`Receita "${scraped.titulo}" rejeitada pela validação automática`);
    const salva = await this.receitaBancoService.salvarReceitaGerada(enriquecida);
    this.logger.log(`Importado "${salva.nome}" de ${url}`);
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
      receitas = await this.recipeSearchService.buscarReceitasNormais(60);
    } else if (modo === 'fitness') {
      receitas = await this.recipeSearchService.buscarReceitasFitness(30);
    } else if (modo === 'vegetariano') {
      receitas = await this.recipeSearchService.buscarReceitasVegetarianas(30);
    } else {
      receitas = await this.recipeSearchService.buscarReceitasVeganas(20);
    }

    if (receitas.length === 0) return 0;

    let salvas = 0;
    await Promise.allSettled(
      receitas.map(async (r) => {
        if (!r.imagem_url) r.imagem_url = await this.buscarImagemReceita(r.titulo);
        await this.receitaBancoService.salvarReceitaGerada(r);
        salvas++;
      }),
    );

    this.logger.log(`✅ ${salvas} receitas ${modo} salvas`);
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
    if (!this.geminiModel) return modoOriginal;
    try {
      const prompt = `Você é um chef que escreve receitas originais. Reescreva o modo de preparo abaixo com suas próprias palavras, mantendo os mesmos passos e técnicas mas sem copiar o texto original. Use linguagem clara e amigável.

Receita: ${titulo}
Ingredientes: ${ingredientes.slice(0, 10).join(', ')}

Modo de preparo original (NÃO copiar):
${modoOriginal}

Retorne APENAS o modo de preparo reescrito, sem título, sem comentários extras.`;

      const result = await this.geminiModel.generateContent(prompt);
      const reescrito = result.response.text().trim();
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

    const queries = [`${titulo} food`, titulo, 'comida brasileira caseira'];

    try {
      this.logger.debug(`📸 Buscando em Unsplash: "${titulo}"`);
      for (const query of queries) {
        const response = await axios.get('https://api.unsplash.com/search/photos', {
          params: { query, per_page: 3, orientation: 'landscape' },
          headers: { Authorization: `Client-ID ${apiKey}` },
          timeout: 8000,
        });

        const results = response.data?.results;
        if (results?.length > 0) {
          return results[0].urls?.regular || results[0].urls?.small;
        }
      }
    } catch (err: any) {
      this.logger.debug(`Unsplash error: ${err.message}`);
    }
    return undefined;
  }
}
