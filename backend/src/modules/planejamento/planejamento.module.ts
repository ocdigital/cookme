import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanejamentoSemanal } from './entities/planejamento-semanal.entity';
import { Receita } from '../receitas/entities/receita.entity';
import { Preferencia } from '../usuarios/entities/preferencia.entity';
import { PlanejamentoService } from './planejamento.service';
import { PlanejamentoController } from './planejamento.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanejamentoSemanal, Receita, Preferencia]),
  ],
  providers: [PlanejamentoService],
  controllers: [PlanejamentoController],
  exports: [PlanejamentoService],
})
export class PlanejamentoModule {}
