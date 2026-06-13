import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';

export class UpdatePreferenciaDto {
  @ApiProperty({
    description: 'Tags de dieta',
    example: ['vegetariano', 'sem-lactose'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsOptional()
  tags_dieta?: string[];

  @ApiProperty({
    description: 'Tags de preparo',
    example: ['rapido', 'facil'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsOptional()
  tags_preparo?: string[];

  @ApiProperty({
    description: 'Ingredientes a evitar',
    example: ['camarão', 'amendoim'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsOptional()
  ingredientes_evitar?: string[];

  @ApiProperty({
    description: 'Restrições alimentares',
    example: ['alergia a frutos do mar', 'intolerância à lactose'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsOptional()
  restricoes?: string[];

  @ApiProperty({
    description: 'Número de pessoas na residência',
    example: 4,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  numero_pessoas?: number;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  regiao_culinaria?: string;

  @IsIn(['normal', 'fitness', 'vegetariano', 'vegano'])
  @IsOptional()
  modo_alimentar?: 'normal' | 'fitness' | 'vegetariano' | 'vegano';

  @IsIn(['almoco_jantar', 'almoco', 'jantar'])
  @IsOptional()
  refeicoes_planejamento?: 'almoco_jantar' | 'almoco' | 'jantar';
}
