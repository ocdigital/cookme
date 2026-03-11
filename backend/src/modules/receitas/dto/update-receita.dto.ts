import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsEnum,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DificuldadeReceita } from '@common/enums/dificuldade-receita.enum';
import { ReceitaIngredienteDto } from './create-receita.dto';

export class UpdateReceitaDto {
  @ApiProperty({ description: 'Nome da receita', example: 'Arroz com Feijão', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ description: 'Modo de preparo', example: 'Cozinhe o arroz...', required: false })
  @IsString()
  @IsOptional()
  modo_preparo?: string;

  @ApiProperty({ description: 'Tempo de preparo em minutos', example: 30, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  tempo_preparo?: number;

  @ApiProperty({ description: 'Rendimento em porções', example: 4, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  rendimento_porcoes?: number;

  @ApiProperty({ enum: DificuldadeReceita, example: DificuldadeReceita.FACIL, required: false })
  @IsEnum(DificuldadeReceita)
  @IsOptional()
  dificuldade?: DificuldadeReceita;

  @ApiProperty({ description: 'Tags de dieta', example: ['vegetariano'], isArray: true, type: String, required: false })
  @IsArray()
  @IsOptional()
  tags_dieta?: string[];

  @ApiProperty({ description: 'Tags de preparo', example: ['rapido'], isArray: true, type: String, required: false })
  @IsArray()
  @IsOptional()
  tags_preparo?: string[];

  @ApiProperty({ description: 'Categoria da receita', example: 'almoco', required: false })
  @IsString()
  @IsOptional()
  categoria_receita?: string;

  @ApiProperty({ description: 'Descrição da receita', example: 'Uma deliciosa receita...', required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ description: 'URL da imagem', example: 'https://...', required: false })
  @IsString()
  @IsOptional()
  imagem_url?: string;

  @ApiProperty({ description: 'Ingredientes da receita', type: [ReceitaIngredienteDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceitaIngredienteDto)
  @IsOptional()
  ingredientes?: ReceitaIngredienteDto[];
}
