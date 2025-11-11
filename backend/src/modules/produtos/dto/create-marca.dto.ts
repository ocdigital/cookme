import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMarcaDto {
  @ApiProperty({
    description: 'Nome da marca',
    example: 'Tio João',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'URL do logo da marca',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({
    description: 'É parceiro/patrocinador',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  parceiro_patrocinio?: boolean;
}
