import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './entities/inventario.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from '../compras/entities/compra.entity';
import { CompraItem } from '../compras/entities/compra-item.entity';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { InventarioExpiracaoJob } from './inventario-expiracao.job';
import { PushNotificationService } from '../notificacoes/services/push-notification.service';
import { ProductClassificationModule } from '../product-classification/product-classification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario, Produto, Usuario, Compra, CompraItem]),
    ProductClassificationModule,
  ],
  providers: [InventarioService, InventarioExpiracaoJob, PushNotificationService],
  controllers: [InventarioController],
  exports: [TypeOrmModule, InventarioService, InventarioExpiracaoJob],
})
export class InventarioModule {}
