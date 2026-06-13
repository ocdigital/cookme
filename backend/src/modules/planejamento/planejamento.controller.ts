import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseIntPipe, Query, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { PlanejamentoService } from './planejamento.service';

@ApiTags('Planejamento')
@Controller('planejamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PlanejamentoController {
  constructor(private readonly service: PlanejamentoService) {}

  @Get('semana/:semana')
  @ApiOperation({ summary: 'Listar planejamento de uma semana (1-4)' })
  async listarSemana(
    @CurrentUser() user: Usuario,
    @Param('semana', ParseIntPipe) semana: number,
  ) {
    const items = await this.service.listarSemana(user.id, semana);
    return { semana, items };
  }

  @Get('hoje')
  @ApiOperation({ summary: 'Receita do dia (almoço de hoje)' })
  async receitaDoDia(@CurrentUser() user: Usuario) {
    const item = await this.service.receitaDoDia(user.id);
    return { item };
  }

  @Post('semana/:semana/dia/:dia/:tipo')
  @ApiOperation({ summary: 'Definir receita para um dia/refeição' })
  async definirReceita(
    @CurrentUser() user: Usuario,
    @Param('semana', ParseIntPipe) semana: number,
    @Param('dia', ParseIntPipe) dia: number,
    @Param('tipo') tipo: 'almoco' | 'jantar',
    @Body() body: { receita_id: string | null },
  ) {
    return this.service.definirReceita(user.id, semana, dia, tipo, body.receita_id);
  }

  @Post('semana/:semana/aleatorio')
  @ApiOperation({ summary: 'Gerar semana aleatória com inteligência regional' })
  async gerarAleatoria(
    @CurrentUser() user: Usuario,
    @Param('semana', ParseIntPipe) semana: number,
    @Body() body: { apenas_regional?: boolean },
  ) {
    const items = await this.service.gerarAleatoria(user.id, semana, body.apenas_regional ?? false);
    return { semana, items_criados: items.length, items };
  }

  @Post(':id/feita')
  @ApiOperation({ summary: 'Marcar receita como feita' })
  async marcarFeita(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
    @Body() body: { avaliacao?: number },
  ) {
    return this.service.marcarFeita(user.id, id, body.avaliacao);
  }

  @Delete('semana/:semana/dia/:dia')
  @ApiOperation({ summary: 'Limpar dia do planejamento' })
  async limparDia(
    @CurrentUser() user: Usuario,
    @Param('semana', ParseIntPipe) semana: number,
    @Param('dia', ParseIntPipe) dia: number,
    @Query('tipo') tipo?: 'almoco' | 'jantar',
  ) {
    await this.service.limparDia(user.id, semana, dia, tipo);
    return { ok: true };
  }
}
