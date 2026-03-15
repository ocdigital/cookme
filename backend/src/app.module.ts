import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
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

@Module({
  imports: [
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
  ],
})
export class AppModule { }