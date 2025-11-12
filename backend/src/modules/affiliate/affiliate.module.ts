import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateLink } from './entities/affiliate-link.entity';
import { AffiliateClick } from './entities/affiliate-click.entity';
import { AffiliateConversion } from './entities/affiliate-conversion.entity';
import { RecipeRecommendation } from './entities/recipe-recommendation.entity';
import { Subscription } from './entities/subscription.entity';
import { Transaction } from './entities/transaction.entity';
import { AffiliateService } from './services/affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { RecommendationService } from './services/recommendation.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AffiliateLink,
      AffiliateClick,
      AffiliateConversion,
      RecipeRecommendation,
      Subscription,
      Transaction,
    ]),
  ],
  providers: [AffiliateService, RecommendationService, SubscriptionService],
  controllers: [AffiliateController],
  exports: [AffiliateService, RecommendationService, SubscriptionService],
})
export class AffiliateModule {}
