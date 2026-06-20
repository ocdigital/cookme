import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLANO_KEY, FEATURE_KEY } from '../decorators/require-plano.decorator';
import { SubscriptionService } from '../../modules/affiliate/services/subscription.service';
import { SubscriptionPlan, SubscriptionStatus } from '../../modules/affiliate/entities/subscription.entity';

const PLANO_ORDEM: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PREMIUM]: 1,
  [SubscriptionPlan.PREMIUM_PLUS]: 2,
  [SubscriptionPlan.FAMILIA]: 2, // mesma hierarquia que premium_plus
};

@Injectable()
export class PlanoGuard implements CanActivate {
  private readonly logger = new Logger(PlanoGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const usuarioId = req.user?.id;
    if (!usuarioId) return false;

    const planoRequerido = this.reflector.get<SubscriptionPlan>(PLANO_KEY, context.getHandler());
    const featureRequerida = this.reflector.get<string>(FEATURE_KEY, context.getHandler());

    if (!planoRequerido && !featureRequerida) return true;

    const status = await this.subscriptionService.obterStatusAssinatura(usuarioId);

    if (featureRequerida) {
      const temAcesso = status.featuresDesbloqueadas.includes(featureRequerida);
      if (!temAcesso) {
        throw new ForbiddenException({
          message: `Esta funcionalidade requer plano premium`,
          feature: featureRequerida,
          planoAtual: status.plano,
          upgrade: true,
        });
      }
    }

    if (planoRequerido) {
      const nivelAtual = PLANO_ORDEM[status.plano] ?? 0;
      const nivelRequerido = PLANO_ORDEM[planoRequerido] ?? 0;

      if (nivelAtual < nivelRequerido) {
        throw new ForbiddenException({
          message: `Esta funcionalidade requer plano ${planoRequerido}`,
          planoAtual: status.plano,
          planoRequerido,
          upgrade: true,
        });
      }
    }

    return true;
  }
}
