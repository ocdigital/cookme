import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator para exigir role ADMIN em uma rota
 *
 * @example
 * @Admin()
 * @Delete(':id')
 * deleteUser(@Param('id') id: string) {
 *   return this.usersService.remove(id);
 * }
 */
export const Admin = () => SetMetadata(ROLES_KEY, [UserRole.ADMIN]);
