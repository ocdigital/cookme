import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Notificacao } from './entities/notificacao.entity';

@ApiTags('Notificacoes')
@ApiBearerAuth()
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações',
    type: [Notificacao],
  })
  async findAll(@CurrentUser() user: Usuario): Promise<Notificacao[]> {
    return this.notificacoesService.findAll(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  @ApiResponse({
    status: 200,
    description: 'Quantidade de notificações não lidas',
  })
  async getUnreadCount(@CurrentUser() user: Usuario): Promise<{ count: number }> {
    const count = await this.notificacoesService.getUnreadCount(user.id);
    return { count };
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
}
