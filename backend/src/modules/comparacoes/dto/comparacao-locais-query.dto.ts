import { IsDate, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para query parameters do endpoint de comparação entre locais
 */
export class ComparacaoLocaisQueryDto {
  @ApiProperty({
    description: 'ID do produto para filtrar (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  produto_id?: string;

  @ApiProperty({
    description: 'ID da categoria para filtrar (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @ApiProperty({
    description: 'Data início para filtrar (opcional)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_inicio?: Date;

  @ApiProperty({
    description: 'Data fim para filtrar (opcional)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_fim?: Date;

  @ApiProperty({
    description: 'Limite de locais a retornar (opcional)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
