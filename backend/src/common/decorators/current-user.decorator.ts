import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../modules/usuarios/entities/usuario.entity';

/**
 * Decorator para obter o usuário autenticado da requisição
 *
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: Usuario) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
