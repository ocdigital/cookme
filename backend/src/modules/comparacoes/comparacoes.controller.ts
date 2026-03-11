import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { ComparacoesService } from './comparacoes.service';
import { HistoricoPrecosProdutoQueryDto } from './dto/historico-precos-query.dto';
import { HistoricoPrecosProdutoResponseDto } from './dto/historico-precos-response.dto';
import { ComparacaoLocaisQueryDto } from './dto/comparacao-locais-query.dto';
import { ComparacaoLocaisResponseDto } from './dto/comparacao-locais-response.dto';
import { GastosCategoriaQueryDto } from './dto/gastos-categoria-query.dto';
import { GastosCategoriaResponseDto } from './dto/gastos-categoria-response.dto';

@Controller('comparacoes')
@UseGuards(JwtAuthGuard)
@ApiTags('Comparacoes')
@ApiBearerAuth()
export class ComparacoesController {
  constructor(private readonly comparacoesService: ComparacoesService) {}

  /**
   * Retorna o histórico de preços de um produto específico ao longo do tempo
   * Permite ao usuário ver como o preço de um produto variou
   * e identificar o melhor momento para comprar
   */
  @Get('historico-precos')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  @ApiOperation({
    summary: 'Histórico de preços de um produto',
    description:
      'Retorna histórico completo de preços de um produto específico ao longo do tempo com estatísticas (média, mínimo, máximo)',
  })
  @ApiResponse({
    status: 200,
    type: HistoricoPrecosProdutoResponseDto,
    description: 'Histórico de preços com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async getHistoricoPrecos(
    @CurrentUser() user: Usuario,
    @Query() query: HistoricoPrecosProdutoQueryDto,
  ): Promise<HistoricoPrecosProdutoResponseDto> {
    return this.comparacoesService.getHistoricoPrecosProduto(user.id, query);
  }

  /**
   * Compara preços entre diferentes locais de compra
   * Ajuda o usuário a identificar qual supermercado/loja oferece
   * os melhores preços em média
   */
  @Get('comparacao-locais')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  @ApiOperation({
    summary: 'Comparação de preços entre locais de compra',
    description:
      'Compara preços médios entre diferentes supermercados/lojas e mostra economia/perda comparado com média',
  })
  @ApiResponse({
    status: 200,
    type: ComparacaoLocaisResponseDto,
    description: 'Comparação entre locais com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getComparacaoLocais(
    @CurrentUser() user: Usuario,
    @Query() query: ComparacaoLocaisQueryDto,
  ): Promise<ComparacaoLocaisResponseDto> {
    return this.comparacoesService.getComparacaoLocais(user.id, query);
  }

  /**
   * Analisa a distribuição de gastos por categoria de produtos
   * Mostra em quais categorias o usuário mais gasta
   * e o percentual de cada categoria no gasto total
   */
  @Get('gastos-categoria')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  @ApiOperation({
    summary: 'Análise de gastos por categoria',
    description:
      'Analisa distribuição de gastos entre categorias de produtos mostrando totais, percentuais e ticket médio',
  })
  @ApiResponse({
    status: 200,
    type: GastosCategoriaResponseDto,
    description: 'Análise de gastos com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getGastosPorCategoria(
    @CurrentUser() user: Usuario,
    @Query() query: GastosCategoriaQueryDto,
  ): Promise<GastosCategoriaResponseDto> {
    return this.comparacoesService.getGastosPorCategoria(user.id, query);
  }
}
