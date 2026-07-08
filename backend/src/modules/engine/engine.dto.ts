import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstagioResolucao } from './engine.types';

export class ItemEntradaDto {
  @ApiProperty({
    description: 'Linha do item como veio do cupom fiscal (OCR ou QR)',
    example: 'CR LEITE ITALAC 200GR',
  })
  descricao: string;

  @ApiPropertyOptional({ description: 'EAN/GTIN quando disponível — resolve com confiança máxima', example: '7898080640611' })
  ean?: string;

  @ApiPropertyOptional({ description: 'Preço unitário em reais', example: 3.49 })
  preco?: number;

  @ApiPropertyOptional({ description: 'Quantidade comprada', example: 2 })
  quantidade?: number;

  @ApiPropertyOptional({ description: 'Unidade (kg, un, l…)', example: 'un' })
  unidade?: string;
}

export class CanonizarRequestDto {
  @ApiProperty({
    description: 'Itens a canonizar — strings cruas ou objetos. Máximo 100 por chamada.',
    type: [ItemEntradaDto],
    example: [
      'CR LEITE ITALAC 200GR',
      { descricao: 'FILE PEITO FGO CONG SEARA KG', preco: 18.9 },
      'SAB EM PO OMO 1KG',
    ],
  })
  itens: Array<ItemEntradaDto | string>;
}

export class ItemCanonizadoDto {
  @ApiProperty({ example: 'CR LEITE ITALAC 200GR' })
  descricao_original: string;

  @ApiProperty({
    description: 'Nome canônico do produto: minúsculas, sem marca, sem peso/embalagem',
    example: 'creme de leite',
  })
  produto_canonico: string;

  @ApiProperty({ description: 'Marca detectada na descrição, ou null', example: 'Italac', nullable: true })
  marca: string | null;

  @ApiProperty({
    description: 'false = certeza de não-alimento (guard determinístico); null = indeterminado',
    example: null,
    nullable: true,
  })
  eh_alimento: boolean | null;

  @ApiProperty({ example: null, nullable: true })
  ean: string | null;

  @ApiProperty({ example: 3.49, nullable: true })
  preco: number | null;

  @ApiProperty({ example: 2, nullable: true })
  quantidade: number | null;

  @ApiProperty({
    description:
      'Confiança honesta por estágio de resolução: ean 0.99 · dicionario 0.95 · kb 0.92 · regex 0.88 · fuzzy 0.75 · ia 0.7 · normalizer 0.55 · fallback 0.3',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  confianca: number;

  @ApiProperty({
    description: 'Estágio do pipeline que resolveu o item',
    enum: ['ean', 'dicionario', 'kb', 'fuzzy', 'regex', 'normalizer', 'ia', 'fallback'],
    example: 'dicionario',
  })
  estagio: EstagioResolucao;
}

export class CanonizarResponseDto {
  @ApiProperty({ type: [ItemCanonizadoDto] })
  itens: ItemCanonizadoDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ description: 'Tempo de processamento do lote em ms', example: 17 })
  latencia_ms: number;

  @ApiProperty({ description: 'Média das confianças do lote', example: 0.95 })
  confianca_media: number;
}
