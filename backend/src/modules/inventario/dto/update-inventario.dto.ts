import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, IsDateString } from 'class-validator';

export class UpdateInventarioDto {
  @ApiProperty({ description: 'Nova quantidade', example: 1.5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantidade_disponivel?: number;

  @ApiProperty({ description: 'Nova data de validade', example: '2025-07-15', required: false })
  @IsDateString()
  @IsOptional()
  data_validade?: string;

  @ApiProperty({ description: 'Nova localização', example: 'Freezer', required: false })
  @IsString()
  @IsOptional()
  localizacao?: string;
}
