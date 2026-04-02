import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListaController } from './controllers/lista.controller';
import { ListaService } from './services/lista.service';
import { Lista } from './entities/lista.entity';
import { ItemLista } from './entities/item-lista.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lista, ItemLista])],
  controllers: [ListaController],
  providers: [ListaService],
  exports: [ListaService],
})
export class ListasModule {}
