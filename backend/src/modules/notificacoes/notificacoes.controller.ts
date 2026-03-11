import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { NotificationTriggersService } from './services/notification-triggers.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Admin } from '@common/decorators/admin.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Notificacao, NotificacaoTipo } from './entities/notificacao.entity';

@ApiTags('Notificacoes')
@ApiBearerAuth()
@Controller('notificacoes')
export class NotificacoesController {
  constructor(
    private readonly notificacoesService: NotificacoesService,
    private readonly triggersService: NotificationTriggersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário (com paginação)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (padrão: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de notificações',
  })
  async findAll(
    @CurrentUser() user: Usuario,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificacoesService.findPaginado(user.id, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  @ApiResponse({
    status: 200,
    description: 'Quantidade de notificações não lidas',
  })
  async getUnreadCount(@CurrentUser() user: Usuario): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificacoesService.getUnreadCount(user.id);
    return { unreadCount };
  }

  @Post(':id/mark-read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida',
    type: Notificacao,
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: Usuario,
  ): Promise<Notificacao> {
    return this.notificacoesService.markAsRead(id, user.id);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar todas notificações como lidas' })
  @ApiResponse({
    status: 204,
    description: 'Todas notificações marcadas como lidas',
  })
  async markAllAsRead(@CurrentUser() user: Usuario): Promise<void> {
    return this.notificacoesService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar notificação' })
  @ApiResponse({ status: 204, description: 'Notificação deletada' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: Usuario,
  ): Promise<void> {
    return this.notificacoesService.remove(id, user.id);
  }

  /**
   * Admin Endpoints para testes de triggers
   */

  @Post('triggers/test/vencimento')
  @Admin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Testar trigger de vencimento' })
  @ApiResponse({ status: 200, description: 'Trigger de vencimento executado' })
  async testTriggerVencimento() {
    await this.triggersService.verificarItensVencendo();
    return { mensagem: 'Trigger de vencimento executado com sucesso' };
  }

  @Post('triggers/test/sugestoes')
  @Admin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Testar trigger de sugestões diárias' })
  @ApiResponse({ status: 200, description: 'Trigger de sugestões executado' })
  async testTriggerSugestoes() {
    await this.triggersService.notificarSugestoesDiarias();
    return { mensagem: 'Trigger de sugestões executado com sucesso' };
  }

  @Post('triggers/test/estoque')
  @Admin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Testar trigger de estoque baixo' })
  @ApiResponse({ status: 200, description: 'Trigger de estoque executado' })
  async testTriggerEstoque() {
    await this.triggersService.notificarEstoqueBaixo();
    return { mensagem: 'Trigger de estoque baixo executado com sucesso' };
  }

  @Post('triggers/test/novas-receitas')
  @Admin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Testar trigger de novas receitas' })
  @ApiResponse({ status: 200, description: 'Trigger de novas receitas executado' })
  async testTriggerNovasReceitas() {
    await this.triggersService.notificarNovasReceitas();
    return { mensagem: 'Trigger de novas receitas executado com sucesso' };
  }

  @Post('triggers/test/re-engagement')
  @Admin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Testar trigger de re-engagement' })
  @ApiResponse({ status: 200, description: 'Trigger de re-engagement executado' })
  async testTriggerReEngagement() {
    await this.triggersService.notificarUsuariosInativos();
    return { mensagem: 'Trigger de re-engagement executado com sucesso' };
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar notificação manual para usuário' })
  @ApiResponse({ status: 201, description: 'Notificação enviada com sucesso' })
  async enviarManual(
    @CurrentUser() user: Usuario,
    @Body()
    body: {
      titulo: string;
      mensagem: string;
      tipo?: NotificacaoTipo;
    },
  ): Promise<Notificacao> {
    return this.triggersService.notificarEvento(
      user.id,
      body.tipo || NotificacaoTipo.INFO,
      body.titulo,
      body.mensagem,
    );
  }
}
