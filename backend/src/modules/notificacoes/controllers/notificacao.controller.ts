import { Controller, Get, Patch, Delete, Param, Query, HttpCode, HttpStatus, Request, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';
import { NotificacaoService } from '../services/notificacao.service';
import { NotificacaoTriggersService } from '../services/notificacao-triggers.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Notificações')
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

  @Patch(':id/lido')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  async marcarComoLida(@Param('id') id: string) {
    await this.notificacaoService.marcarComoLida(id);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar notificação' })
  async deletar(@Param('id') id: string) {
    await this.notificacaoService.deletar(id);
  }

  /**
   * TESTE: Dispara notificação de teste
   * Remover em produção!
   */
  @Public()
  @Post('test/trigger')
  @ApiOperation({ summary: '[TESTE] Disparar notificação de teste' })
  async testarTrigger(
    @Body()
    body: {
      tipo:
        | 'receita_denunciada'
        | 'novo_usuario'
        | 'usuario_inativo'
        | 'produto_incompleto'
        | 'erro_sistema'
        | 'limite_recursos';
    },
  ) {
    const testId = uuid();

    switch (body.tipo) {
      case 'receita_denunciada':
        await this.notificacaoTriggers.receitaDenunciada(
          testId,
          'Bolo de Chocolate',
          3,
        );
        break;

      case 'novo_usuario':
        await this.notificacaoTriggers.novoUsuario(
          testId,
          'João Silva',
          'joao@test.com',
        );
        break;

      case 'usuario_inativo':
        await this.notificacaoTriggers.usuarioInativo(testId, 'Maria Santos', 35);
        break;

      case 'produto_incompleto':
        await this.notificacaoTriggers.produtoIncompleto(
          testId,
          'Arroz Integral',
          ['Imagem', 'Informações Nutricionais'],
        );
        break;

      case 'erro_sistema':
        await this.notificacaoTriggers.erroSistema(
          'Falha de Banco de Dados',
          'Connection timeout ao conectar com PostgreSQL',
        );
        break;

      case 'limite_recursos':
        await this.notificacaoTriggers.limiteRecursos(
          'CPU',
          85,
          100,
        );
        break;
    }

    return { success: true, tipo: body.tipo };
  }
}
