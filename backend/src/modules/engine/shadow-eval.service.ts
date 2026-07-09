import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShadowEvalAmostra } from './shadow-eval-amostra.entity';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';

function loteSemanaAtual(data = new Date()): string {
  // ISO week number — simples e suficiente pra chave de agrupamento
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
}

/**
 * Shadow eval (PLANO_PRECISAO_ENGINE.md §11 A8): o golden set é curado a
 * partir dos erros que já vimos — enviesado por construção, sempre otimista.
 * A acurácia que vai pro contrato B2B precisa vir de amostra ALEATÓRIA e às
 * cegas do que o tráfego real produziu — sem filtrar por confiança (senão
 * vira outra versão do golden). Roda semanalmente, acumula rótulo humano aos
 * poucos, calcula acurácia só sobre o que já foi rotulado.
 */
@Injectable()
export class ShadowEvalService {
  private readonly logger = new Logger(ShadowEvalService.name);

  constructor(
    @InjectRepository(ShadowEvalAmostra)
    private readonly amostraRepo: Repository<ShadowEvalAmostra>,
    @InjectRepository(ProductKnowledgeBase)
    private readonly kbRepo: Repository<ProductKnowledgeBase>,
  ) {}

  async amostrar(n = 30): Promise<{ lote_semana: string; amostradas: number }> {
    const loteSemana = loteSemanaAtual();

    const linhas: Array<{
      product_name: string;
      canonical_ingredient: string | null;
      origem_estagio: string | null;
    }> = await this.kbRepo.query(
      `SELECT product_name, canonical_ingredient, origem_estagio
       FROM product_knowledge_base
       WHERE canonical_ingredient IS NOT NULL
       ORDER BY random()
       LIMIT $1`,
      [n],
    );

    for (const linha of linhas) {
      await this.amostraRepo.save(
        this.amostraRepo.create({
          lote_semana: loteSemana,
          descricao_original: linha.product_name,
          produto_canonizado: linha.canonical_ingredient ?? '',
          origem_estagio: linha.origem_estagio,
          rotulo_correto: null,
          acertou: null,
        }),
      );
    }

    this.logger.log(`Shadow eval: ${linhas.length} amostras sorteadas para o lote ${loteSemana}`);
    return { lote_semana: loteSemana, amostradas: linhas.length };
  }

  /** Humano rotula às cegas — nunca vê o que a Engine respondeu antes de decidir o correto. */
  async rotular(id: string, rotuloCorreto: string): Promise<void> {
    const amostra = await this.amostraRepo.findOne({ where: { id } });
    if (!amostra) return;

    const acertou = rotuloCorreto.trim().toLowerCase() === amostra.produto_canonizado.trim().toLowerCase();
    await this.amostraRepo.update(id, { rotulo_correto: rotuloCorreto, acertou });
  }

  async acuracia(loteSemana: string): Promise<{
    lote_semana: string;
    rotulados: number;
    pendentes: number;
    acertos: number;
    acuracia_pct: number | null;
  }> {
    const amostras = await this.amostraRepo.find({ where: { lote_semana: loteSemana } });
    const rotuladas = amostras.filter((a) => a.acertou !== null);
    const acertos = rotuladas.filter((a) => a.acertou === true).length;

    return {
      lote_semana: loteSemana,
      rotulados: rotuladas.length,
      pendentes: amostras.length - rotuladas.length,
      acertos,
      acuracia_pct: rotuladas.length > 0 ? Math.round((acertos / rotuladas.length) * 1000) / 10 : null,
    };
  }
}
