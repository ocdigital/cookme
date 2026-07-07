import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength, Matches } from 'class-validator';

export class EsqueciSenhaDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class RedefinirSenhaDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos recebido por e-mail' })
  @IsString()
  @Length(6, 6, { message: 'O código tem 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'O código tem apenas números' })
  codigo: string;

  @ApiProperty({ example: 'NovaSenha123' })
  @IsString()
  @MinLength(6, { message: 'A senha precisa de pelo menos 6 caracteres' })
  nova_senha: string;
}
