import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de gasto em uma categoria específica
 */
export class CategoriaGastoDto {
  @ApiProperty({
    description: 'ID da categoria (UUID) ou null se sem categoria',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  categoria_id: string | null;

  @ApiProperty({
    description: 'Nome da categoria ou "Sem categoria"',
    example: 'Carnes',
  })
  categoria_nome: string;

  @ApiProperty({
    description: 'Total gasto nesta categoria (R$)',
    example: 450.00,
  })
  total_gasto: number;

  @ApiProperty({
    description: 'Percentual do gasto total desta categoria',
    example: 36.0,
  })
  percentual_total: number;

  @ApiProperty({
    description: 'Total de compras/itens nesta categoria',
    example: 12,
  })
  total_compras: number;

  @ApiProperty({
    description: 'Valor médio por compra nesta categoria (R$)',
    example: 37.50,
  })
  ticket_medio: number;
}

/**
 * DTO de resposta para o endpoint de gastos por categoria
 */
export class GastosCategoriaResponseDto {
  @ApiProperty({
    description: 'Gasto total em todas as categorias (R$)',
    example: 1250.00,
  })
  total_gasto: number;

  @ApiProperty({
    description:
      'Distribuição de gastos por categoria, ordenada por gasto (maior para menor)',
    type: [CategoriaGastoDto],
  })
  categorias: CategoriaGastoDto[];
}
