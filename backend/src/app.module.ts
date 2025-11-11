import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import { getDatabaseConfig } from './config/database.config';

// Módulos (vamos criar depois)
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { ComprasModule } from './modules/compras/compras.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ReceitasModule } from './modules/receitas/receitas.module';
import { BarcodeModule } from './modules/barcode/barcode.module';
import { ScraperModule } from './modules/scraper/scraper.module';

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

    // Feature Modules
    AuthModule,
    UsuariosModule,
    ProdutosModule,
    ComprasModule,
    InventarioModule,
    ReceitasModule,
    BarcodeModule,
    ScraperModule,
  ],
})
export class AppModule { }