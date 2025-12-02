import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';
import { Produto } from '../produtos/entities/produto.entity';
import { ProductClassificationModule } from '../product-classification/product-classification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, CompraItem, Produto]),
    ProductClassificationModule,
  ],
  providers: [ComprasService],
  controllers: [ComprasController],
  exports: [TypeOrmModule, ComprasService],
})
export class ComprasModule {}
