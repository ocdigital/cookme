import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { NotificacaoTipo } from '../entities/notificacao.entity';

export class CreateNotificacaoDto {
  @ApiProperty({
    description: 'Tipo da notificação',
    enum: NotificacaoTipo,
    example: NotificacaoTipo.INFO,
  })
  @IsEnum(NotificacaoTipo)
  tipo: NotificacaoTipo;

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Novo produto cadastrado',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'O produto Arroz Integral foi adicionado com sucesso',
  })
  @IsString()
  @IsNotEmpty()
  mensagem: string;

  @ApiProperty({
    description: 'Ícone da notificação',
    example: '🛒',
    required: false,
  })
  @IsString()
  @IsOptional()
  icone?: string;
}
