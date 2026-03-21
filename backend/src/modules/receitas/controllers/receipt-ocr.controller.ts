import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ReceiptOcrService, DedupItem, ItemReceipt } from '../services/receipt-ocr.service';

interface ReceiptPhotoData {
  ocrText: string;
  photoNumber: number;
  totalPhotos?: number;
}

interface ProcessReceiptRequest {
  photos: ReceiptPhotoData[];
  ignoreWarnings?: boolean;
}

interface ProcessReceiptResponse {
  status: 'review_required' | 'success';
  items: ItemReceipt[];
  duplicatesFlagged?: DedupItem[];
  receiptNumber?: string | null;
  receiptDate?: string | null;
  statistics: {
    totalItemsProcessed: number;
    duplicatesRemoved: number;
    itemsNeedingReview: number;
  };
  message: string;
}

interface ValidateResponse {
  status: 'confirmed';
  items: ItemReceipt[];
  receiptNumber?: string;
  message: string;
}

@Controller('api/receitas/ocr')
export class ReceiptOcrController {
  private readonly logger = new Logger(ReceiptOcrController.name);

  constructor(private readonly receiptOcrService: ReceiptOcrService) {}

  /**
   * POST /api/receitas/ocr/process
   * Processa múltiplas fotos de cupom com OCR
   *
   * Request:
   * {
   *   "photos": [
   *     { "ocrText": "...", "photoNumber": 1, "totalPhotos": 3 },
   *     { "ocrText": "...", "photoNumber": 2, "totalPhotos": 3 },
   *     { "ocrText": "...", "photoNumber": 3, "totalPhotos": 3 }
   *   ],
   *   "ignoreWarnings": false
   * }
   */
  @Post('process')
  processReceipt(@Body() request: ProcessReceiptRequest): ProcessReceiptResponse {
    try {
      if (!request.photos || request.photos.length === 0) {
        throw new BadRequestException('Nenhuma foto de cupom fornecida');
      }

      if (request.photos.length > 10) {
        throw new BadRequestException(
          'Máximo de 10 fotos permitidas por cupom',
        );
      }

      // Processar cada foto
      const receipts = request.photos.map((photo) => {
        const items = this.receiptOcrService.extractItemsFromReceipt(
          photo.ocrText,
        );

        const receiptNumber =
          this.receiptOcrService.extractReceiptNumber(photo.ocrText);
        const date = this.receiptOcrService.extractReceiptDate(
          photo.ocrText,
        );

        return {
          items,
          rawText: photo.ocrText,
          photoNumber: photo.photoNumber,
          receiptNumber,
          date,
        };
      });

      // Deduplica itens entre as fotos
      const deduplicationResult =
        this.receiptOcrService.processMultipleReceipts(receipts);

      // Identifica itens que precisam de review
      const itemsNeedingReview =
        this.receiptOcrService.validateDeduplification(
          deduplicationResult.duplicatesFlagged,
        );

      this.logger.log(
        `Cupom processado: ${deduplicationResult.statistics.totalItemsProcessed} itens, ` +
          `${deduplicationResult.statistics.duplicatesRemoved} removidos, ` +
          `${itemsNeedingReview.length} para review`,
      );

      // Se há itens para review e usuário não ignorou, retornar para validação
      if (
        itemsNeedingReview.length > 0 &&
        !request.ignoreWarnings
      ) {
        return {
          status: 'review_required',
          items: deduplicationResult.uniqueItems,
          duplicatesFlagged: itemsNeedingReview,
          receiptNumber: receipts[0]?.receiptNumber,
          receiptDate: receipts[0]?.date,
          statistics: deduplicationResult.statistics,
          message: `${itemsNeedingReview.length} item(ns) aparecem em múltiplas fotos. ` +
            'Revise e confirme se deve remover duplicatas.',
        };
      }

      // Se aprovado (ignoreWarnings ou sem duplicatas), retornar itens finais
      return {
        status: 'success',
        items: deduplicationResult.uniqueItems,
        receiptNumber: receipts[0]?.receiptNumber,
        receiptDate: receipts[0]?.date,
        statistics: deduplicationResult.statistics,
        message: `Cupom processado com sucesso! ${deduplicationResult.uniqueItems.length} itens extraídos.`,
      };
    } catch (error) {
      this.logger.error('Erro ao processar cupom:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro ao processar cupom. Verifique as imagens e tente novamente.',
      );
    }
  }

  /**
   * POST /api/receitas/ocr/validate
   * Valida e confirma itens após review manual
   *
   * Permite usuário aprovar/rejeitar itens flagged
   */
  @Post('validate')
  validateAndConfirm(
    @Body()
    request: {
      items: ItemReceipt[];
      approvedDuplicates: string[]; // Índices dos itens duplicados a manter
      receiptNumber?: string;
    },
  ): ValidateResponse {
    try {
      if (!request.items || request.items.length === 0) {
        throw new BadRequestException(
          'Nenhum item para validar',
        );
      }

      this.logger.log(
        `Validação confirmada: ${request.items.length} itens, ` +
          `${request.approvedDuplicates.length} duplicatas aprovadas`,
      );

      return {
        status: 'confirmed',
        items: request.items,
        receiptNumber: request.receiptNumber,
        message: 'Itens confirmados e prontos para serem adicionados à receita.',
      };
    } catch (error) {
      this.logger.error('Erro ao validar cupom:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro ao validar cupom',
      );
    }
  }
}
