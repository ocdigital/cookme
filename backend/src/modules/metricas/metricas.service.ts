import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoUso } from './entities/evento-uso.entity';

export type EventoProduto =
  | 'app_open'
  | 'cupom_lido'
  | 'receita_gerada'
  | 'receita_feita'
  | 'paywall_visto'
  | 'assinatura_criada';

@Injectable()
export class MetricasService {
  private readonly logger = new Logger(MetricasService.name);

  constructor(
    @InjectRepository(EventoUso)
    private readonly eventoRepo: Repository<EventoUso>,
  ) {}

  /**
   * Registra um evento de produto. Nunca lança — métrica jamais pode
   * derrubar o fluxo de negócio.
   */
  async registrar(
    usuarioId: string,
    evento: EventoProduto,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.eventoRepo.insert({ usuario_id: usuarioId, evento, metadata: metadata ?? null });
    } catch (e: any) {
      this.logger.warn(`Falha ao registrar evento ${evento}: ${e.message}`);
    }
  }

  /**
   * Retenção D7/D30 por cohort semanal de cadastro:
   * % de usuários da cohort com app_open entre D+dias e D+dias+7.
   */
  async retencao(): Promise<Array<{
    cohort: string;
    usuarios: number;
    d7: number;
    d30: number;
  }>> {
    return this.eventoRepo.query(`
      WITH cohorts AS (
        SELECT id AS usuario_id, date_trunc('week', criado_em) AS cohort
        FROM usuarios
        WHERE criado_em >= now() - interval '120 days'
      ),
      aberturas AS (
        SELECT DISTINCT e.usuario_id, c.cohort,
          (e.criado_em >= c.cohort + interval '7 days'
           AND e.criado_em < c.cohort + interval '14 days') AS em_d7,
          (e.criado_em >= c.cohort + interval '30 days'
           AND e.criado_em < c.cohort + interval '37 days') AS em_d30
        FROM eventos_uso e
        JOIN cohorts c ON c.usuario_id = e.usuario_id
        WHERE e.evento = 'app_open'
      )
      SELECT
        to_char(c.cohort, 'YYYY-MM-DD') AS cohort,
        COUNT(DISTINCT c.usuario_id)::int AS usuarios,
        ROUND(100.0 * COUNT(DISTINCT a7.usuario_id) / NULLIF(COUNT(DISTINCT c.usuario_id), 0), 1)::float AS d7,
        ROUND(100.0 * COUNT(DISTINCT a30.usuario_id) / NULLIF(COUNT(DISTINCT c.usuario_id), 0), 1)::float AS d30
      FROM cohorts c
      LEFT JOIN aberturas a7 ON a7.usuario_id = c.usuario_id AND a7.em_d7
      LEFT JOIN aberturas a30 ON a30.usuario_id = c.usuario_id AND a30.em_d30
      GROUP BY c.cohort
      ORDER BY c.cohort DESC
    `);
  }

  /** Contagem de eventos por tipo nos últimos N dias (visão rápida). */
  async resumoEventos(dias = 30): Promise<Array<{ evento: string; total: number }>> {
    return this.eventoRepo.query(
      `SELECT evento, COUNT(*)::int AS total
       FROM eventos_uso
       WHERE criado_em >= now() - ($1 || ' days')::interval
       GROUP BY evento ORDER BY total DESC`,
      [dias],
    );
  }
}
