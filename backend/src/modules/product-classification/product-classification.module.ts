import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProductKnowledgeBase } from './entities/product-knowledge-base.entity';
import { ProductValidation } from './entities/product-validation.entity';
import { AIClassificationLog } from './entities/ai-classification-log.entity';
import { ProductClassificationService } from './services/product-classification.service';
import { IntelligentInventoryService } from './services/intelligent-inventory.service';
import { ProductClassificationController } from './controllers/product-classification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductKnowledgeBase,
      ProductValidation,
      AIClassificationLog,
    ]),
    ConfigModule,
  ],
  providers: [ProductClassificationService, IntelligentInventoryService],
  controllers: [ProductClassificationController],
  exports: [ProductClassificationService, IntelligentInventoryService],
})
export class ProductClassificationModule {}
