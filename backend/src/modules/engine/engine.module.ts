import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductClassificationModule } from '../product-classification/product-classification.module';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';
import { EngineService } from './engine.service';
import { LlmCanonizadorService } from './llm-canonizador.service';
import { EngineController } from './engine.controller';

/**
 * Engine de Canonização — módulo isolado e coeso, estruturalmente separável.
 * Depende só de product-classification (KB + resolução); NUNCA de receitas,
 * inventário ou usuários. É a fronteira da futura API B2B.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ProductKnowledgeBase]),
    ProductClassificationModule,
  ],
  providers: [EngineService, LlmCanonizadorService],
  controllers: [EngineController],
  exports: [EngineService],
})
export class EngineModule {}
