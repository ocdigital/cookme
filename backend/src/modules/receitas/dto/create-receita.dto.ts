import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
  IsUUID,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DificuldadeReceita } from '@common/enums/dificuldade-receita.enum';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

export class ReceitaIngredienteDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  produto_id: string;

  @ApiProperty({ description: 'Quantidade', example: 2 })
  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @ApiProperty({ enum: UnidadeMedida, example: UnidadeMedida.UN })
  @IsEnum(UnidadeMedida)
  unidade: UnidadeMedida;

  @ApiProperty({ description: 'Ingrediente opcional', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  opcional?: boolean;

  @ApiProperty({ description: 'Observação', example: 'picado', required: false })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiProperty({ description: 'Ordem do ingrediente', example: 1, required: false })
  @IsInt()
  @IsOptional()
  ordem?: number;
}

export class CreateReceitaDto {
  @ApiProperty({ description: 'Nome da receita', example: 'Arroz com Feijão' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Modo de preparo', example: 'Cozinhe o arroz...' })
  @IsString()
  @IsNotEmpty()
  modo_preparo: string;

  @ApiProperty({ description: 'Tempo de preparo em minutos', example: 30 })
  @IsInt()
  @Min(1)
  tempo_preparo: number;

  @ApiProperty({ description: 'Rendimento em porções', example: 4 })
  @IsInt()
  @Min(1)
  rendimento_porcoes: number;

  @ApiProperty({ enum: DificuldadeReceita, example: DificuldadeReceita.FACIL })
  @IsEnum(DificuldadeReceita)
  dificuldade: DificuldadeReceita;

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

  @ApiProperty({ description: 'Origem da receita', example: 'catalogo', required: false })
  @IsString()
  @IsOptional()
  origem?: string;

  @ApiProperty({ description: 'Ingredientes da receita', type: [ReceitaIngredienteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceitaIngredienteDto)
  ingredientes: ReceitaIngredienteDto[];
}
