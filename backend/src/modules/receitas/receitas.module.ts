import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receita } from './entities/receita.entity';
import { CronLog } from '../admin/entities/cron-log.entity';
import { CronLogService } from '../admin/services/cron-log.service';
import { ReceitaIngrediente } from './entities/receita-ingrediente.entity';
import { ReceitaExecutada } from './entities/receita-executada.entity';
import { ReceitaFavorita } from './entities/receita-favorita.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Preferencia } from '../usuarios/entities/preferencia.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from '../compras/entities/compra.entity';
import { CompraItem } from '../compras/entities/compra-item.entity';
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
import { RecipeSearchService } from './services/recipe-search.service';
import { RecipeValidationService } from './services/recipe-validation.service';
import { IngredientNormalizerService } from './services/ingredient-normalizer.service';
import { ModeracaoService } from './services/moderacao.service';
import { AvaliacaoService } from './services/avaliacao.service';
import { RecipeCleanupJob } from './jobs/recipe-cleanup.job';
import { AprendizadoService } from './services/aprendizado.service';
import { ReceitaClassificacaoService } from './services/receita-classificacao.service';
import { SocialRecipeExtractorService } from './services/social-recipe-extractor.service';
import { RecipeRagService } from './services/recipe-rag.service';
import { IngredientCleanerService } from './services/ingredient-cleaner.service';
import { TudoGostosoScraperService } from './services/tudogostoso-scraper.service';
import { ReceiteriaCrawlerService } from './services/receiteria-scraper.service';
import { PreferenciaAprendida } from '../usuarios/entities/preferencia-aprendida.entity';
import { ReceitasController } from './receitas.controller';
import { ReceiptOcrController } from './controllers/receipt-ocr.controller';
import { ReceiptImportController } from './controllers/receipt-import.controller';
import { RecipeSuggestionController } from './controllers/recipe-suggestion.controller';
import { RecipeExecutionController } from './controllers/recipe-execution.controller';
import { RecipeGeneratorController } from './controllers/recipe-generator.controller';
import { RecipeTestController } from './controllers/recipe-test.controller';
import { ReceitasUsuarioController } from './controllers/receitas-usuario.controller';
import { ModeracaoUsuarioController } from './controllers/moderacao-usuario.controller';
import { AvaliacaoController } from './controllers/avaliacao.controller';
import { InventarioService } from '../inventario/inventario.service';
import { ListasModule } from '../listas/listas.module';
import { ProductClassificationModule } from '../product-classification/product-classification.module';
import { NotificacaoModule } from '../notificacoes/notificacao.module';
import { UploadModule } from '../upload/upload.module';
import { PushNotificationService } from '../notificacoes/services/push-notification.service';
import { SubscriptionModule } from '../affiliate/subscription.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Receita, ReceitaIngrediente, ReceitaExecutada, ReceitaFavorita,
      Produto, Preferencia, Inventario, Usuario, Compra, CompraItem,
      PreferenciaAprendida, CronLog,
    ]),
    ProductClassificationModule,
    NotificacaoModule,
    UploadModule,
    ListasModule,
    SubscriptionModule,
  ],
  providers: [
    CronLogService,
    ReceitasService, IAReceitasService, MOIEngineService,
    ReceiptOcrService, ProductClassifierService, ReceiptImportService,
    RecipeSuggestionService, RecipeExecutionService, RecipeGeneratorService,
    IngredientNormalizerService, ReceitaBancoService, RecipeSearchService, SocialRecipeExtractorService,
    TudoGostosoScraperService, ReceiteriaCrawlerService,
    RecipeValidationService,
    InventarioService, PushNotificationService,
    ModeracaoService,
    AvaliacaoService,
    AprendizadoService,
    ReceitaClassificacaoService,
    RecipeCleanupJob,
    RecipeRagService,
    IngredientCleanerService,
  ],
  controllers: [
    ReceitasUsuarioController, ModeracaoUsuarioController,
    ReceitasController, ReceiptOcrController, ReceiptImportController,
    RecipeSuggestionController, RecipeExecutionController,
    RecipeGeneratorController, RecipeTestController,
    AvaliacaoController,
  ],
  exports: [
    TypeOrmModule, ReceitasService, ReceiptOcrService, ProductClassifierService,
    ReceiptImportService, RecipeSuggestionService, RecipeExecutionService,
    RecipeGeneratorService, ReceitaBancoService, IngredientNormalizerService, CronLogService,
    ProductClassificationModule, ModeracaoService, ReceitaClassificacaoService,
    RecipeSearchService, RecipeRagService, IngredientCleanerService,
  ],
})
export class ReceitasModule {}
