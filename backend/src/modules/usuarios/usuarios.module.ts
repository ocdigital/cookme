import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Preferencia } from './entities/preferencia.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Preferencia])],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [TypeOrmModule, UsuariosService],
})
export class UsuariosModule { }
