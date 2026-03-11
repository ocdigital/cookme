import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparacoesController } from './comparacoes.controller';
import { ComparacoesService } from './comparacoes.service';
import { Compra } from '@modules/compras/entities/compra.entity';
import { CompraItem } from '@modules/compras/entities/compra-item.entity';
import { Produto } from '@modules/produtos/entities/produto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Compra, CompraItem, Produto])],
  controllers: [ComparacoesController],
  providers: [ComparacoesService],
  exports: [ComparacoesService],
})
export class ComparacoesModule {}
