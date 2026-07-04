import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Optional } from '@nestjs/common';
import { LlmMetricsService } from '../../metricas/llm-metrics.service';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReceitaBancoService } from './receita-banco.service';
import { RecipeValidationService } from './recipe-validation.service';
import { RecipeRagService } from './recipe-rag.service';
import { ReceitaArrayLLMSchema } from '../schemas/receita-llm.schema';
import { retryWithBackoff, isTransientError } from '@common/utils/retry.util';
import { getRequestId } from '@common/request-context';

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
  private anthropic: Anthropic | null = null;
  private gemini: any | null = null;
  private groq: Groq | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly receitaBancoService: ReceitaBancoService,
    private readonly validationService: RecipeValidationService,
    private readonly ragService: RecipeRagService,
    @Optional() private readonly llmMetrics?: LlmMetricsService,
  ) {
    const anthropicKey = this.configService.get<string>('CLAUDE_API_KEY') ||
                         this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
    }
  }

  async gerarReceitas(ingredientes: string[], forcarIA = false, modoAlimentar?: string): Promise<Receita[]> {
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

    this.logger.log(`⚡ Banco retornou ${receitasDoBanco.length} receita(s) — tentando RAG...`);

    // 2. RAG: busca semântica + adaptação com LLM (melhor qualidade que geração pura)
    let receitaRAG: Receita | null = null;
    try {
      const ragResult = await this.ragService.gerarComRAG(ingredientes, modoAlimentar);
      if (ragResult?.receita) {
        receitaRAG = {
          titulo: ragResult.receita.nome,
          descricao: ragResult.receita.descricao || '',
          ingredientes: ragResult.receita.ingredientes || [],
          modo_preparo: ragResult.receita.modo_preparo || '',
          tempo_preparo: ragResult.receita.tempo_preparo || '30 minutos',
          dificuldade: ragResult.receita.dificuldade || 'médio',
          rendimento: ragResult.receita.rendimento || '4 porções',
          tags_dieta: [],
          is_nova: true,
        };
        this.logger.log(`RAG gerou: "${receitaRAG.titulo}" (${ragResult.fonte})`);
      }
    } catch (err: any) {
      this.logger.warn('RAG indisponível:', err?.message);
    }

    // 3. Geração via Claude Haiku com os ingredientes do usuário
    const jaTemRAG = receitaRAG ? 1 : 0;
    const quantidadeGerar = forcarIA ? 5 : Math.max(1, 5 - receitasDoBanco.length - jaTemRAG);
    let receitasIA = await this.gerarComHaiku(ingredientes, quantidadeGerar);

    if (receitaRAG) receitasIA = [receitaRAG, ...receitasIA];

    if (receitasIA.length === 0) {
      this.logger.warn('⚠️ Nenhuma receita gerada — retornando banco');
      return receitasDoBanco.map((r) => this.receitaBancoService.entidadeParaFormato(r));
    }

    // 3. Valida + busca imagem + salva no banco
    const enriquecidas = await Promise.all(receitasIA.map(r => this.enriquecerReceita(r)));
    receitasIA = enriquecidas.filter((r): r is Receita => r !== null).map(r => ({ ...r, is_nova: true }));

    this.logger.log(`💾 Salvando ${receitasIA.length} receita(s) geradas no banco...`);
    await Promise.allSettled(
      receitasIA.map((r) =>
        this.receitaBancoService.salvarReceitaGerada(r).catch((err) =>
          this.logger.error(`❌ Falha ao salvar "${r.titulo}": ${err.message}`),
        ),
      ),
    );

    // 4. Combina banco + geradas
    const receitasBancoFormatadas = receitasDoBanco.map((r) =>
      this.receitaBancoService.entidadeParaFormato(r),
    );
    const resultado = [...receitasBancoFormatadas, ...receitasIA].slice(0, 5);

    this.logger.log(
      `[${getRequestId()}] ✨ Total: ${resultado.length} receita(s) (${receitasDoBanco.length} banco + ${receitasIA.length} IA)`,
    );
    return resultado;
  }

  private buildPromptReceitas(ingredientes: string[], quantidade: number): { system: string; user: string } {
    const system = `Você é um chef brasileiro apaixonado por culinária regional. Especialista em transformar ingredientes simples em pratos memoráveis.

REGRAS ABSOLUTAS:
- Títulos SEMPRE específicos e apetitosos. PROIBIDO: "Arroz com Frango", "Bolo Simples", "Macarrão ao Molho". OBRIGATÓRIO: especificar o preparo, toque especial, textura ou aroma. Ex: "Peito de Frango Selado ao Molho Rústico de Passata com Alho Confit"
- Descrições DESPERTAM FOME: mencionar textura ("crocante por fora, cremoso por dentro"), aroma ("perfumado com alho dourado"), sabor ("agridoce com toque de limão")
- Modo de preparo com TÉCNICAS reais: temperatura, tempo preciso, ponto visual ("até soltar do fundo"), dicas de chef
- Retornar APENAS JSON puro, sem markdown, sem texto extra`;

    const exemplos = `EXEMPLOS do padrão de qualidade esperado (não use esses títulos, inspire-se no estilo):
- "Canjica Cremosa de Panela com Leite Condensado e Canela em Pau" / "Grãos macios banhados em creme aveludado, perfumado com canela e cravo"
- "Peito de Frango Selado ao Molho Rústico de Passata com Alho Confit" / "Crosta dourada por fora, suculento por dentro, molho encorpado reduzido lentamente"
- "Espaguete ao Creme de Queijo Mineiro com Abobrinha Grelhada" / "Massa al dente envolta em creme sedoso, abobrinha com marcas de grelha e pimenta-do-reino"`;

    const user = `INGREDIENTES DISPONÍVEIS NA DESPENSA:
${ingredientes.slice(0, 15).join(', ')}

${exemplos}

Crie ${quantidade} receitas originais, cada uma com combinação e técnica DIFERENTE. Varie as categorias (almoço, jantar, café da manhã, lanche, sobremesa).

Retorne APENAS array JSON com exatamente ${quantidade} receitas:
[
  {
    "titulo": "Título Específico e Apetitoso",
    "descricao": "Uma frase que desperta fome — textura, sabor ou aroma",
    "ingredientes": ["2 xícaras de canjica branca lavada e de molho 8h", "1 lata de leite condensado gelado"],
    "modo_preparo": "Passo 1. ...\nPasso 2. ...",
    "tempo_preparo": "45 minutos",
    "dificuldade": "fácil",
    "rendimento": "6 porções",
    "tags_dieta": []
  }
]`;

    return { system, user };
  }

  private parseReceitasJson(raw: string, quantidade: number): Receita[] {
    const clean = raw.trim().replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(clean);
    const array = Array.isArray(parsed) ? parsed : (parsed?.receitas ?? []);
    const result = ReceitaArrayLLMSchema.safeParse(array.slice(0, quantidade));
    if (!result.success) {
      this.logger.warn(`Zod: schema inválido no retorno do LLM — ${result.error.issues.map((i) => i.message).join('; ')}`);
      return [];
    }
    return result.data as Receita[];
  }

  private async gerarComHaiku(ingredientes: string[], quantidade: number): Promise<Receita[]> {
    const { system, user } = this.buildPromptReceitas(ingredientes, quantidade);

    // Tenta Haiku primeiro, com retry em erros transitórios (429, 503, timeout)
    if (this.anthropic) {
      const t0 = Date.now();
      try {
        const msg = await retryWithBackoff(
          () => this.anthropic!.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            system,
            messages: [{ role: 'user', content: user }],
          }),
          { maxAttempts: 3, initialDelayMs: 500, shouldRetry: isTransientError },
        );
        this.logger.log(
          `[${getRequestId()}] Haiku tokens — input: ${msg.usage.input_tokens}, output: ${msg.usage.output_tokens}`,
        );
        this.llmMetrics?.registrar({
          contexto: 'geracao', provider: 'anthropic', modelo: 'claude-haiku-4-5-20251001',
          tokens_in: msg.usage.input_tokens, tokens_out: msg.usage.output_tokens,
          latencia_ms: Date.now() - t0, sucesso: true,
        }).catch(() => {});
        return this.parseReceitasJson((msg.content[0] as any).text, quantidade);
      } catch (err: any) {
        this.logger.warn(`Haiku falhou após retries (${err.status ?? err.message}) — tentando Groq...`);
        this.llmMetrics?.registrar({
          contexto: 'geracao', provider: 'anthropic', modelo: 'claude-haiku-4-5-20251001',
          latencia_ms: Date.now() - t0, sucesso: false, erro: String(err.status ?? err.message),
        }).catch(() => {});
      }
    }

    // Fallback 1: Gemini Flash
    if (this.gemini) {
      const t0 = Date.now();
      try {
        this.logger.log('⚡ Gerando com Gemini Flash...');
        const prompt = `${system}\n\n${user}`;
        const result = await this.gemini.generateContent(prompt);
        const raw = result.response.text();
        this.llmMetrics?.registrar({
          contexto: 'geracao', provider: 'gemini', modelo: 'gemini-2.0-flash',
          latencia_ms: Date.now() - t0, sucesso: true,
        }).catch(() => {});
        return this.parseReceitasJson(raw, quantidade);
      } catch (err: any) {
        this.logger.warn(`Gemini falhou (${err.message}) — tentando Groq...`);
        this.llmMetrics?.registrar({
          contexto: 'geracao', provider: 'gemini', modelo: 'gemini-2.0-flash',
          latencia_ms: Date.now() - t0, sucesso: false, erro: String(err.message),
        }).catch(() => {});
      }
    }

    // Fallback 2: Groq (Llama 3.3 70B) — gratuito
    if (this.groq) {
      const t0 = Date.now();
      try {
        this.logger.log('⚡ Gerando com Groq Llama 3.3 70B...');
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user + '\n\nIMPORTANTE: responda com objeto JSON {"receitas": [...]}' },
          ],
        });
        const raw = resp.choices[0]?.message?.content ?? '{}';
        const obj = JSON.parse(raw);
        const arr = Array.isArray(obj) ? obj : (obj.receitas ?? []);
        this.llmMetrics?.registrar({
          contexto: 'geracao', provider: 'groq', modelo: 'llama-3.3-70b-versatile',
          tokens_in: resp.usage?.prompt_tokens, tokens_out: resp.usage?.completion_tokens,
          latencia_ms: Date.now() - t0, sucesso: true,
        }).catch(() => {});
        return this.parseReceitasJson(JSON.stringify(arr), quantidade);
      } catch (err: any) {
        this.logger.error(`Groq falhou: ${err.message}`);
        this.llmMetrics?.registrar({
          contexto: 'geracao', provider: 'groq', modelo: 'llama-3.3-70b-versatile',
          latencia_ms: Date.now() - t0, sucesso: false, erro: String(err.message),
        }).catch(() => {});
      }
    }

    this.logger.warn('Nenhum provider IA disponível');
    return [];
  }


  async enriquecerReceita(receita: Receita): Promise<Receita | null> {
    const [imagem_url, validacao] = await Promise.all([
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
        model: 'claude-haiku-4-5-20251001',
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
    // Retorna primeira candidata — sem custo adicional de IA para seleção de imagem
    return candidatas[0].url;
  }
}
