import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class ExecutarReceitaDto {
  @ApiProperty({ description: 'Porções feitas', example: 4 })
  @IsInt()
  @Min(1)
  porcoes_feitas: number;

  @ApiProperty({ description: 'Tempo real de preparo em minutos', example: 35, required: false })
  @IsInt()
  @IsOptional()
  tempo_real_preparo?: number;

  @ApiProperty({ description: 'Avaliação (1-5 estrelas)', example: 5, required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  avaliacao?: number;

  @ApiProperty({ description: 'Comentário', example: 'Ficou delicioso!', required: false })
  @IsString()
  @IsOptional()
  comentario?: string;
}
