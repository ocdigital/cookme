import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Preferencia } from './entities/preferencia.entity';
import { PreferenciaAprendida } from './entities/preferencia-aprendida.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Preferencia, PreferenciaAprendida]), UploadModule],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [TypeOrmModule, UsuariosService],
})
export class UsuariosModule { }
