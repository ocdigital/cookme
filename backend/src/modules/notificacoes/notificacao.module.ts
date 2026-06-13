import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacao } from './entities/notificacao.entity';
import { NotificacaoUsuario } from './entities/notificacao-usuario.entity';
import { NotificacaoService } from './services/notificacao.service';
import { NotificacaoUsuarioService } from './services/notificacao-usuario.service';
import { NotificacaoController } from './controllers/notificacao.controller';
import { NotificacaoUsuarioController } from './controllers/notificacao-usuario.controller';
import { NotificacaoGateway } from './gateways/notificacao.gateway';
import { NotificacaoTriggersService } from './services/notificacao-triggers.service';
import { PushNotificationService } from './services/push-notification.service';
import { PushTriggersService } from './services/push-triggers.service';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { PlanejamentoSemanal } from '@modules/planejamento/entities/planejamento-semanal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacao, NotificacaoUsuario, Usuario, PlanejamentoSemanal])],
  providers: [
    NotificacaoService,
    NotificacaoUsuarioService,
    NotificacaoTriggersService,
    NotificacaoGateway,
    PushNotificationService,
    PushTriggersService,
  ],
  controllers: [NotificacaoController, NotificacaoUsuarioController],
  exports: [NotificacaoService, NotificacaoUsuarioService, NotificacaoGateway, NotificacaoTriggersService, PushNotificationService, PushTriggersService],
})
export class NotificacaoModule {}
