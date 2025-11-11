import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '@common/enums/user-role.enum';

export class UpdateUsuarioDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '(11) 98765-4321',
    required: false,
  })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({
    description: 'URL do avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @ApiProperty({
    description: 'Habilitar alertas de vencimento',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  alertas_habilitados?: boolean;

  @ApiProperty({
    description: 'Horário para receber alertas (formato HH:MM:SS)',
    example: '08:00:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  horario_alertas?: string;
}
