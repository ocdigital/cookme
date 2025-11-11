import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoriaDto {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Grãos e Cereais',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'ID da categoria pai (hierarquia)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoria_pai_id?: string;

  @ApiProperty({
    description: 'Ícone da categoria (emoji ou nome)',
    example: '🌾',
    required: false,
  })
  @IsString()
  @IsOptional()
  icone?: string;
}
