import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './entities/inventario.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario, Produto]),
  ],
  providers: [InventarioService],
  controllers: [InventarioController],
  exports: [TypeOrmModule, InventarioService],
})
export class InventarioModule {}
