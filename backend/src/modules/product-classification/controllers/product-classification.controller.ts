import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ProductClassificationService } from '../services/product-classification.service';
import { IntelligentInventoryService } from '../services/intelligent-inventory.service';
import { FoodCategory } from '../entities/product-knowledge-base.entity';

@ApiTags('Product Classification')
@Controller('api/product-classification')
export class ProductClassificationController {
  constructor(
    private productClassificationService: ProductClassificationService,
    private intelligentInventoryService: IntelligentInventoryService,
  ) {}

  /**
   * Classifica um produto (com cache)
   * GET /api/product-classification/classify/:productName
   */
  @Get('classify/:productName')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Classifica um produto como alimento ou não-alimento',
    description:
      'Verifica o cache local primeiro. Se não encontrado ou baixa confiança, consulta OpenAI API.',
  })
  @ApiResponse({
    status: 200,
    description: 'Classificação realizada com sucesso',
    schema: {
      example: {
        categoria: 'alimento',
        confidence: 0.98,
        fromCache: true,
        descricao: 'Maçã vermelha, fruta fresca',
      },
    },
  })
  async classificarProduto(
    @Param('productName') productName: string,
    @Request() req: any,
  ) {
    if (!productName) {
      throw new BadRequestException('Nome do produto é obrigatório');
    }

    return await this.productClassificationService.classificarProduto(
      decodeURIComponent(productName),
      req.user.id,
    );
  }

  /**
   * Classifica múltiplos produtos em batch
   * POST /api/product-classification/classify-batch
   */
  @Post('classify-batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Classifica múltiplos produtos',
    description:
      'Processa uma lista de produtos e retorna a classificação de cada um',
  })
  @ApiResponse({
    status: 200,
    description: 'Classificação em batch realizada',
    schema: {
      example: [
        {
          produto: 'Maçã',
          categoria: 'alimento',
          confidence: 0.98,
          fromCache: true,
        },
        {
          produto: 'Detergente',
          categoria: 'nao_alimento',
          confidence: 0.99,
          fromCache: true,
        },
      ],
    },
  })
  async classificarEmBatch(
    @Body() body: { produtos: string[] },
    @Request() req: any,
  ) {
    if (!body.produtos || !Array.isArray(body.produtos)) {
      throw new BadRequestException('Deve conter array de produtos');
    }

    return await this.productClassificationService.classificarEmBatch(
      body.produtos,
      req.user.id,
    );
  }

  /**
   * Adiciona produto ao inventário com validação inteligente
   * POST /api/product-classification/inventory/add
   */
  @Post('inventory/add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adiciona produto ao inventário com validação inteligente',
    description:
      'Classifica o produto e o adiciona se for alimento com alta confiança. Se baixa confiança, retorna modal de validação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto processado',
    schema: {
      example: {
        sucesso: true,
        produto: 'Maçã vermelha',
        categoria: 'alimento',
        confianca: 0.98,
        requerValidacaoUsuario: false,
        mensagem:
          'Produto "Maçã vermelha" adicionado ao inventário como alimento',
      },
    },
  })
  async adicionarProduto(
    @Body()
    body: {
      produto: string;
      quantidade?: number;
      unidade?: string;
      data_vencimento?: Date;
      barcode?: string;
    },
    @Request() req: any,
  ) {
    if (!body.produto) {
      throw new BadRequestException('Nome do produto é obrigatório');
    }

    return await this.intelligentInventoryService.adicionarComValidacao(
      body.produto,
      req.user.id,
      {
        quantity: body.quantidade,
        unit: body.unidade,
        expiryDate: body.data_vencimento,
        barcode: body.barcode,
      },
    );
  }

  /**
   * Valida a classificação de um produto
   * POST /api/product-classification/validate
   */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valida manualmente a classificação de um produto',
    description:
      'Registra a validação do usuário e atualiza a confiança da classificação',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação registrada com sucesso',
    schema: {
      example: {
        sucesso: true,
        produto: 'Maçã vermelha',
        categoria: 'alimento',
        confiancaAtualizada: 0.99,
        mensagem:
          'Obrigado! Produto "Maçã vermelha" confirmado como alimento e adicionado ao seu inventário.',
      },
    },
  })
  async validarClassificacao(
    @Body()
    body: {
      produto: string;
      categoria: FoodCategory;
      comentario?: string;
      nome_canonico?: string;
      codigo_barras?: string;
    },
    @Request() req: any,
  ) {
    if (!body.produto || !body.categoria) {
      throw new BadRequestException(
        'Produto e categoria são obrigatórios',
      );
    }

    return await this.intelligentInventoryService.validarClassificacao(
      body.produto,
      req.user.id,
      body.categoria,
      body.comentario,
      body.nome_canonico,
      body.codigo_barras,
    );
  }

  /**
   * Obtém histórico de validações de um produto
   * GET /api/product-classification/history/:productName
   */
  @Get('history/:productName')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtém histórico de validações de um produto',
    description:
      'Mostra todas as validações de usuários para um produto específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico recuperado',
    schema: {
      example: {
        produto: 'Maçã vermelha',
        categoria_atual: 'alimento',
        confianca: 0.98,
        total_validacoes: 5,
        validacoes_alimento: 5,
        validacoes_nao_alimento: 0,
        validacoes: [],
      },
    },
  })
  async obterHistorico(@Param('productName') productName: string) {
    return await this.productClassificationService.obterHistoricoValidacoes(
      decodeURIComponent(productName),
    );
  }

  /**
   * Obtém estatísticas do sistema de classificação
   * GET /api/product-classification/statistics
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtém estatísticas do sistema de classificação',
    description:
      'Retorna métricas sobre produtos classificados, cache hit rate, custos de API, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas recuperadas',
    schema: {
      example: {
        total_produtos_classificados: 150,
        produtos_alimentos: 120,
        produtos_nao_alimentos: 25,
        produtos_indefinidos: 5,
        confianca_media: 0.87,
        taxa_cache_hit: 78.5,
      },
    },
  })
  async obterEstatisticas(@Request() req: any) {
    return await this.intelligentInventoryService.obterEstatisticasClassificacao();
  }

  /**
   * Obtém alimentos disponíveis para recomendações
   * GET /api/product-classification/alimentos
   */
  @Get('alimentos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todos os alimentos classificados',
    description: 'Retorna apenas produtos com categoria "alimento"',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alimentos',
    schema: {
      example: [
        {
          id: 'uuid',
          product_name: 'Maçã vermelha',
          categoria: 'alimento',
          confidence_score: 0.98,
          total_adicoes: 45,
        },
      ],
    },
  })
  async obterAlimentos() {
    return await this.intelligentInventoryService.obterAlimentosDisponiveis();
  }

  /**
   * Obtém produtos não-alimentos (para administração)
   * GET /api/product-classification/nao-alimentos
   */
  @Get('nao-alimentos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista produtos não-alimentos identificados',
    description:
      'Mostra itens que foram identificados como não-alimentos (limpeza, higiene, etc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de não-alimentos',
  })
  async obterNaoAlimentos() {
    return await this.intelligentInventoryService.obterProdutosNaoAlimentos();
  }
}
