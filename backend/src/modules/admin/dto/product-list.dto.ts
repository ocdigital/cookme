import { ApiProperty } from '@nestjs/swagger';

export class ProductListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ nullable: true })
  descricao: string | null;

  @ApiProperty({ nullable: true })
  codigo_barras: string | null;

  @ApiProperty({
    description: 'Categoria do produto',
    nullable: true,
  })
  categoria: {
    id: string;
    nome: string;
    icone?: string;
  } | null;

  @ApiProperty({
    description: 'Marca do produto',
    nullable: true,
  })
  marca: {
    id: string;
    nome: string;
  } | null;

  @ApiProperty({ nullable: true })
  unidade_padrao: string;

  @ApiProperty({ nullable: true })
  validade_media_dias: number | null;

  @ApiProperty()
  origem: string;

  @ApiProperty()
  verificado: boolean;

  @ApiProperty()
  criado_em: Date;

  @ApiProperty()
  atualizado_em: Date;
}

export class ListProductsResponseDto {
  @ApiProperty({ type: [ProductListDto] })
  data: ProductListDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}
