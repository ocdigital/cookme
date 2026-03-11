import { ApiProperty } from '@nestjs/swagger';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

/**
 * DTO de um item no histórico de preços
 */
export class HistoricoPrecoItemDto {
  @ApiProperty({
    description: 'Data da compra',
    example: '2025-01-15T00:00:00Z',
  })
  data_compra: Date;

  @ApiProperty({
    description: 'Preço unitário normalizado para unidade padrão (R$/unidade)',
    example: 5.50,
  })
  preco_unitario_normalizado: number;

  @ApiProperty({
    description: 'Quantidade comprada',
    example: 1,
  })
  quantidade_comprada: number;

  @ApiProperty({
    description: 'Unidade de medida da compra',
    enum: Object.values(UnidadeMedida),
    example: 'kg',
  })
  unidade_comprada: UnidadeMedida;

  @ApiProperty({
    description: 'Local onde foi feita a compra',
    example: 'Supermercado ABC',
  })
  local_compra: string;

  @ApiProperty({
    description: 'ID da compra para rastreabilidade',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  compra_id: string;
}

/**
 * DTO de resposta para o endpoint de histórico de preços
 */
export class HistoricoPrecosProdutoResponseDto {
  @ApiProperty({
    description: 'ID do produto consultado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  produto_id: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Arroz Integral',
  })
  produto_nome: string;

  @ApiProperty({
    description: 'Unidade padrão para normalização de preços',
    enum: Object.values(UnidadeMedida),
    example: 'kg',
  })
  unidade_padrao: UnidadeMedida;

  @ApiProperty({
    description: 'Preço médio do produto (R$/unidade padrão)',
    example: 5.87,
  })
  preco_medio: number;

  @ApiProperty({
    description: 'Menor preço encontrado (R$/unidade padrão)',
    example: 4.99,
  })
  preco_minimo: number;

  @ApiProperty({
    description: 'Maior preço encontrado (R$/unidade padrão)',
    example: 6.89,
  })
  preco_maximo: number;

  @ApiProperty({
    description: 'Total de compras do produto no período',
    example: 8,
  })
  total_compras: number;

  @ApiProperty({
    description: 'Lista com histórico completo de preços',
    type: [HistoricoPrecoItemDto],
  })
  historico: HistoricoPrecoItemDto[];
}
