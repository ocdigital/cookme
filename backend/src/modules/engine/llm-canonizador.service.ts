import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';

/**
 * Tier de IA da cauda longa — chamado APENAS quando os estágios
 * determinísticos falham (confiança < LIMIAR_IA). Regras de custo:
 *
 * 1. Resultado grava na KB → aquele item NUNCA mais gasta IA (nenhum cliente).
 * 2. Gemini Flash (barato: ~US$ 0,0001/item) — não é o Haiku de geração.
 * 3. ENGINE_IA_HABILITADA=false desliga o tier inteiro (killswitch de custo).
 *
 * O prompt pede resposta estrita para parse determinístico; resposta fora do
 * formato = descarta (a Engine mantém o resultado do estágio anterior).
 */
@Injectable()
export class LlmCanonizadorService {
  private readonly logger = new Logger(LlmCanonizadorService.name);
  private readonly apiKey: string | null;
  private readonly ativo: boolean;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ProductKnowledgeBase)
    private readonly kbRepo: Repository<ProductKnowledgeBase>,
  ) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || null;
    this.ativo = this.config.get<string>('ENGINE_IA_HABILITADA') !== 'false';
  }

  get habilitado(): boolean {
    return this.ativo && this.apiKey !== null;
  }

  async canonizar(
    descricao: string,
    ean?: string,
  ): Promise<{ produto_canonico: string } | null> {
    if (!this.habilitado) return null;

    try {
      const axios = (await import('axios')).default;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

      const prompt = `Você é um especialista em cupons fiscais de supermercado brasileiros.
Canonize a descrição de produto abaixo para o nome genérico do produto, em minúsculas,
sem marca, sem peso/volume, sem embalagem.

Exemplos:
"CR LEITE ITALAC 200GR" -> creme de leite
"BISC PASSATEMPO RECH CHOC 130G" -> biscoito recheado
"FILE PEITO FGO CONG SEARA KG" -> peito de frango
"AGUA MIN S/GAS CRYSTAL 500ML" -> água mineral
"PAPEL ALUMINIO WYDA 30CM" -> papel alumínio

Responda APENAS com o nome canônico, nada mais.

Descrição: "${descricao}"`;

      const res = await axios.post(
        url,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 30, temperature: 0 } },
        { timeout: 8000 },
      );

      const texto: string = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
      // Validação estrita: 2-60 chars, sem quebra de linha, sem prefixo de resposta
      if (!texto || texto.length < 2 || texto.length > 60 || texto.includes('\n')) return null;
      const canonico = texto.toLowerCase().replace(/["'.]/g, '').trim();

      await this.aprender(descricao, canonico, ean);
      this.logger.debug(`IA canonizou: "${descricao}" → "${canonico}"`);
      return { produto_canonico: canonico };
    } catch (e: any) {
      this.logger.warn(`Tier IA falhou para "${descricao}": ${e.message}`);
      return null;
    }
  }

  /** Persiste na KB — o item nunca mais precisa de IA (flywheel de custo zero). */
  private async aprender(descricao: string, canonico: string, ean?: string): Promise<void> {
    try {
      const normalized = descricao.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50);
      const existente = await this.kbRepo.findOne({ where: { normalized_name: normalized } });
      if (existente) {
        const update: Partial<ProductKnowledgeBase> = {};
        if (!existente.canonical_ingredient) update.canonical_ingredient = canonico;
        if (ean && !existente.codigo_barras) update.codigo_barras = ean.slice(0, 14);
        if (Object.keys(update).length > 0) await this.kbRepo.update(existente.id, update);
      } else {
        await this.kbRepo.save(
          this.kbRepo.create({
            product_name: descricao.slice(0, 255),
            normalized_name: normalized,
            canonical_ingredient: canonico,
            codigo_barras: ean?.slice(0, 14) ?? null,
            confidence_score: 0.7,
          } as Partial<ProductKnowledgeBase>),
        );
      }
    } catch (e: any) {
      this.logger.warn(`Falha ao aprender "${descricao}": ${e.message}`);
    }
  }
}
