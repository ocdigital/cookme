import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de um local de compra com seu preço médio
 */
export class LocalPrecoDto {
  @ApiProperty({
    description: 'Nome do local/supermercado',
    example: 'Supermercado ABC',
  })
  local_compra: string;

  @ApiProperty({
    description: 'Preço médio dos produtos neste local (R$)',
    example: 12.50,
  })
  preco_medio: number;

  @ApiProperty({
    description: 'Total de compras neste local',
    example: 15,
  })
  total_compras: number;

  @ApiProperty({
    description: 'Valor total gasto neste local (R$)',
    example: 450.00,
  })
  total_gasto: number;

  @ApiProperty({
    description:
      'Economia comparado com a média de todos os locais (R$). Positivo = mais barato',
    example: 2.30,
  })
  economia_vs_media: number;
}

/**
 * DTO de resposta para o endpoint de comparação entre locais
 */
export class ComparacaoLocaisResponseDto {
  @ApiProperty({
    description:
      'Lista de locais com análise de preços, ordenada por preço médio (mais barato primeiro)',
    type: [LocalPrecoDto],
  })
  locais: LocalPrecoDto[];
}
