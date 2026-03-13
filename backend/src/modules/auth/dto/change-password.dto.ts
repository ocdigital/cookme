import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'senhaAntiga123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  senha_atual: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'novaSenha456',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  nova_senha: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'novaSenha456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirmação de senha é obrigatória' })
  confirmacao_senha: string;
}
