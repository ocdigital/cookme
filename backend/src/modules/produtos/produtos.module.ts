import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './entities/produto.entity';
import { Categoria } from './entities/categoria.entity';
import { Marca } from './entities/marca.entity';
import { ProdutosService } from './produtos.service';
import { ProductImageService } from './services/product-image.service';
import { ProdutosController } from './produtos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, Categoria, Marca]),
  ],
  providers: [ProdutosService, ProductImageService],
  controllers: [ProdutosController],
  exports: [TypeOrmModule, ProdutosService, ProductImageService],
})
export class ProdutosModule {}
