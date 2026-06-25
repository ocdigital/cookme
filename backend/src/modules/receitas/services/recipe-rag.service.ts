import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { Receita } from '../entities/receita.entity';
import { ReceitaRAGSchema } from '../schemas/receita-llm.schema';
import { getRequestId } from '@common/request-context';

const RAG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

@Injectable()
export class RecipeRagService {
  private readonly logger = new Logger(RecipeRagService.name);
  private anthropic: Anthropic | null = null;
  private geminiApiKey: string | null = null;
  private readonly similaresCache = new Map<string, { result: Receita[]; expiresAt: number }>();

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    const anthropicKey = this.config.get<string>('CLAUDE_API_KEY') || this.config.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) this.anthropic = new Anthropic({ apiKey: anthropicKey });
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY') || null;
  }

  // ── Embeddings via Gemini text-embedding-004 (768 dims, gratuito) ──────────

  async gerarEmbedding(texto: string): Promise<number[] | null> {
    if (!this.geminiApiKey) return null;
    try {
      const axios = (await import('axios')).default;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.geminiApiKey}`;
      const res = await axios.post(url, {
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: texto }] },
        outputDimensionality: 768,
      });
      return res.data?.embedding?.values ?? null;
    } catch (err: any) {
      this.logger.error('Erro ao gerar embedding:', err?.response?.data || err.message);
      return null;
    }
  }

  private textoParaEmbedding(receita: Receita): string {
    const ingredientes = (receita.ingredientes_chave || []).join(', ');
    return `receita: ${receita.nome}. ingredientes: ${ingredientes}. categoria: ${receita.categoria_receita || ''}. dieta: ${(receita.tags_dieta || []).join(', ')}`;
  }

  // ── Indexar receitas sem embedding ─────────────────────────────────────────

  async indexarReceitas(limite = 50): Promise<number> {
    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where('r.embedding IS NULL')
      .andWhere("r.status_moderacao = 'ok'")
      .limit(limite)
      .getMany();

    if (receitas.length === 0) {
      this.logger.log('Todas as receitas já estão indexadas');
      return 0;
    }

    this.logger.log(`Indexando ${receitas.length} receitas...`);
    let indexadas = 0;

    for (const receita of receitas) {
      const texto = this.textoParaEmbedding(receita);
      const embedding = await this.gerarEmbedding(texto);
      if (!embedding) continue;

      await this.dataSource.query(
        'UPDATE receitas SET embedding = $1 WHERE id = $2',
        [`[${embedding.join(',')}]`, receita.id],
      );
      indexadas++;
    }

    this.logger.log(`✅ ${indexadas}/${receitas.length} receitas indexadas`);
    return indexadas;
  }

  async totalIndexadas(): Promise<{ indexadas: number; total: number }> {
    const [{ indexadas }] = await this.dataSource.query(
      "SELECT COUNT(*) as indexadas FROM receitas WHERE embedding IS NOT NULL AND status_moderacao = 'ok'",
    );
    const [{ total }] = await this.dataSource.query(
      "SELECT COUNT(*) as total FROM receitas WHERE status_moderacao = 'ok'",
    );
    return { indexadas: Number(indexadas), total: Number(total) };
  }

  // ── Busca semântica ─────────────────────────────────────────────────────────

  // apenasPublicas=false → RAG usa tudo como contexto interno (incluindo scrapeadas se existirem)
  // apenasPublicas=true  → apenas receitas CookMe para exibir ao usuário
  async buscarSimilares(ingredientes: string[], limite = 5, tagsDieta?: string[], apenasPublicas = false): Promise<Receita[]> {
    const cacheKey = createHash('md5')
      .update(JSON.stringify({ ingredientes: [...ingredientes].sort(), limite, tagsDieta, apenasPublicas }))
      .digest('hex');

    const cached = this.similaresCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.log('RAG cache hit — pulando embedding API');
      return cached.result;
    }

    const query = `ingredientes disponíveis: ${ingredientes.join(', ')}`;
    const embedding = await this.gerarEmbedding(query);
    if (!embedding) {
      this.logger.warn('Sem embedding — fallback para busca textual');
      return [];
    }

    let sql = `
      SELECT *, 1 - (embedding <=> $1::vector) AS similaridade
      FROM receitas
      WHERE embedding IS NOT NULL
        AND status_moderacao = 'ok'
    `;
    const params: any[] = [`[${embedding.join(',')}]`];

    if (apenasPublicas) {
      sql += ` AND (url_fonte IS NULL OR autor_id IS NOT NULL)`;
    }

    if (tagsDieta && tagsDieta.length > 0) {
      const dieta = tagsDieta[0];
      params.push(dieta);
      sql += ` AND (tags_dieta IS NULL OR tags_dieta = '' OR tags_dieta LIKE $${params.length})`;
    }

    sql += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limite);

    const resultados = await this.dataSource.query(sql, params);
    this.similaresCache.set(cacheKey, { result: resultados, expiresAt: Date.now() + RAG_CACHE_TTL_MS });
    return resultados;
  }

  // ── RAG: busca + adapta com Haiku ──────────────────────────────────────────

  async gerarComRAG(
    ingredientes: string[],
    modoAlimentar?: string,
    tipoRefeicao?: string,
  ): Promise<{ receita: any; fonte: string } | null> {
    if (!this.anthropic) return null;

    const tagsDieta = modoAlimentar && modoAlimentar !== 'normal' ? [modoAlimentar] : undefined;
    const similares = await this.buscarSimilares(ingredientes, 5, tagsDieta);

    if (similares.length === 0) {
      this.logger.warn('RAG: nenhuma receita similar encontrada');
      return null;
    }

    this.logger.log(`RAG: ${similares.length} receitas similares encontradas`);

    const contextoReceitas = similares.slice(0, 3).map((r: any, i: number) => `
RECEITA ${i + 1}: ${r.nome} (${(r.similaridade * 100).toFixed(0)}% similar)
Ingredientes: ${(r.ingredientes_chave || []).slice(0, 10).join(', ')}
Preparo resumido: ${r.modo_preparo?.substring(0, 200) || 'não disponível'}
`).join('\n---\n');

    const prompt = `Você é um chef especialista. O usuário tem estes ingredientes disponíveis:
${ingredientes.join(', ')}

Aqui estão receitas reais similares do nosso banco:
${contextoReceitas}

Adapte a receita mais adequada para usar os ingredientes que o usuário TEM.
- Use APENAS ingredientes que o usuário possui (pode omitir ingredientes secundários)
- Mantenha a técnica culinária da receita original
- Se precisar de poucos ingredientes extras, mencione-os como opcionais
- Modo alimentar: ${modoAlimentar || 'normal'}
- Tipo de refeição: ${tipoRefeicao || 'qualquer'}

Responda em JSON:
{
  "nome": "nome da receita adaptada",
  "descricao": "descrição breve",
  "ingredientes": ["ingrediente 1 com quantidade", ...],
  "modo_preparo": "passo a passo completo",
  "tempo_preparo": "XX minutos",
  "dificuldade": "fácil|médio|difícil",
  "rendimento": "X porções",
  "baseada_em": "nome da receita original"
}`;

    let texto: string | null = null;

    // Tentar Haiku primeiro, fallback para Gemini
    if (this.anthropic) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        this.logger.log(
          `[${getRequestId()}] RAG Haiku tokens — input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`,
        );
        texto = (response.content[0] as any).text;
      } catch (err: any) {
        this.logger.warn('Haiku indisponível para RAG, usando Gemini:', err?.message);
      }
    }

    if (!texto && this.geminiApiKey) {
      try {
        const axios = (await import('axios')).default;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024 },
        });
        texto = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      } catch (err) {
        this.logger.error('Erro no RAG com Gemini:', err);
      }
    }

    if (!texto) return null;

    try {
      const jsonMatch = texto.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      const result = ReceitaRAGSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`RAG Zod: schema inválido — ${result.error.issues.map((i) => i.message).join('; ')}`);
        return null;
      }
      return {
        receita: result.data,
        fonte: `RAG (baseada em: ${result.data.baseada_em || similares[0]?.nome})`,
      };
    } catch (err) {
      this.logger.error('Erro ao parsear JSON do RAG:', err);
      return null;
    }
  }
}
