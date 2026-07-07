import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EsqueciSenhaDto, RedefinirSenhaDto } from './dto/password-reset.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ global: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email ou senha inválidos' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Fazer login via Google' })
  @ApiResponse({
    status: 200,
    description: 'Login com Google realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token Google inválido' })
  async googleLogin(@Body() body: any): Promise<AuthResponseDto> {
    return this.authService.googleLogin(body.idToken);
  }

  @Public()
  @Post('apple-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login via Apple Sign In' })
  @ApiResponse({ status: 200, description: 'Login com Apple realizado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Token Apple inválido' })
  async appleLogin(@Body() body: { identityToken: string; fullName?: string }): Promise<AuthResponseDto> {
    return this.authService.appleLogin(body.identityToken, body.fullName);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Public()
  @Post('esqueci-senha')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 3600000, limit: 5 } }) // 5/hora por IP — anti-abuso de e-mail
  @ApiOperation({ summary: 'Solicita código de recuperação de senha por e-mail' })
  @ApiResponse({ status: 200, description: 'Sempre 200 — não revela se o e-mail existe' })
  async esqueciSenha(@Body() dto: EsqueciSenhaDto): Promise<{ mensagem: string }> {
    await this.authService.esqueciSenha(dto.email);
    return { mensagem: 'Se o e-mail estiver cadastrado, você receberá um código em instantes.' };
  }

  @Public()
  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Redefine a senha com o código recebido por e-mail' })
  @ApiResponse({ status: 200, description: 'Senha redefinida' })
  @ApiResponse({ status: 400, description: 'Código inválido, expirado ou tentativas excedidas' })
  async redefinirSenha(@Body() dto: RedefinirSenhaDto): Promise<{ mensagem: string }> {
    await this.authService.redefinirSenha(dto.email, dto.codigo, dto.nova_senha);
    return { mensagem: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout (remove refresh token)' })
  @ApiResponse({ status: 204, description: 'Logout realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async logout(@CurrentUser() user: Usuario): Promise<void> {
    return this.authService.logout(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar senha do usuário' })
  @ApiResponse({ status: 204, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado ou senha atual incorreta' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async changePassword(
    @CurrentUser() user: Usuario,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário', type: Usuario })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProfile(@CurrentUser() user: Usuario): Promise<Usuario> {
    return user;
  }
}
