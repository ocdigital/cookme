import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token JWT (15 minutos)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token JWT (7 dias)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: () => Usuario,
  })
  user: Partial<Usuario>;

  constructor(access_token: string, refresh_token: string, user: Partial<Usuario>) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.user = user;
  }
}
