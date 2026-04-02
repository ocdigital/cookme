import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ReceiptOcrService, ItemReceipt } from '../services/receipt-ocr.service';
import { ProductClassifierService } from '../services/product-classifier.service';
import { ReceiptImportService } from '../services/receipt-import.service';

interface ReceiptImportRequest {
  photos: Array<{
    ocrText: string;
    photoNumber: number;
  }>;
  data_compra?: string;
  loja?: string;
  usar_ia?: boolean; // true = IA Claude, false = regras simples
}

interface ProductValidationItem {
  nome: string;
  ingrediente_receita: boolean;
  confianca_classificacao: number;
  requer_validacao_manual: boolean;
  motivo: string;
}

interface ReceiptImportResponse {
  status: 'sucesso' | 'requer_validacao';
  produtos_adicionados: number;
  produtos_para_validar: ProductValidationItem[];
  resumo: {
    total_extraido: number;
    alimentos: number;
    nao_alimentos: number;
    confianca_media: number;
  };
  message: string;
}

@Controller('receitas/import')
@UseGuards(JwtAuthGuard)
export class ReceiptImportController {
  private readonly logger = new Logger(ReceiptImportController.name);

  constructor(
    private readonly receiptOcrService: ReceiptOcrService,
    private readonly classifierService: ProductClassifierService,
    private readonly receiptImportService: ReceiptImportService,
  ) {}

  /**
   * POST /api/receitas/import/cupom
   *
   * Fluxo completo: OCR → Classificação IA → Salvar Produtos + Inventário
   *
   * Request:
   * {
   *   "photos": [
   *     { "ocrText": "ARROZ 5KG...", "photoNumber": 1 }
   *   ],
   *   "data_compra": "2025-01-04",
   *   "loja": "Carrefour",
   *   "usar_ia": true
   * }
   */
  @Post('cupom')
  @HttpCode(200)
  async importarCupom(
    @Body() request: ReceiptImportRequest,
    @Req() req: any,
  ): Promise<ReceiptImportResponse> {
    try {
      const usuarioId = req.user.id;

      if (!request.photos || request.photos.length === 0) {
        throw new BadRequestException('Nenhuma foto de cupom fornecida');
      }

      this.logger.log(
        `Iniciando importação de cupom para usuário ${usuarioId}`,
      );

      // 1️⃣ EXTRAIR PRODUTOS DO CUPOM (OCR)
      const itemsExtraidos: ItemReceipt[] = [];

      for (const photo of request.photos) {
        const items = this.receiptOcrService.extractItemsFromReceipt(
          photo.ocrText,
        );
        itemsExtraidos.push(...items);
      }

      if (itemsExtraidos.length === 0) {
        return {
          status: 'sucesso',
          produtos_adicionados: 0,
          produtos_para_validar: [],
          resumo: {
            total_extraido: 0,
            alimentos: 0,
            nao_alimentos: 0,
            confianca_media: 0,
          },
          message: 'Nenhum produto extraído do cupom',
        };
      }

      // 2️⃣ CLASSIFICAR PRODUTOS (IA ou Regras)
      const nomesProdutos = itemsExtraidos.map((item) => item.nome);
      let resultado_classificacao;

      if (request.usar_ia !== false) {
        try {
          resultado_classificacao =
            await this.classifierService.classifyProducts(nomesProdutos);
        } catch (error) {
          this.logger.warn('IA indisponível, usando regras simples');
          resultado_classificacao =
            this.classifierService.classifyProductsSimple(nomesProdutos);
        }
      } else {
        resultado_classificacao =
          this.classifierService.classifyProductsSimple(nomesProdutos);
      }

      // 3️⃣ SALVAR PRODUTOS + INVENTÁRIO
      const resultado = await this.receiptImportService.salvarProdutosInventario(
        usuarioId,
        itemsExtraidos,
        resultado_classificacao.produtos_filtrados,
        {
          data_compra: request.data_compra,
          loja: request.loja,
        },
      );

      this.logger.log(
        `Cupom importado: ${resultado.produtos_adicionados} produtos salvos`,
      );

      return {
        status: resultado.requer_validacao ? 'requer_validacao' : 'sucesso',
        produtos_adicionados: resultado.produtos_adicionados,
        produtos_para_validar: resultado.produtos_para_validar,
        resumo: {
          total_extraido: itemsExtraidos.length,
          alimentos: resultado_classificacao.resumo.alimentos,
          nao_alimentos: resultado_classificacao.resumo.rejeitados,
          confianca_media:
            resultado_classificacao.produtos_filtrados.length > 0
              ? Math.round(
                  resultado_classificacao.produtos_filtrados.reduce(
                    (sum, p) => sum + p.confianca,
                    0,
                  ) / resultado_classificacao.produtos_filtrados.length,
                )
              : 0,
        },
        message: resultado.requer_validacao
          ? `${resultado.produtos_para_validar.length} produto(s) precisam de validação manual`
          : 'Cupom importado com sucesso!',
      };
    } catch (error) {
      this.logger.error('Erro ao importar cupom:', error);
      throw new BadRequestException(
        `Erro ao importar cupom: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * PATCH /api/receitas/import/validar/:produtoId
   *
   * Valida manualmente a classificação de um produto
   */
  @Post('validar')
  @HttpCode(200)
  async validarProduto(
    @Body()
    request: {
      produto_id: string;
      ingrediente_receita: boolean;
      motivo?: string;
    },
    @Req() req: any,
  ) {
    try {
      const usuarioId = req.user.id;

      await this.receiptImportService.validarProdutoManualmente(
        request.produto_id,
        usuarioId,
        request.ingrediente_receita,
        request.motivo,
      );

      return {
        status: 'sucesso',
        message: 'Classificação manual confirmada',
      };
    } catch (error) {
      this.logger.error('Erro ao validar produto:', error);
      throw new BadRequestException(
        `Erro ao validar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }
}
