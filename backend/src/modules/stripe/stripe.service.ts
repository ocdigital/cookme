import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');

export const PLANOS_STRIPE = {
  premium_mensal: { label: 'Premium Mensal', preco: 'R$14,90/mês' },
  premium_anual:  { label: 'Premium Anual',  preco: 'R$99/ano' },
  familia:        { label: 'Família',         preco: 'R$19,90/mês' },
} as const;

@Injectable()
export class StripeService {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '');
  }

  async criarOuBuscarCliente(usuarioId: string, email: string, nome: string): Promise<string> {
    const existing = await this.stripe.customers.search({
      query: `metadata['usuario_id']:'${usuarioId}'`,
    });

    if (existing.data.length > 0) return existing.data[0].id;

    const customer = await this.stripe.customers.create({
      email,
      name: nome,
      metadata: { usuario_id: usuarioId },
    });

    return customer.id;
  }

  async criarCheckoutSession(params: {
    stripeCustomerId: string;
    priceId: string;
    usuarioId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: params.stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { usuario_id: params.usuarioId },
      locale: 'pt-BR',
    });

    return session.url!;
  }

  async criarPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  construirEvento(rawBody: Buffer, signature: string): ReturnType<InstanceType<typeof Stripe>['webhooks']['constructEvent']> {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  getPriceId(plano: keyof typeof PLANOS_STRIPE): string {
    const map: Record<string, string> = {
      premium_mensal: this.config.get<string>('STRIPE_PRICE_PREMIUM_MENSAL') || '',
      premium_anual:  this.config.get<string>('STRIPE_PRICE_PREMIUM_ANUAL') || '',
      familia:        this.config.get<string>('STRIPE_PRICE_FAMILIA') || '',
    };
    return map[plano] || '';
  }
}
