import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateListaDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orcamento?: number;
}
