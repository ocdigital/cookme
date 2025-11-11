import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator para exigir roles específicas em uma rota
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * deleteUser(@Param('id') id: string) {
 *   return this.usersService.remove(id);
 * }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
