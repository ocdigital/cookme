import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { Receita } from '@modules/receitas/entities/receita.entity';
import { Compra } from '@modules/compras/entities/compra.entity';
import { ProductKnowledgeBase } from '@modules/product-classification/entities/product-knowledge-base.entity';
import { AbbreviationExpansion } from '@modules/product-classification/entities/abbreviation-expansion.entity';
import { CronLog } from './entities/cron-log.entity';
import { CronLogService } from './services/cron-log.service';
import { UsuariosModule } from '@modules/usuarios/usuarios.module';
import { ReceitasModule } from '@modules/receitas/receitas.module';
import { ProductClassificationModule } from '@modules/product-classification/product-classification.module';
import { InventarioModule } from '@modules/inventario/inventario.module';
import { ComprasModule } from '@modules/compras/compras.module';
import { NotificacaoModule } from '@modules/notificacoes/notificacao.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { ReceitaSeederService } from './services/receita-seeder.service';
import { SystemService } from './services/system.service';
import { SystemController } from './controllers/system.controller';
import { ModeracaoAdminController } from './controllers/moderacao.controller';
import { KnowledgeBaseAdminController } from './controllers/knowledge-base.controller';
import { AbbreviationsAdminController } from './controllers/abbreviations.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Produto, Usuario, Receita, Compra, ProductKnowledgeBase, AbbreviationExpansion, CronLog]),
    UsuariosModule,
    ReceitasModule,
    ProductClassificationModule,
    InventarioModule,
    ComprasModule,
    NotificacaoModule,
  ],
  controllers: [AdminController, SystemController, ModeracaoAdminController, KnowledgeBaseAdminController, AbbreviationsAdminController],
  providers: [AdminService, ReceitaSeederService, SystemService, CronLogService],
  exports: [AdminService, SystemService, CronLogService],
})
export class AdminModule {}
