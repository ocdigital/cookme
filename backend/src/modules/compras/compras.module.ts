import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { ComprasService } from './compras.service';
import { NfceConsultaService } from './nfce-consulta.service';
import { ComprasController } from './compras.controller';
import { Produto } from '../produtos/entities/produto.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { ProductClassificationModule } from '../product-classification/product-classification.module';
import { ProdutosModule } from '../produtos/produtos.module';
import { MetricasModule } from '../metricas/metricas.module';
import { SubscriptionModule } from '../affiliate/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, CompraItem, Produto, Inventario]),
    ProductClassificationModule,
    ProdutosModule,
    SubscriptionModule,
    MetricasModule,
  ],
  providers: [ComprasService, NfceConsultaService],
  controllers: [ComprasController],
  exports: [TypeOrmModule, ComprasService],
})
export class ComprasModule {}
