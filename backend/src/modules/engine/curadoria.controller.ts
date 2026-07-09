import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CuradoriaService } from './curadoria.service';
import { RecanonizacaoService } from './recanonizacao.service';
import { ShadowEvalService } from './shadow-eval.service';

/**
 * Fila de curadoria (PLANO_PRECISAO_ENGINE.md §7) — o painel/PWA consome isto
 * para saber O QUE corrigir. Priorizada por frequência: itens que aparecem
 * mais vezes com confiança baixa sobem ao topo.
 */
@ApiTags('Engine — Curadoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('engine/curadoria')
export class CuradoriaController {
  constructor(
    private readonly curadoria: CuradoriaService,
    private readonly recanonizacao: RecanonizacaoService,
    private readonly shadowEval: ShadowEvalService,
  ) {}

  @Get('fila')
  @ApiOperation({ summary: 'Lista a fila de curadoria, priorizada por frequência de ocorrência' })
  async fila(@Query('limite') limite?: string) {
    return this.curadoria.listarFila(limite ? parseInt(limite, 10) : 50);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Saúde da curadoria: quantos itens ativos, quanto volume representam' })
  async estatisticas() {
    return this.curadoria.estatisticas();
  }

  @Post('reprocessar')
  @ApiOperation({
    summary:
      'Re-canonização retroativa (§11 A9): reprocessa a KB com o vocabulário atual, ' +
      'nunca toca corrigido_manual, só atualiza quando o resultado novo é igual ou mais forte',
  })
  async reprocessar(@Query('limite') limite?: string) {
    return this.recanonizacao.reprocessar(limite ? parseInt(limite, 10) : 200);
  }

  @Post('shadow-eval/amostrar')
  @ApiOperation({
    summary:
      'Shadow eval (§11 A8): sorteia N itens ALEATÓRIOS da KB (sem filtro de confiança) ' +
      'para o lote da semana corrente — a amostra que será rotulada às cegas',
  })
  async shadowEvalAmostrar(@Query('n') n?: string) {
    return this.shadowEval.amostrar(n ? parseInt(n, 10) : 30);
  }

  @Post('shadow-eval/rotular')
  @ApiOperation({
    summary: 'Rotula às cegas uma amostra do shadow eval com o produto correto',
  })
  async shadowEvalRotular(@Body() body: { id: string; rotulo_correto: string }) {
    await this.shadowEval.rotular(body.id, body.rotulo_correto);
    return { ok: true };
  }

  @Get('shadow-eval/acuracia')
  @ApiOperation({
    summary: 'Acurácia honesta do lote — número que vai no contrato B2B, não o golden set',
  })
  async shadowEvalAcuracia(@Query('lote') lote: string) {
    return this.shadowEval.acuracia(lote);
  }
}
