import { Module } from '@nestjs/common';
import { ProdutosModule } from '../produtos/produtos.module';
import { BarcodeService } from './barcode.service';
import { BarcodeController } from './barcode.controller';

@Module({
  imports: [ProdutosModule],
  providers: [BarcodeService],
  controllers: [BarcodeController],
  exports: [BarcodeService],
})
export class BarcodeModule {}
