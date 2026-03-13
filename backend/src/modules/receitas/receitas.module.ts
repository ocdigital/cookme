import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receita } from './entities/receita.entity';
import { ReceitaIngrediente } from './entities/receita-ingrediente.entity';
import { ReceitaExecutada } from './entities/receita-executada.entity';
import { ReceitaFavorita } from './entities/receita-favorita.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Preferencia } from '../usuarios/entities/preferencia.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { ReceitasService } from './receitas.service';
import { IAReceitasService } from './services/ia-receitas.service';
import { MOIEngineService } from './services/moi-engine.service';
import { ReceitasController } from './receitas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Receita,
      ReceitaIngrediente,
      ReceitaExecutada,
      ReceitaFavorita,
      Produto,
      Preferencia,
      Inventario,
    ]),
  ],
  providers: [ReceitasService, IAReceitasService, MOIEngineService],
  controllers: [ReceitasController],
  exports: [TypeOrmModule, ReceitasService],
})
export class ReceitasModule {}
