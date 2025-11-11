import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BarcodeService } from './barcode.service';

@ApiTags('Barcode')
@ApiBearerAuth()
@Controller('barcode')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get('scan/:codigo')
  @ApiOperation({ summary: 'Buscar produto por código de barras' })
  @ApiResponse({
    status: 200,
    description: 'Resultado da busca',
  })
  async scan(@Param('codigo') codigo: string) {
    return this.barcodeService.buscarPorCodigo(codigo);
  }
}
