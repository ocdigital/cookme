import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from './entities/usuario.entity';
import { Preferencia } from './entities/preferencia.entity';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePreferenciaDto } from './dto/update-preferencia.dto';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

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
  @ApiResponse({
    status: 200,
    description: 'Preferências atualizadas com sucesso',
    type: Preferencia,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async updatePreferencias(
    @CurrentUser() user: Usuario,
    @Body() updatePreferenciaDto: UpdatePreferenciaDto,
  ): Promise<Preferencia> {
    return this.usuariosService.updatePreferencias(user.id, updatePreferenciaDto);
  }
}
