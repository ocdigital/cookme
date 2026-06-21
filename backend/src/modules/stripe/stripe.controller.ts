import { Controller, Post, Get, Body, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService, PLANOS_STRIPE } from './stripe.service';
import { SubscriptionService } from '../affiliate/services/subscription.service';
import { SubscriptionPlan } from '../affiliate/entities/subscription.entity';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://192.168.86.9:4000';
const APP_SCHEME   = process.env.APP_SCHEME   || 'cookme';

@ApiTags('Stripe')
@ApiBearerAuth()
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Get('planos')
  @ApiOperation({ summary: 'Listar planos disponíveis' })
  listarPlanos() {
    return {
      planos: [
        { id: 'premium_mensal', ...PLANOS_STRIPE.premium_mensal },
        { id: 'premium_anual',  ...PLANOS_STRIPE.premium_anual },
        { id: 'familia',        ...PLANOS_STRIPE.familia },
      ],
    };
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Criar sessão de checkout Stripe' })
  async criarCheckout(
    @Request() req: any,
    @Body() body: { plano: keyof typeof PLANOS_STRIPE },
  ) {
    const { id: usuarioId, email, nome } = req.user;

    if (!body.plano || !PLANOS_STRIPE[body.plano]) {
      throw new BadRequestException('Plano inválido. Use: premium_mensal, premium_anual ou familia');
    }

    const priceId = this.stripeService.getPriceId(body.plano);
    if (!priceId) {
      throw new BadRequestException(`Price ID para "${body.plano}" não configurado no .env`);
    }

    const stripeCustomerId = await this.stripeService.criarOuBuscarCliente(usuarioId, email, nome);

    const checkoutUrl = await this.stripeService.criarCheckoutSession({
      stripeCustomerId,
      priceId,
      usuarioId,
      successUrl: `${APP_SCHEME}://planos?checkout=success`,
      cancelUrl:  `${APP_SCHEME}://planos?checkout=cancelled`,
    });

    return { url: checkoutUrl };
  }

  @Post('portal')
  @ApiOperation({ summary: 'Abrir portal de gerenciamento de assinatura' })
  async abrirPortal(@Request() req: any) {
    const status = await this.subscriptionService.obterStatusAssinatura(req.user.id);
    const stripeCustomerId = (status as any).stripe_customer_id;

    if (!stripeCustomerId) {
      throw new BadRequestException('Nenhuma assinatura Stripe encontrada');
    }

    const portalUrl = await this.stripeService.criarPortalSession(
      stripeCustomerId,
      `${FRONTEND_URL}/configuracoes`,
    );

    return { url: portalUrl };
  }

  @Get('status')
  @ApiOperation({ summary: 'Status da assinatura do usuário logado' })
  async status(@Request() req: any) {
    const status = await this.subscriptionService.obterStatusAssinatura(req.user.id);
    const uso = await this.subscriptionService.obterUsoMensal(req.user.id);
    return { ...status, uso };
  }
}
