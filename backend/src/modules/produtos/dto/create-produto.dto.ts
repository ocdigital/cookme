import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  IsObject,
} from 'class-validator';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { ProductType } from '@common/enums/product-type.enum';

export class CreateProdutoDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Arroz Integral Tio João 1kg',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Tipo do produto',
    enum: ProductType,
    example: ProductType.ALIMENTO,
    default: ProductType.ALIMENTO,
  })
  @IsEnum(ProductType)
  @IsOptional()
  tipo?: ProductType;

  @ApiProperty({
    description: 'Código de barras EAN-13',
    example: '7891234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  codigo_barras?: string;

  @ApiProperty({
    description: 'ID da marca',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  marca_id?: string;

  @ApiProperty({
    description: 'ID da categoria',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoria_id?: string;

  @ApiProperty({
    description: 'Unidade de medida padrão',
    enum: UnidadeMedida,
    example: UnidadeMedida.KG,
  })
  @IsEnum(UnidadeMedida)
  unidade_padrao: UnidadeMedida;

  @ApiProperty({
    description: 'Validade média em dias (para estimativa)',
    example: 365,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  validade_media_dias?: number;

  @ApiProperty({
    description: 'Informações nutricionais em JSON',
    example: { calorias: 130, proteinas: 2.5, carboidratos: 28 },
    required: false,
  })
  @IsObject()
  @IsOptional()
  informacoes_nutricionais?: any;

  @ApiProperty({
    description: 'Tags para busca e classificação',
    example: ['integral', 'grãos', 'sem-gluten'],
    isArray: true,
    type: String,
    required: false,
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'IDs de produtos alternativos',
    example: ['123e4567-e89b-12d3-a456-426614174002'],
    isArray: true,
    type: String,
    required: false,
  })
  @IsArray()
  @IsOptional()
  alternativas_ids?: string[];
}
