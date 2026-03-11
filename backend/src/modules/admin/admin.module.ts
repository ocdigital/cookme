import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { Receita } from '@modules/receitas/entities/receita.entity';
import { Compra } from '@modules/compras/entities/compra.entity';
import { UsuariosModule } from '@modules/usuarios/usuarios.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, Usuario, Receita, Compra]),
    UsuariosModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
