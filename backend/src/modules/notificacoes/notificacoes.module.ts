import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificacoesService } from './notificacoes.service';
import { NotificationTriggersService } from './services/notification-triggers.service';
import { NotificacoesController } from './notificacoes.controller';
import { Notificacao } from './entities/notificacao.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Preferencia } from '../usuarios/entities/preferencia.entity';
import { Receita } from '../receitas/entities/receita.entity';
import { Compra } from '../compras/entities/compra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notificacao,
      Inventario,
      Usuario,
      Preferencia,
      Receita,
      Compra,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificationTriggersService],
  exports: [NotificacoesService, NotificationTriggersService],
})
export class NotificacoesModule {}
