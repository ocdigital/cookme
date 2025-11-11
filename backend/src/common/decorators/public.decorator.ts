import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator para marcar rotas como públicas (sem autenticação JWT)
 *
 * @example
 * @Public()
 * @Get('hello')
 * getHello() {
 *   return 'Hello World!';
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
