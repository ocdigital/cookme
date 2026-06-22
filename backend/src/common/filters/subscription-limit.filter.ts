import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

class PremiumRequiredError extends Error {
  constructor(
    public readonly feature: string,
    public readonly planoAtual: string,
  ) {
    super('PREMIUM_REQUIRED');
  }
}

class LimitExceededError extends Error {
  constructor(
    public readonly tipo: string,
    public readonly limite: number,
  ) {
    super(`LIMIT_EXCEEDED:${tipo}:${limite}`);
  }
}

export { PremiumRequiredError, LimitExceededError };

@Catch(PremiumRequiredError, LimitExceededError)
export class SubscriptionLimitFilter implements ExceptionFilter {
  catch(exception: PremiumRequiredError | LimitExceededError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof PremiumRequiredError) {
      return res.status(403).json({
        statusCode: 403,
        message: `"${exception.feature}" requer plano Premium`,
        planoAtual: exception.planoAtual,
        upgrade: true,
      });
    }

    const label = exception.tipo === 'ocr' ? 'scans de nota fiscal' : 'gerações com IA';
    return res.status(403).json({
      statusCode: 403,
      message: `Limite de ${exception.limite} ${label} por mês atingido. Faça upgrade para continuar.`,
      planoAtual: 'free',
      upgrade: true,
      tipo: exception.tipo,
      limite: exception.limite,
    });
  }
}
