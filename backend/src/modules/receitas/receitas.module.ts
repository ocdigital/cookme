import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receita } from './entities/receita.entity';
import { ReceitaIngrediente } from './entities/receita-ingrediente.entity';
import { ReceitaExecutada } from './entities/receita-executada.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { ReceitasService } from './receitas.service';
import { IAReceitasService } from './services/ia-receitas.service';
import { ReceitasController } from './receitas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receita, ReceitaIngrediente, ReceitaExecutada, Produto]),
  ],
  providers: [ReceitasService, IAReceitasService],
  controllers: [ReceitasController],
  exports: [TypeOrmModule, ReceitasService],
})
export class ReceitasModule {}
