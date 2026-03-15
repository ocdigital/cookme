import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacao } from './entities/notificacao.entity';
import { NotificacaoService } from './services/notificacao.service';
import { NotificacaoController } from './controllers/notificacao.controller';
import { NotificacaoGateway } from './gateways/notificacao.gateway';
import { NotificacaoTriggersService } from './services/notificacao-triggers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacao])],
  providers: [NotificacaoService, NotificacaoTriggersService, NotificacaoGateway],
  controllers: [NotificacaoController],
  exports: [NotificacaoService, NotificacaoGateway, NotificacaoTriggersService],
})
export class NotificacaoModule {}
