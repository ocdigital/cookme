import { Controller, Post, Get, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { MetricasService } from './metricas.service';
import { LlmMetricsService } from './llm-metrics.service';

@ApiTags('Métricas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eventos')
export class EventosController {
  constructor(private readonly metricas: MetricasService) {}

  @Post('app-open')
  @HttpCode(204)
  @ApiOperation({ summary: 'Registra abertura do app (chamado pelo mobile ao abrir)' })
  async appOpen(@CurrentUser() user: Usuario): Promise<void> {
    await this.metricas.registrar(user.id, 'app_open');
  }

  @Post('paywall-visto')
  @HttpCode(204)
  @ApiOperation({ summary: 'Registra visualização do paywall' })
  async paywallVisto(@CurrentUser() user: Usuario): Promise<void> {
    await this.metricas.registrar(user.id, 'paywall_visto');
  }
}

@ApiTags('Admin — Métricas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/metricas')
export class AdminMetricasController {
  constructor(
    private readonly metricas: MetricasService,
    private readonly llm: LlmMetricsService,
  ) {}

  @Get('retencao')
  @ApiOperation({ summary: 'Retenção D7/D30 por cohort semanal de cadastro' })
  async retencao() {
    const [cohorts, eventos] = await Promise.all([
      this.metricas.retencao(),
      this.metricas.resumoEventos(30),
    ]);
    return { cohorts, eventos_30d: eventos };
  }

  @Get('llm')
  @ApiOperation({ summary: 'Chamadas de LLM nas últimas 24h por provider + taxa de fallback' })
  async llmResumo() {
    return this.llm.resumo24h();
  }
}
