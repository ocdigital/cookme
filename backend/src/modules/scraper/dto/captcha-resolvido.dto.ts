import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CaptchaResolvidoDto {
  @ApiProperty({
    description: 'HTML completo da página do cupom fiscal (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cupomHtml?: string;
}
