import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './entities/inventario.entity';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario]),
  ],
  providers: [InventarioService],
  controllers: [InventarioController],
  exports: [TypeOrmModule, InventarioService],
})
export class InventarioModule {}
