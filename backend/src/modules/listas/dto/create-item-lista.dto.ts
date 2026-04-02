import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class CreateItemListaDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantidade?: number;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco_unitario?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  loja?: string;

  @IsOptional()
  prioridade?: 'alta' | 'media' | 'baixa';
}
