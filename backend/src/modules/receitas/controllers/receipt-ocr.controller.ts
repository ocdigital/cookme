import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  Inject,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ReceiptOcrService, DedupItem, ItemReceipt } from '../services/receipt-ocr.service';
import { ProductClassificationService } from '../../product-classification/services/product-classification.service';
import { SubscriptionService } from '../../affiliate/services/subscription.service';

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

@Controller('receitas/ocr')
export class ReceiptOcrController {
  private readonly logger = new Logger(ReceiptOcrController.name);

  constructor(
    private readonly receiptOcrService: ReceiptOcrService,
    private readonly configService: ConfigService,
    private readonly productClassificationService: ProductClassificationService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

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
   * POST /api/receitas/ocr/extract-from-image
   * Extrai texto OCR de uma imagem usando Gemini Vision API
   */
  @Post('extract-from-image')
  @UseGuards(JwtAuthGuard)
  async extractFromImage(
    @Request() req: any,
    @Body()
    request: {
      image: string; // Base64
      mimeType?: string;
    },
  ): Promise<{ ocrText: string }> {
    try {
      if (!request.image) {
        throw new BadRequestException('Imagem não fornecida');
      }

      await this.subscriptionService.registrarUso(req.user.id, 'ocr');

      const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!geminiApiKey) {
        this.logger.warn('GEMINI_API_KEY não configurada, usando mock');
        return this.getMockOcrText();
      }

      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const client = new GoogleGenerativeAI(geminiApiKey);
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const mimeType = request.mimeType || 'image/jpeg';
        const ocrText = await model.generateContent([
          {
            inlineData: {
              mimeType,
              data: request.image,
            },
          },
          {
            text: 'Leia o texto desta imagem de cupom/recibo de supermercado. Extraia APENAS os itens, linha por linha, sem nenhuma formatação extra. Formato esperado: "CÓDIGO PRODUTO QUANTIDADE UNIDADE x PREÇO_UNITÁRIO PREÇO_TOTAL". Se houver códigos de barras, inclua-os no início de cada linha. Retorne apenas o texto extraído, sem explicações.',
          },
        ]);

        const extractedText = ocrText.response
          .text()
          .trim()
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join('\n');

        this.logger.log(`OCR extracted ${extractedText.split('\n').length} lines from image`);
        return { ocrText: extractedText };
      } catch (geminiError) {
        this.logger.error('Erro ao usar Gemini Vision API, usando mock:', geminiError);
        return this.getMockOcrText();
      }
    } catch (error) {
      this.logger.error('Erro ao extrair OCR da imagem:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erro ao processar imagem');
    }
  }

  private getMockOcrText(): { ocrText: string } {
    const mockTexts = [
      'CAFÉ MORGES 500G 1 UN x 25,90 25,90\nÁGUA MINERAL 1.5L 2 UN x 18,50 37,00',
      'LEITE INTEGRAL 1L 1 UN x 4,50 4,50\nPÃO FRANCÊS 1 UN x 8,90 8,90\nQUEIJO MEIA CURA 1 UN x 35,00 35,00',
      'ARROZ INTEGRAL 2KG 1 UN x 18,90 18,90\nFEIJÃO CARIOCA 1KG 2 UN x 6,50 13,00\nÓLEO DE SOJA 900ML 1 UN x 7,20 7,20',
      'OVOS BRANCOS 12UN 1 UN x 8,80 8,80\nMARGARINA 500G 1 UN x 6,90 6,90\nSAL FINO 1KG 1 UN x 2,50 2,50',
      'BOLO DE CHOCOLATE 300G 3 UN x 12,80 38,40\nPÃO DE QUEIJO 10UN 2 UN x 8,90 17,80\nAÇÚCAR 1KG 1 UN x 4,80 4,80',
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    this.logger.log('Usando mock OCR text (fallback)');
    return { ocrText: randomText };
  }

  /**
   * POST /api/receitas/ocr/classify-items
   * Classifica itens extraídos do OCR como alimento ou não-alimento
   * Usa inteligência compartilhada que aprende com validações de usuários
   */
  @Post('classify-items')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async classifyItems(
    @Body()
    body: {
      items: Array<{
        nome: string;
        preco_total?: number;
        quantidade?: number;
      }>;
    },
    @Request() req: any,
  ): Promise<{
    items: Array<{
      nome: string;
      preco_total?: number;
      quantidade?: number;
      categoria: string;
      confianca: number;
      requer_validacao: boolean;
      ingrediente_receita?: boolean | null;
      descricao?: string;
    }>;
  }> {
    try {
      if (!body.items || body.items.length === 0) {
        throw new BadRequestException('Nenhum item para classificar');
      }

      const productNames = body.items.map((i) => i.nome);

      // Classifica todos os produtos em batch
      const classifications = await this.productClassificationService.classificarEmBatch(
        productNames,
        req.user?.sub,
      );

      // Mapeia resultado para incluir dados originais
      const classMap = new Map(classifications.map((c) => [c.produto, c]));

      return {
        items: body.items.map((item) => {
          const clf = classMap.get(item.nome);
          const confianca = clf?.confidence ?? 0;
          const categoria = clf?.categoria ?? 'indefinido';
          const ingrediente_receita = clf?.ingrediente_receita ?? null;

          return {
            ...item,
            categoria,
            confianca,
            requer_validacao: confianca < 0.75 || categoria === 'indefinido',
            ingrediente_receita,
            descricao: clf?.descricao,
          };
        }),
      };
    } catch (error) {
      this.logger.error('Erro ao classificar itens:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erro ao classificar itens do cupom');
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
