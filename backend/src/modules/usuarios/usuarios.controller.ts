import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { UploadService } from '../upload/upload.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from './entities/usuario.entity';
import { Preferencia } from './entities/preferencia.entity';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePreferenciaDto } from './dto/update-preferencia.dto';

const MIME_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    type: Usuario,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProfile(@CurrentUser() user: Usuario): Promise<Usuario> {
    return this.usuariosService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: Usuario,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateProfile(
    @CurrentUser() user: Usuario,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    return this.usuariosService.update(user.id, updateUsuarioDto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload de avatar do usuário (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar atualizado com sucesso', type: Usuario })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (MIME_PERMITIDOS.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException(`Formato não suportado: ${file.mimetype}`), false);
    },
  }))
  async updateAvatar(
    @CurrentUser() user: Usuario,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Usuario> {
    if (!file) throw new BadRequestException('Nenhuma imagem enviada');
    const avatar_url = await this.uploadService.uploadImagem(
      file.buffer, file.originalname, file.mimetype, 'usuarios/avatares',
    );
    return this.usuariosService.update(user.id, { avatar_url });
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar conta do usuário' })
  @ApiResponse({ status: 204, description: 'Conta deletada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async deleteAccount(@CurrentUser() user: Usuario): Promise<void> {
    return this.usuariosService.remove(user.id);
  }

  @Get('preferencias')
  @ApiOperation({ summary: 'Obter preferências do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Preferências do usuário',
    type: Preferencia,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getPreferencias(@CurrentUser() user: Usuario): Promise<Preferencia> {
    return this.usuariosService.getPreferencias(user.id);
  }

  @Patch('preferencias')
  @ApiOperation({ summary: 'Atualizar preferências do usuário' })
  @ApiResponse({ status: 200, type: Preferencia })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async updatePreferencias(
    @CurrentUser() user: Usuario,
    @Body() updatePreferenciaDto: UpdatePreferenciaDto,
  ): Promise<Preferencia> {
    return this.usuariosService.updatePreferencias(user.id, updatePreferenciaDto);
  }

  @Patch('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Salvar push token do dispositivo' })
  async savePushToken(
    @CurrentUser() user: Usuario,
    @Body('token') token: string,
  ): Promise<void> {
    await this.usuariosService.savePushToken(user.id, token);
  }
}
