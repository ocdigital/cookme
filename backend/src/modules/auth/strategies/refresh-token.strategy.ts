import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const usuario = await this.authService.validateUser(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return usuario;
  }
}
