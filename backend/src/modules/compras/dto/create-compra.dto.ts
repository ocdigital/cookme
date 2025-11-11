import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

export class CompraItemDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  produto_id: string;

  @ApiProperty({ description: 'Quantidade', example: 2.5 })
  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @ApiProperty({ enum: UnidadeMedida, example: UnidadeMedida.KG })
  @IsEnum(UnidadeMedida)
  unidade: UnidadeMedida;

  @ApiProperty({ description: 'Preço unitário', example: 15.99 })
  @IsNumber()
  @Min(0)
  preco_unitario: number;

  @ApiProperty({ description: 'Data de validade', required: false })
  @IsDateString()
  @IsOptional()
  validade_final?: string;

  @ApiProperty({ description: 'Lote do produto', required: false })
  @IsString()
  @IsOptional()
  lote?: string;
}

export class CreateCompraDto {
  @ApiProperty({ description: 'Data da compra', example: '2025-01-15' })
  @IsDateString()
  data_compra: string;

  @ApiProperty({ description: 'Local da compra', example: 'Supermercado Pão de Açúcar' })
  @IsString()
  @IsNotEmpty()
  local_compra: string;

  @ApiProperty({ description: 'Valor total da compra', example: 150.50 })
  @IsNumber()
  @Min(0)
  valor_total: number;

  @ApiProperty({ enum: MetodoCadastro, example: MetodoCadastro.MANUAL })
  @IsEnum(MetodoCadastro)
  metodo_cadastro: MetodoCadastro;

  @ApiProperty({ description: 'Itens da compra', type: [CompraItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  itens: CompraItemDto[];

  @ApiProperty({ description: 'Tempo de cadastro em segundos', required: false })
  @IsInt()
  @IsOptional()
  tempo_cadastro_segundos?: number;
}
