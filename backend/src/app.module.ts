import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import { getDatabaseConfig } from './config/database.config';
import { getCacheConfig } from './config/cache.config';

// Módulos (vamos criar depois)
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { ComprasModule } from './modules/compras/compras.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ReceitasModule } from './modules/receitas/receitas.module';
import { BarcodeModule } from './modules/barcode/barcode.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { ProductClassificationModule } from './modules/product-classification/product-classification.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificacaoModule } from './modules/notificacoes/notificacao.module';

import { IAModule } from './modules/ia/ia.module';
import { ComparacoesModule } from './modules/comparacoes/comparacoes.module';
import { ListasModule } from './modules/listas/listas.module';
import { PlanejamentoModule } from './modules/planejamento/planejamento.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { HealthModule } from './modules/health/health.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { MetricasModule } from './modules/metricas/metricas.module';

@Module({
  imports: [
    SentryModule.forRoot(),

    // Rate Limiting: 300 req/min globalmente, rotas de IA: 10 req/min
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 300 },
      { name: 'ia', ttl: 60000, limit: 10 },
    ]),

    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Scheduler (cron jobs)
    ScheduleModule.forRoot(),

    // Cache
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getCacheConfig,
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Feature Modules
    AuthModule,
    UsuariosModule,
    ProdutosModule,
    ComprasModule,
    InventarioModule,
    ReceitasModule,
    BarcodeModule,
    ScraperModule,
    AffiliateModule,
    ProductClassificationModule,
    AdminModule,
    NotificacaoModule,

    IAModule,
    ComparacoesModule,
    ListasModule,
    PlanejamentoModule,
    UploadModule,
    AuditLogModule,
    HealthModule,
    StripeModule,
    MetricasModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }