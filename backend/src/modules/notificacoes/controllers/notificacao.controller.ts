import { Controller, Get, Patch, Delete, Param, Query, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { NotificacaoService } from '../services/notificacao.service';
import { NotificacaoTriggersService } from '../services/notificacao-triggers.service';

@ApiTags('Notificações')
@SkipThrottle()
@Controller('notificacoes')
export class NotificacaoController {
  constructor(
    private readonly notificacaoService: NotificacaoService,
    private readonly notificacaoTriggers: NotificacaoTriggersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do admin' })
  async listar(
    @Request() req: any,
    @Query('naoLidas') naoLidas?: string,
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    const onlyUnread = naoLidas === 'true';
    return this.notificacaoService.listarPorAdmin(usuarioId, onlyUnread);
  }

  @Get('nao-lidas/count')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  async contarNaoLidas(@Request() req: any) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    const count = await this.notificacaoService.contarNaoLidas(usuarioId);
    return { naoLidas: count };
  }

  @Patch('marcar-todas/lido')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  async marcarTodasComoLidas(@Request() req: any) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    await this.notificacaoService.marcarTodasComoLidas(usuarioId);
  }

  @Patch(':id/lido')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  async marcarComoLida(@Param('id') id: string) {
    await this.notificacaoService.marcarComoLida(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar notificação' })
  async deletar(@Param('id') id: string) {
    await this.notificacaoService.deletar(id);
  }
}
