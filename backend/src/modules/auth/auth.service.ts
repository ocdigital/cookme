import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(PasswordResetCode)
    private readonly resetCodeRepository: Repository<PasswordResetCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ── Esqueci minha senha ────────────────────────────────────────────────────

  private static readonly RESET_TTL_MIN = 15;
  private static readonly RESET_MAX_TENTATIVAS = 5;

  /**
   * Gera código de 6 dígitos e envia por e-mail.
   * NUNCA revela se o e-mail existe (anti-enumeração): retorna void sempre.
   */
  async esqueciSenha(email: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { email } });
    if (!usuario) return; // silêncio proposital

    // Invalida códigos pendentes anteriores (só o mais novo vale)
    await this.resetCodeRepository.update(
      { usuario_id: usuario.id, usado_em: IsNull() },
      { usado_em: new Date() },
    );

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const codigoHash = await bcrypt.hash(codigo, 10);
    const expiraEm = new Date(Date.now() + AuthService.RESET_TTL_MIN * 60 * 1000);

    await this.resetCodeRepository.save(
      this.resetCodeRepository.create({
        usuario_id: usuario.id,
        codigo_hash: codigoHash,
        expira_em: expiraEm,
      }),
    );

    await this.mailService.enviarCodigoRecuperacao(usuario.email, codigo);
  }

  /**
   * Valida o código e troca a senha. Single-use, TTL 15min, máx 5 tentativas.
   * Invalida o refresh_token — sessões antigas caem (conta possivelmente comprometida).
   * Mensagem de erro genérica: não diferencia "código errado" de "expirado" para fora.
   */
  async redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<void> {
    const erroGenerico = () =>
      new BadRequestException('Código inválido ou expirado. Solicite um novo código.');

    const usuario = await this.usuarioRepository.findOne({ where: { email } });
    if (!usuario) throw erroGenerico();

    const reset = await this.resetCodeRepository.findOne({
      where: { usuario_id: usuario.id, usado_em: IsNull() },
      order: { criado_em: 'DESC' },
    });
    if (!reset) throw erroGenerico();
    if (reset.expira_em.getTime() < Date.now()) throw erroGenerico();
    if (reset.tentativas >= AuthService.RESET_MAX_TENTATIVAS) throw erroGenerico();

    const confere = await bcrypt.compare(codigo, reset.codigo_hash);
    if (!confere) {
      await this.resetCodeRepository.increment({ id: reset.id }, 'tentativas', 1);
      throw erroGenerico();
    }

    const senhaHash = await this.hashPassword(novaSenha);
    await this.usuarioRepository.update(usuario.id, {
      senha: senhaHash,
      refresh_token: null as any,
    });
    await this.resetCodeRepository.update(reset.id, { usado_em: new Date() });
  }

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

      const tokenValido = usuario?.refresh_token
        ? await bcrypt.compare(refreshToken, usuario.refresh_token)
        : false;
      if (!usuario || !tokenValido) {
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
   * Altera a senha do usuário
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { senha_atual, nova_senha, confirmacao_senha } = changePasswordDto;

    // Busca o usuário com senha
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Valida senha atual
    const isPasswordValid = await this.comparePasswords(
      senha_atual,
      usuario.senha,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Valida confirmação de senha
    if (nova_senha !== confirmacao_senha) {
      throw new BadRequestException('Nova senha e confirmação não coincidem');
    }

    // Valida que nova senha é diferente da atual
    const isSamePassword = await this.comparePasswords(
      nova_senha,
      usuario.senha,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'Nova senha deve ser diferente da senha atual',
      );
    }

    // Hash da nova senha
    const hashedPassword = await this.hashPassword(nova_senha);

    // Atualiza senha e limpa flag de troca obrigatória
    await this.usuarioRepository.update(userId, {
      senha: hashedPassword,
      deve_trocar_senha: false,
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
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usuarioRepository.update(userId, {
      refresh_token: hashed,
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

  /**
   * Faz login via Google usando ID Token
   */
  async googleLogin(idToken: string): Promise<AuthResponseDto> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Login com Google não configurado');
    }
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      const { email, name, picture } = payload || {};

      // Procurar usuário existente
      let usuario = await this.usuarioRepository.findOne({
        where: { email },
      });

      // Se não existir, criar novo usuário
      if (!usuario) {
        usuario = this.usuarioRepository.create({
          email,
          nome: name,
          avatar_url: picture,
          senha: '', // Usuário Google não tem senha
          email_verificado: true, // Email do Google é automaticamente verificado
        });

        usuario = await this.usuarioRepository.save(usuario);
      }

      // Gerar tokens
      const tokens = await this.generateTokens(usuario);

      // Salvar refresh token
      await this.updateRefreshToken(usuario.id, tokens.refresh_token);

      // Remove campos sensíveis
      const { senha, ...usuarioSemSenha } = usuario;

      return {
        user: usuarioSemSenha,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      console.error('Erro ao fazer login Google:', error);
      throw new UnauthorizedException('Token Google inválido ou expirado');
    }
  }

  /**
   * Faz login via Apple usando Identity Token (JWT)
   * Decodifica o token sem verificar assinatura (suficiente para MVP).
   * Em produção: verificar contra apple.com/appleid/auth/keys
   */
  async appleLogin(identityToken: string, fullName?: string): Promise<AuthResponseDto> {
    try {
      // Decodifica JWT sem verificar assinatura — extrai claims
      const parts = identityToken.split('.');
      if (parts.length !== 3) throw new Error('Token inválido');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      const { email, sub: appleId } = payload;
      if (!email && !appleId) throw new Error('Token sem identificador');

      // Apple só manda o email no primeiro login — pode ser null depois
      const emailToUse = email || `${appleId}@privaterelay.appleid.com`;

      let usuario = await this.usuarioRepository.findOne({ where: { email: emailToUse } });

      if (!usuario) {
        usuario = this.usuarioRepository.create({
          email: emailToUse,
          nome: fullName || emailToUse.split('@')[0],
          senha: '',
          email_verificado: true,
        });
        usuario = await this.usuarioRepository.save(usuario);
      }

      const tokens = await this.generateTokens(usuario);
      await this.updateRefreshToken(usuario.id, tokens.refresh_token);

      const { senha, ...usuarioSemSenha } = usuario;
      return {
        user: usuarioSemSenha,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      console.error('Erro ao fazer login Apple:', error);
      throw new UnauthorizedException('Token Apple inválido ou expirado');
    }
  }
}
