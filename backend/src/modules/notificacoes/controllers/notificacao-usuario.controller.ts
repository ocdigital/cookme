import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { NotificacaoUsuarioService } from '../services/notificacao-usuario.service';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificacoes-usuario')
export class NotificacaoUsuarioController {
  constructor(private readonly service: NotificacaoUsuarioService) {}

  @Get()
  @ApiOperation({ summary: 'Lista notificações do usuário logado' })
  listar(@CurrentUser() user: Usuario) {
    return this.service.listar(user.id);
  }

  @Get('nao-lidas/contagem')
  @ApiOperation({ summary: 'Contagem de notificações não lidas' })
  async contar(@CurrentUser() user: Usuario) {
    const total = await this.service.contarNaoLidas(user.id);
    return { total };
  }

  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marca notificação como lida' })
  marcarLida(@CurrentUser() user: Usuario, @Param('id') id: string) {
    return this.service.marcarLida(id, user.id);
  }

  @Patch('todas-lidas')
  @ApiOperation({ summary: 'Marca todas as notificações como lidas' })
  marcarTodasLidas(@CurrentUser() user: Usuario) {
    return this.service.marcarTodasLidas(user.id);
  }
}
