import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { Subscription } from '../affiliate/entities/subscription.entity';
import { Transaction } from '../affiliate/entities/transaction.entity';
import { SubscriptionService } from '../affiliate/services/subscription.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Subscription, Transaction]),
  ],
  providers: [StripeService, SubscriptionService],
  controllers: [StripeController, StripeWebhookController],
  exports: [StripeService, SubscriptionService],
})
export class StripeModule {}
