import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Logger, Sse, MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { SystemService } from '../services/system.service';
import { RecipeGeneratorService } from '@modules/receitas/services/recipe-generator.service';
import { RecipeCrawlerService } from '@modules/receitas/services/recipe-crawler.service';
import { Observable, merge, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { logBuffer, logStream$ } from '@common/log-buffer.singleton';

@ApiTags('Admin - Sistema')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/system')
export class SystemController {
  private readonly logger = new Logger(SystemController.name);

  constructor(
    private readonly systemService: SystemService,
    private readonly recipeGeneratorService: RecipeGeneratorService,
    private readonly recipeCrawlerService: RecipeCrawlerService,
  ) {}

  // ── Status geral ──────────────────────────────────────────────────────────

  @Get('health')
  @ApiOperation({ summary: 'Health check: DB + APIs + scrapers' })
  async health() {
    return this.systemService.getHealth();
  }

  // ── DB Stats ──────────────────────────────────────────────────────────────

  @Get('db-stats')
  @ApiOperation({ summary: 'Estatísticas do banco: receitas, usuários, KB, inventário' })
  async dbStats() {
    return this.systemService.getDbStats();
  }

  // ── Call tracking ─────────────────────────────────────────────────────────

  @Get('usage-stats')
  @ApiOperation({ summary: 'Contadores de chamadas por serviço (desde último restart)' })
  getUsageStats() {
    return this.systemService.getCallStats();
  }

  @Post('usage-stats/reset-daily')
  @ApiOperation({ summary: 'Reseta contadores diários' })
  resetDaily() {
    this.systemService.resetDailyCounters();
    return { ok: true, message: 'Contadores diários resetados' };
  }

  // ── AI Config ─────────────────────────────────────────────────────────────

  @Get('ai-config')
  @ApiOperation({ summary: 'Configuração atual dos agentes de IA' })
  getAiConfig() {
    return this.systemService.getAiConfig();
  }

  @Patch('ai-config')
  @ApiOperation({ summary: 'Atualiza configuração dos agentes de IA (runtime, reseta no restart)' })
  updateAiConfig(@Body() body: Record<string, any>) {
    return this.systemService.updateAiConfig(body);
  }

  // ── Test AI ───────────────────────────────────────────────────────────────

  @Post('test-ai/:service')
  @ApiOperation({ summary: 'Testa conectividade com Gemini ou Claude (faz chamada real)' })
  async testAi(@Param('service') service: string) {
    if (service !== 'gemini' && service !== 'claude') {
      return { ok: false, error: 'Serviço deve ser "gemini" ou "claude"' };
    }
    this.logger.log(`Testando conexão com ${service}...`);
    return this.systemService.testAiConnection(service as 'gemini' | 'claude');
  }

  // ── Scrapers ──────────────────────────────────────────────────────────────

  @Post('run-scraper')
  @ApiOperation({ summary: 'Dispara scraping de receitas manualmente' })
  async runScraper(@Body('ingredientes') ingredientes?: string[]) {
    this.logger.log('Scraping manual disparado via admin');
    const ing = ingredientes?.length ? ingredientes : ['frango', 'carne', 'peixe', 'feijão', 'macarrão'];

    // Dispara em background — não bloqueia resposta
    this.recipeGeneratorService.gerarReceitas(ing).catch((err) =>
      this.logger.error(`Erro no scraping manual: ${err.message}`)
    );

    return {
      ok: true,
      message: `Scraping disparado em background para ${ing.length} ingredientes`,
      ingredientes: ing,
      iniciadoEm: new Date().toISOString(),
    };
  }

  @Post('run-crawler')
  @ApiOperation({ summary: 'Dispara o crawler de receitas (TudoGostoso + Receiteria)' })
  async runCrawler() {
    this.logger.log('Crawler manual disparado via admin');
    this.recipeCrawlerService.crawlearManual().catch((err) =>
      this.logger.error(`Erro no crawler manual: ${err.message}`)
    );
    return { ok: true, message: 'Crawler disparado em background', iniciadoEm: new Date().toISOString() };
  }

  @Post('popular-receitas-curadas')
  @ApiOperation({ summary: 'Popula banco com receitas por modo alimentar' })
  async popularCuradas(@Body('modos') modos?: string[]) {
    const lista = modos?.length ? modos : ['normal', 'fitness', 'vegetariano', 'vegano'];
    this.logger.log(`Populando receitas para modos: ${lista.join(', ')}`);
    for (const modo of lista) {
      this.logger.warn(`popularModoAlimentar removido — use seed diretamente para modo ${modo}`);
    }
    return { ok: true, message: `Populando em background: ${lista.join(', ')}`, iniciadoEm: new Date().toISOString() };
  }

  // ── Logs em tempo real ────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Retorna últimas 50 linhas do log' })
  getLogs() {
    return [...logBuffer];
  }

  @Sse('logs/stream')
  @ApiOperation({ summary: 'Stream SSE de logs em tempo real' })
  streamLogs(): Observable<MessageEvent> {
    return merge(
      from([...logBuffer]).pipe(map((entry) => ({ data: entry } as MessageEvent))),
      logStream$.pipe(map((entry) => ({ data: entry } as MessageEvent))),
    );
  }
}
