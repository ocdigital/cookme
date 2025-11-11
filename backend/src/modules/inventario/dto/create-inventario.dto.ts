import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';

export class CreateInventarioDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  produto_id: string;

  @ApiProperty({ description: 'Quantidade disponível', example: 2.5 })
  @IsNumber()
  @Min(0.001)
  quantidade_disponivel: number;

  @ApiProperty({ enum: UnidadeMedida, example: UnidadeMedida.KG })
  @IsEnum(UnidadeMedida)
  unidade: UnidadeMedida;

  @ApiProperty({ description: 'Data de validade', example: '2025-06-15' })
  @IsDateString()
  data_validade: string;

  @ApiProperty({ description: 'Localização do produto', example: 'Geladeira', required: false })
  @IsString()
  @IsOptional()
  localizacao?: string;

  @ApiProperty({ enum: MetodoCadastro, example: MetodoCadastro.MANUAL })
  @IsEnum(MetodoCadastro)
  metodo_atualizacao: MetodoCadastro;

  @ApiProperty({ description: 'ID do item de compra (rastreabilidade)', required: false })
  @IsUUID()
  @IsOptional()
  compra_item_id?: string;
}
