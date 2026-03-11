import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IAService } from './ia.service';

@ApiTags('IA')
@ApiBearerAuth()
@Controller('ia')
export class IAController {
  constructor(private readonly iaService: IAService) {}

  @Post('classificar-produto')
  @ApiOperation({ summary: 'Classificar produto usando IA' })
  @ApiResponse({
    status: 200,
    description: 'Produto classificado com sucesso',
  })
  async classificarProduto(@Body() body: { nome_produto: string }) {
    return this.iaService.classificarProduto(body.nome_produto);
  }

  @Post('gerar-receita')
  @ApiOperation({ summary: 'Gerar receita com IA baseado em ingredientes' })
  @ApiResponse({
    status: 200,
    description: 'Receita gerada com sucesso',
  })
  async gerarReceita(
    @Body()
    body: {
      ingredientes: string[];
      preferencias?: {
        tipo?: string;
        tempo_preparo?: number;
        dificuldade?: string;
        restricoes?: string[];
      };
    },
  ) {
    return this.iaService.gerarReceita(body.ingredientes, body.preferencias);
  }

  @Post('sugerir-compras')
  @ApiOperation({ summary: 'Sugerir lista de compras inteligente' })
  @ApiResponse({
    status: 200,
    description: 'Sugestões geradas com sucesso',
  })
  async sugerirCompras(
    @Body()
    body: {
      inventario: any[];
      receitas_desejadas: any[];
    },
  ) {
    return this.iaService.sugerirCompras(
      body.inventario,
      body.receitas_desejadas,
    );
  }

  @Get('analisar-nutricional')
  @ApiOperation({ summary: 'Analisar informações nutricionais de um produto' })
  @ApiResponse({
    status: 200,
    description: 'Análise nutricional completa',
  })
  async analisarNutricional(
    @Query('produto') produto: string,
    @Query('porcao') porcao?: number,
  ) {
    return this.iaService.analisarNutricional(produto, porcao);
  }
}
