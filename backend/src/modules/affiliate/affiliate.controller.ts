import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AffiliateService } from './services/affiliate.service';
import { RecommendationService } from './services/recommendation.service';
import { SubscriptionService } from './services/subscription.service';
import {
  Subscription,
  SubscriptionPlan,
} from './entities/subscription.entity';

@ApiTags('Affiliate & Monetization')
@Controller('api/affiliate')
export class AffiliateController {
  constructor(
    private readonly affiliateService: AffiliateService,
    private readonly recommendationService: RecommendationService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ==================== AFFILIATE ENDPOINTS ====================

  /**
   * Registra um clique em um link de afiliado
   */
  @Post('registrar-clique')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Registra clique em link de afiliado',
    description: 'Rastreia quando um usuário clica em um link de compra',
  })
  @ApiResponse({ status: 201, description: 'Clique registrado com sucesso' })
  async registrarClique(
    @CurrentUser() user: any,
    @Body()
    body: {
      affiliate_link_id: string;
      receita_id: string;
      device_info?: any;
    },
  ) {
    if (!body.affiliate_link_id) {
      throw new BadRequestException('affiliate_link_id é obrigatório');
    }

    return this.affiliateService.registrarClique(
      body.affiliate_link_id,
      user.id,
      body.receita_id,
      body.device_info,
      null,
    );
  }

  /**
   * Busca links de afiliados para uma receita
   */
  @Get('links/:receitaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Busca links de afiliados de uma receita',
    description: 'Retorna todos os links de compra disponíveis para uma receita',
  })
  @ApiResponse({
    status: 200,
    description: 'Links encontrados com sucesso',
  })
  async buscarLinksReceita(@Param('receitaId') receitaId: string) {
    return this.affiliateService.buscarLinksReceita(receitaId);
  }

  /**
   * Obtém estatísticas de cliques e conversões
   */
  @Get('estatisticas')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtém estatísticas de afiliados',
    description: 'Retorna dados de cliques, conversões e comissões',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async obterEstatisticas(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('supermarket') supermarket?: string,
  ) {
    const inicio = dataInicio ? new Date(dataInicio) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
    const fim = dataFim ? new Date(dataFim) : new Date();

    return this.affiliateService.obterEstatisticas(inicio, fim, supermarket);
  }

  /**
   * Obtém comissões pendentes do usuário
   */
  @Get('comissoes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtém comissões do usuário',
    description: 'Retorna comissões pendentes, confirmadas e pagas',
  })
  @ApiResponse({ status: 200, description: 'Comissões obtidas com sucesso' })
  async obterComissoes(@CurrentUser() user: any) {
    return this.affiliateService.obterComissoesPendentes(user.id);
  }

  // ==================== RECOMMENDATION ENDPOINTS ====================

  /**
   * Busca recomendações com ingredientes que o usuário já tem
   */
  @Get('recomendacoes/com-meus-alimentos')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Recomendações com seus alimentos',
    description: 'Retorna receitas que você pode fazer com ingredientes que já tem',
  })
  @ApiResponse({
    status: 200,
    description: 'Recomendações obtidas com sucesso',
  })
  async recomendacoesComMeusAlimentos(
    @CurrentUser() user: any,
    @Query('limiteIngredientes') limiteIngredientes: number = 2,
    @Query('ordenarPor')
    ordenarPor: 'porcentagem_alimentos' | 'avaliacoes' = 'porcentagem_alimentos',
  ) {
    return this.recommendationService.obterRecomendacoesComMeusAlimentos(
      user.id,
      limiteIngredientes,
      ordenarPor,
    );
  }

  /**
   * Busca recomendações para incentivar compra
   */
  @Get('recomendacoes/incentivo-compra')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Recomendações com incentivo de compra',
    description:
      'Retorna receitas legais que requerem compra de alguns ingredientes, com links de compra',
  })
  @ApiResponse({
    status: 200,
    description: 'Recomendações obtidas com sucesso',
  })
  async recomendacoesIncentivCompra(
    @CurrentUser() user: any,
    @Query('precoMaximo') precoMaximo: number = 50,
  ) {
    return this.recommendationService.obterRecomendacoesIncentivCompra(
      user.id,
      precoMaximo,
    );
  }

  /**
   * Registra que uma recomendação foi clicada
   */
  @Post('recomendacoes/:recId/clique')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Registra clique em recomendação',
    description: 'Marca quando um usuário clica em uma recomendação',
  })
  @ApiResponse({ status: 200, description: 'Clique registrado' })
  async registrarCliqueRecomendacao(@Param('recId') recId: string) {
    await this.recommendationService.registrarCliqueRecomendacao(recId);
    return { success: true };
  }

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  /**
   * Obter status da assinatura do usuário
   */
  @Get('subscriptions/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Status da assinatura',
    description: 'Retorna o plano atual e features desbloqueadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Status obtido com sucesso',
  })
  async obterStatusAssinatura(@CurrentUser() user: any) {
    return this.subscriptionService.obterStatusAssinatura(user.id);
  }

  /**
   * Criar nova assinatura
   */
  @Post('subscriptions/criar')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar assinatura',
    description: 'Cria uma nova assinatura premium para o usuário',
  })
  @ApiResponse({
    status: 201,
    description: 'Assinatura criada com sucesso',
  })
  async criarAssinatura(
    @CurrentUser() user: any,
    @Body()
    body: {
      plano: SubscriptionPlan;
      stripe_customer_id?: string;
      stripe_subscription_id?: string;
    },
  ): Promise<Subscription> {
    if (!body.plano) {
      throw new BadRequestException('Plano é obrigatório');
    }

    return this.subscriptionService.criarAssinatura(
      user.id,
      body.plano,
      body.stripe_customer_id,
      body.stripe_subscription_id,
    );
  }

  /**
   * Atualizar assinatura
   */
  @Post('subscriptions/:assinaturaId/atualizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar plano',
    description: 'Muda o plano de assinatura do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Assinatura atualizada com sucesso',
  })
  async atualizarAssinatura(
    @Param('assinaturaId') assinaturaId: string,
    @Body() body: { novoPlano: SubscriptionPlan },
  ): Promise<Subscription> {
    if (!body.novoPlano) {
      throw new BadRequestException('Novo plano é obrigatório');
    }

    return this.subscriptionService.atualizarAssinatura(
      assinaturaId,
      body.novoPlano,
    );
  }

  /**
   * Cancelar assinatura
   */
  @Post('subscriptions/:assinaturaId/cancelar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancelar assinatura',
    description: 'Cancela a assinatura do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Assinatura cancelada com sucesso',
  })
  async cancelarAssinatura(
    @Param('assinaturaId') assinaturaId: string,
    @Body() body: { motivo?: string },
  ) {
    await this.subscriptionService.cancelarAssinatura(assinaturaId, body.motivo);
    return { success: true, message: 'Assinatura cancelada com sucesso' };
  }

  /**
   * Verificar acesso a uma feature
   */
  @Get('subscriptions/features/:feature')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar acesso a feature',
    description: 'Verifica se o usuário tem acesso a uma feature específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Acesso verificado',
  })
  async verificarAcesso(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
  ) {
    const temAcesso = await this.subscriptionService.verificarAcesso(
      user.id,
      feature,
    );
    return { feature, temAcesso };
  }
}
