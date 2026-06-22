import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronLog } from '../entities/cron-log.entity';

@Injectable()
export class CronLogService {
  constructor(
    @InjectRepository(CronLog)
    private readonly repo: Repository<CronLog>,
  ) {}

  async registrar(entry: {
    job: string;
    status: 'ok' | 'erro' | 'skip';
    receitas_salvas?: number;
    receitas_descartadas?: number;
    detalhe?: string;
    duracao_ms?: number;
  }): Promise<void> {
    await this.repo.save({
      job: entry.job,
      status: entry.status,
      receitas_salvas: entry.receitas_salvas ?? 0,
      receitas_descartadas: entry.receitas_descartadas ?? 0,
      detalhe: entry.detalhe ?? null,
      duracao_ms: entry.duracao_ms ?? null,
    });
  }

  async listar(limit = 100): Promise<CronLog[]> {
    return this.repo.find({
      order: { criado_em: 'DESC' },
      take: limit,
    });
  }
}
