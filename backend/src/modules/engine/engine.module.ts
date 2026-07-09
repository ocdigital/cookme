import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductClassificationModule } from '../product-classification/product-classification.module';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';
import { EngineService } from './engine.service';
import { LlmCanonizadorService } from './llm-canonizador.service';
import { EanEnricherService } from './ean-enricher.service';
import { CuradoriaService } from './curadoria.service';
import { CuradoriaItem } from './curadoria-item.entity';
import { RecanonizacaoService } from './recanonizacao.service';
import { ShadowEvalService } from './shadow-eval.service';
import { ShadowEvalAmostra } from './shadow-eval-amostra.entity';
import { EngineController } from './engine.controller';
import { CuradoriaController } from './curadoria.controller';

/**
 * Engine de Canonização — módulo isolado e coeso, estruturalmente separável.
 * Depende só de product-classification (KB + resolução); NUNCA de receitas,
 * inventário ou usuários. É a fronteira da futura API B2B.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ProductKnowledgeBase, CuradoriaItem, ShadowEvalAmostra]),
    ProductClassificationModule,
  ],
  providers: [
    EngineService,
    LlmCanonizadorService,
    EanEnricherService,
    CuradoriaService,
    RecanonizacaoService,
    ShadowEvalService,
  ],
  controllers: [EngineController, CuradoriaController],
  exports: [EngineService],
})
export class EngineModule {}
