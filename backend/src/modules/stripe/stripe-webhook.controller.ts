import {
  Controller, Post, Headers, Req, RawBodyRequest,
  BadRequestException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { StripeService } from './stripe.service';
import { SubscriptionService } from '../affiliate/services/subscription.service';

@ApiTags('Stripe')
@SkipThrottle()
@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook — não chamar manualmente' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!sig) throw new BadRequestException('Stripe-Signature header ausente');

    let event: ReturnType<typeof this.stripeService.construirEvento>;
    try {
      event = this.stripeService.construirEvento(req.rawBody as Buffer, sig);
    } catch (err: any) {
      this.logger.error(`Webhook signature inválida: ${err.message}`);
      throw new BadRequestException('Webhook inválido');
    }

    this.logger.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.mode === 'subscription' && session.subscription) {
          await this.subscriptionService.processarWebhookRenovacao(
            session.subscription as string,
            'active',
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        await this.subscriptionService.processarWebhookRenovacao(sub.id, sub.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await this.subscriptionService.processarWebhookRenovacao(sub.id, 'cancelled');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          await this.subscriptionService.processarWebhookRenovacao(
            invoice.subscription as string,
            'past_due',
          );
        }
        break;
      }
    }

    return { received: true };
  }
}
