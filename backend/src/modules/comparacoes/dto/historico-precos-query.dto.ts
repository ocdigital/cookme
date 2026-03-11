import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para query parameters do endpoint de histórico de preços
 */
export class HistoricoPrecosProdutoQueryDto {
  @ApiProperty({
    description: 'ID do produto para consultar histórico de preços',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  produto_id: string;

  @ApiProperty({
    description: 'Data início para filtrar histórico (opcional)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_inicio?: Date;

  @ApiProperty({
    description: 'Data fim para filtrar histórico (opcional)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_fim?: Date;
}
