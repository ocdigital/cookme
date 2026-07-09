import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuradoriaItem } from './curadoria-item.entity';

/** Abaixo deste valor, o item entra na fila de curadoria (não confunda com LIMIAR_IA). */
export const LIMIAR_CURADORIA = 0.6;

export interface OcorrenciaFraca {
  descricao: string;
  canonico: string;
  estagio: string;
  confianca: number;
}

/**
 * Fila de curadoria (PLANO_PRECISAO_ENGINE.md §7): transforma o flywheel de
 * "correção manual quando alguém lembra" em "processo guiado por dados". Cada
 * item resolvido com confiança baixa acumula aqui, contado por frequência —
 * corrigir o que aparece mais vezes tem mais impacto na acurácia global.
 */
@Injectable()
export class CuradoriaService {
  private readonly logger = new Logger(CuradoriaService.name);

  constructor(
    @InjectRepository(CuradoriaItem)
    private readonly repo: Repository<CuradoriaItem>,
  ) {}

  private normalizar(desc: string): string {
    return desc
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Chamado pela Engine após cada canonização. Só age se a confiança está
   * abaixo do limiar — itens resolvidos com confiança alta nunca tocam esta
   * tabela (ela é só a fila de "o que precisa de atenção humana").
   */
  async registrarOcorrencia(oc: OcorrenciaFraca): Promise<void> {
    if (oc.confianca >= LIMIAR_CURADORIA) return;

    const chave = this.normalizar(oc.descricao);
    try {
      const existente = await this.repo.findOne({ where: { descricao_normalizada: chave } });
      if (existente) {
        if (existente.resolvido) return; // já foi corrigido — não reabre a fila
        await this.repo.update(existente.id, { ocorrencias: existente.ocorrencias + 1 });
        return;
      }
      await this.repo.save(
        this.repo.create({
          descricao_normalizada: chave,
          descricao_exemplo: oc.descricao,
          produto_proposto: oc.canonico,
          estagio: oc.estagio,
          confianca: oc.confianca,
          ocorrencias: 1,
          resolvido: false,
        }),
      );
    } catch (e: any) {
      this.logger.warn(`Falha ao registrar ocorrência de curadoria: ${e.message}`);
    }
  }

  /** Chamado quando um item é corrigido — sai da fila ativa. */
  async marcarResolvido(descricao: string): Promise<void> {
    const chave = this.normalizar(descricao);
    const existente = await this.repo.findOne({ where: { descricao_normalizada: chave } });
    if (existente) {
      await this.repo.update(existente.id, { resolvido: true });
    }
  }

  /** Fila priorizada por frequência — o painel de curadoria consome isto. */
  async listarFila(limite = 50): Promise<CuradoriaItem[]> {
    return this.repo.find({
      where: { resolvido: false },
      order: { ocorrencias: 'DESC' },
      take: limite,
    });
  }

  /** Métrica de saúde (§7 ponto 4): quantos itens ativos, quanto de volume representam. */
  async estatisticas(): Promise<{ itensAtivos: number; ocorrenciasTotais: number }> {
    const ativos = await this.repo.find({ where: { resolvido: false } });
    return {
      itensAtivos: ativos.length,
      ocorrenciasTotais: ativos.reduce((s, i) => s + i.ocorrencias, 0),
    };
  }
}
