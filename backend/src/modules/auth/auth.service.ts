import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra um novo usuário
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, senha, nome } = registerDto;

    // Verifica se o email já existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await this.hashPassword(senha);

    // Cria o usuário
    const usuario = this.usuarioRepository.create({
      email,
      senha: hashedPassword,
      nome,
    });

    const savedUser = await this.usuarioRepository.save(usuario);

    // Gera tokens
    const tokens = await this.generateTokens(savedUser);

    // Salva refresh token no banco
    await this.updateRefreshToken(savedUser.id, tokens.refresh_token);

    // Remove campos sensíveis
    const { senha: _, refresh_token: __, ...userWithoutPassword } = savedUser;

    return new AuthResponseDto(
      tokens.access_token,
      tokens.refresh_token,
      userWithoutPassword,
    );
  }

  /**
   * Faz login do usuário
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, senha } = loginDto;

    // Busca o usuário (incluindo senha para validação)
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Valida a senha
    const isPasswordValid = await this.comparePasswords(senha, usuario.senha);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Atualiza último acesso
    await this.usuarioRepository.update(usuario.id, {
      ultimo_acesso: new Date(),
    });

    // Gera tokens
    const tokens = await this.generateTokens(usuario);

    // Salva refresh token no banco
    await this.updateRefreshToken(usuario.id, tokens.refresh_token);

    // Remove campos sensíveis
    const { senha: _, refresh_token: __, ...userWithoutPassword } = usuario;

    return new AuthResponseDto(
      tokens.access_token,
      tokens.refresh_token,
      userWithoutPassword,
    );
  }

  /**
   * Renova o access token usando refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verifica o refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Busca o usuário
      const usuario = await this.usuarioRepository.findOne({
        where: { id: payload.sub },
      });

      if (!usuario || usuario.refresh_token !== refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      // Gera novos tokens
      const tokens = await this.generateTokens(usuario);

      // Atualiza refresh token no banco
      await this.updateRefreshToken(usuario.id, tokens.refresh_token);

      // Remove campos sensíveis
      const { senha: _, refresh_token: __, ...userWithoutPassword } = usuario;

      return new AuthResponseDto(
        tokens.access_token,
        tokens.refresh_token,
        userWithoutPassword,
      );
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  /**
   * Faz logout do usuário (remove refresh token)
   */
  async logout(userId: string): Promise<void> {
    await this.usuarioRepository.update(userId, {
      refresh_token: null,
    });
  }

  /**
   * Valida um usuário pelo ID (usado pela JWT Strategy)
   */
  async validateUser(userId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return usuario;
  }

  /**
   * Gera access token e refresh token
   */
  private async generateTokens(usuario: Usuario): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    const [access_token, refresh_token] = await Promise.all([
      // Access Token (15 minutos)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
      }),
      // Refresh Token (7 dias)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
      }),
    ]);

    return { access_token, refresh_token };
  }

  /**
   * Atualiza o refresh token no banco
   */
  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.usuarioRepository.update(userId, {
      refresh_token: refreshToken,
    });
  }

  /**
   * Gera hash da senha usando bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara senha em texto plano com hash
   */
  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
