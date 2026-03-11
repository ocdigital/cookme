import { IsDate, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para query parameters do endpoint de gastos por categoria
 */
export class GastosCategoriaQueryDto {
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
    description:
      'Número máximo de categorias a retornar (retorna top N por gasto)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
