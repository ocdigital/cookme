import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class IniciarConsultaDto {
  @ApiProperty({
    description: 'Texto completo do QR Code do cupom fiscal SAT',
    example:
      '35251005088303000121590006146504781051248106|20251031103830|83.09||JewGEhBbHavStPy3r6DIDCK...',
  })
  @IsNotEmpty({ message: 'QR Code é obrigatório' })
  @IsString({ message: 'QR Code deve ser uma string' })
  @MinLength(44, { message: 'QR Code inválido (muito curto)' })
  qrcodeTexto: string;
}
