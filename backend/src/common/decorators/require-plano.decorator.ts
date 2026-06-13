import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '../../modules/affiliate/entities/subscription.entity';

export const PLANO_KEY = 'require_plano';
export const FEATURE_KEY = 'require_feature';

export const RequirePlano = (plano: SubscriptionPlan) =>
  SetMetadata(PLANO_KEY, plano);

export const RequireFeature = (feature: string) =>
  SetMetadata(FEATURE_KEY, feature);
