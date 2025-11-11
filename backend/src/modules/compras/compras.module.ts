import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra, CompraItem]),
  ],
  providers: [ComprasService],
  controllers: [ComprasController],
  exports: [TypeOrmModule, ComprasService],
})
export class ComprasModule {}
