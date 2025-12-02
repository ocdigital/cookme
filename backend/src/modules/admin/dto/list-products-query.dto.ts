import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListProductsQueryDto {
  @ApiProperty({ description: 'Buscar por nome do produto', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filtrar por ID da categoria', required: false })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiProperty({ description: 'Filtrar por ID da marca', required: false })
  @IsOptional()
  @IsString()
  marcaId?: string;

  @ApiProperty({
    description: 'Número da página (começa em 1)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiProperty({
    description: 'Ordenar por campo (nome, criado_em)',
    required: false,
    default: 'criado_em',
  })
  @IsOptional()
  @IsString()
  sort: string = 'criado_em';

  @ApiProperty({
    description: 'Direção da ordenação (ASC, DESC)',
    required: false,
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  order: 'ASC' | 'DESC' = 'DESC';
}
