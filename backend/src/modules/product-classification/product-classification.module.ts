import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProductKnowledgeBase } from './entities/product-knowledge-base.entity';
import { ProductValidation } from './entities/product-validation.entity';
import { AIClassificationLog } from './entities/ai-classification-log.entity';
import { AbbreviationExpansion } from './entities/abbreviation-expansion.entity';
import { ProductClassificationService } from './services/product-classification.service';
import { IntelligentInventoryService } from './services/intelligent-inventory.service';
import { OcrAliasService } from './services/ocr-alias.service';
import { AbbreviationService } from './services/abbreviation.service';
import { ProductClassificationController } from './controllers/product-classification.controller';
import { IngredientNormalizerService } from '../receitas/services/ingredient-normalizer.service';
import { NotificacaoModule } from '../notificacoes/notificacao.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductKnowledgeBase,
      ProductValidation,
      AIClassificationLog,
      AbbreviationExpansion,
    ]),
    ConfigModule,
    NotificacaoModule,
  ],
  providers: [ProductClassificationService, IntelligentInventoryService, OcrAliasService, AbbreviationService, IngredientNormalizerService],
  controllers: [ProductClassificationController],
  exports: [ProductClassificationService, IntelligentInventoryService, OcrAliasService, AbbreviationService],
})
export class ProductClassificationModule {}
