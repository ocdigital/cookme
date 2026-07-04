import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoUso } from './entities/evento-uso.entity';
import { LlmChamada } from './entities/llm-chamada.entity';
import { MetricasService } from './metricas.service';
import { LlmMetricsService } from './llm-metrics.service';
import { EventosController, AdminMetricasController } from './metricas.controller';

/**
 * Métricas de produto (retenção D7/D30) e observabilidade de LLM.
 * Módulo folha: não importa módulos de negócio — quem instrumenta importa ele.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EventoUso, LlmChamada])],
  providers: [MetricasService, LlmMetricsService],
  controllers: [EventosController, AdminMetricasController],
  exports: [MetricasService, LlmMetricsService],
})
export class MetricasModule {}
