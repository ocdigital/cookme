import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { ReceiptOcrService } from './services/receipt-ocr.service';
import { ProductClassifierService } from './services/product-classifier.service';
import { ReceiptImportService } from './services/receipt-import.service';
import { RecipeSuggestionService } from './services/recipe-suggestion.service';
import { RecipeExecutionService } from './services/recipe-execution.service';
import { RecipeGeneratorService } from './services/recipe-generator.service';
import { ReceitaBancoService } from './services/receita-banco.service';
import { ReceitasController } from './receitas.controller';
import { ReceiptOcrController } from './controllers/receipt-ocr.controller';
import { ReceiptImportController } from './controllers/receipt-import.controller';
import { RecipeSuggestionController } from './controllers/recipe-suggestion.controller';
import { RecipeExecutionController } from './controllers/recipe-execution.controller';
import { RecipeGeneratorController } from './controllers/recipe-generator.controller';
import { RecipeTestController } from './controllers/recipe-test.controller';
import { InventarioService } from '../inventario/inventario.service';
import { ProductClassificationModule } from '../product-classification/product-classification.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Receita,
      ReceitaIngrediente,
      ReceitaExecutada,
      ReceitaFavorita,
      Produto,
      Preferencia,
      Inventario,
    ]),
    ProductClassificationModule,
  ],
  providers: [ReceitasService, IAReceitasService, MOIEngineService, ReceiptOcrService, ProductClassifierService, ReceiptImportService, RecipeSuggestionService, RecipeExecutionService, RecipeGeneratorService, ReceitaBancoService, InventarioService],
  controllers: [ReceitasController, ReceiptOcrController, ReceiptImportController, RecipeSuggestionController, RecipeExecutionController, RecipeGeneratorController, RecipeTestController],
  exports: [TypeOrmModule, ReceitasService, ReceiptOcrService, ProductClassifierService, ReceiptImportService, RecipeSuggestionService, RecipeExecutionService, RecipeGeneratorService, ReceitaBancoService, ProductClassificationModule],
})
export class ReceitasModule {}
