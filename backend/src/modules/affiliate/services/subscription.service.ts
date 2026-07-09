import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PremiumRequiredError, LimitExceededError } from '@common/filters/subscription-limit.filter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';

const PLAN_PRICES = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PREMIUM]: 9.9,
  [SubscriptionPlan.PREMIUM_PLUS]: 19.9,
};

const PLAN_FEATURES = {
  [SubscriptionPlan.FREE]: [
    'receitas_basicas',
    'inventario',
    'busca_receitas',
  ],
  [SubscriptionPlan.PREMIUM]: [
    'receitas_basicas',
    'inventario',
    'busca_receitas',
    'videos_hd',
    'receitas_ilimitadas',
    'recomendacoes_personalizadas',
  ],
  [SubscriptionPlan.PREMIUM_PLUS]: [
    'receitas_basicas',
    'inventario',
    'busca_receitas',
    'videos_hd',
    'receitas_ilimitadas',
    'recomendacoes_personalizadas',
    'consultoria_nutricional',
    'plano_personalizado',
    'relatorios_nutricionais',
  ],
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Cria uma nova assinatura
   */
  async criarAssinatura(
    usuarioId: string,
    plano: SubscriptionPlan,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  ): Promise<Subscription> {
    if (!usuarioId || !plano) {
      throw new BadRequestException('Campos obrigatórios faltando');
    }

    // Se já existe assinatura (free ou premium), atualizar em vez de criar nova
    const assinaturaExistente = await this.subscriptionRepository.findOne({
      where: { usuario_id: usuarioId },
      order: { criado_em: 'DESC' },
    });

    if (assinaturaExistente && assinaturaExistente.plano !== SubscriptionPlan.FREE) {
      // Já tem premium — atualizar stripe IDs e reativar
      assinaturaExistente.plano = plano;
      assinaturaExistente.status = SubscriptionStatus.ACTIVE;
      assinaturaExistente.stripe_customer_id = stripeCustomerId ?? assinaturaExistente.stripe_customer_id;
      assinaturaExistente.stripe_subscription_id = stripeSubscriptionId ?? assinaturaExistente.stripe_subscription_id;
      assinaturaExistente.data_proximo_pagamento = this.calcularProximaDataPagamento(new Date());
      return this.subscriptionRepository.save(assinaturaExistente);
    }

    const dataProximoPagamento = this.calcularProximaDataPagamento(new Date());

    // Se existe assinatura free, atualizar para premium
    if (assinaturaExistente) {
      assinaturaExistente.plano = plano;
      assinaturaExistente.preco_mensal = PLAN_PRICES[plano];
      assinaturaExistente.status = SubscriptionStatus.ACTIVE;
      if (stripeCustomerId) assinaturaExistente.stripe_customer_id = stripeCustomerId;
      if (stripeSubscriptionId) assinaturaExistente.stripe_subscription_id = stripeSubscriptionId;
      assinaturaExistente.data_proximo_pagamento = dataProximoPagamento;
      return this.subscriptionRepository.save(assinaturaExistente);
    }

    const assinatura = this.subscriptionRepository.create({
      usuario_id: usuarioId,
      plano,
      preco_mensal: PLAN_PRICES[plano],
      data_inicio: new Date(),
      data_proximo_pagamento: dataProximoPagamento,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status: SubscriptionStatus.ACTIVE,
    });

    const salva = await this.subscriptionRepository.save(assinatura);

    // Se não for plano free, registra transação
    if (plano !== SubscriptionPlan.FREE && PLAN_PRICES[plano] > 0) {
      await this.registrarTransacao(
        usuarioId,
        PLAN_PRICES[plano],
        `Assinatura ${plano}`,
        TransactionType.SUBSCRIPTION_PAYMENT,
        {
          subscription_id: salva.id,
        },
      );
    }

    return salva;
  }

  /**
   * Atualiza uma assinatura existente
   */
  async atualizarAssinatura(
    assinaturaId: string,
    novoPlano: SubscriptionPlan,
  ): Promise<Subscription> {
    const assinatura = await this.subscriptionRepository.findOne({
      where: { id: assinaturaId },
    });

    if (!assinatura) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    const planAnterior = assinatura.plano;

    // Atualiza plano
    assinatura.plano = novoPlano;
    assinatura.preco_mensal = PLAN_PRICES[novoPlano];

    const atualizada = await this.subscriptionRepository.save(assinatura);

    // Registra diferença de preço se houver
    const diferenca = PLAN_PRICES[novoPlano] - PLAN_PRICES[planAnterior];
    if (diferenca !== 0) {
      const tipo =
        diferenca > 0
          ? TransactionType.SUBSCRIPTION_PAYMENT
          : TransactionType.SUBSCRIPTION_REFUND;

      await this.registrarTransacao(
        assinatura.usuario_id,
        Math.abs(diferenca),
        `Ajuste de plano: ${planAnterior} → ${novoPlano}`,
        tipo,
        {
          subscription_id: assinaturaId,
        },
      );
    }

    return atualizada;
  }

  /**
   * Cancela uma assinatura
   */
  async cancelarAssinatura(assinaturaId: string, motivo?: string): Promise<void> {
    const assinatura = await this.subscriptionRepository.findOne({
      where: { id: assinaturaId },
    });

    if (!assinatura) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    assinatura.status = SubscriptionStatus.CANCELLED;
    assinatura.data_cancelamento = new Date();
    if (!assinatura.metadata) {
      assinatura.metadata = {};
    }
    assinatura.metadata.cancel_reason = motivo;

    await this.subscriptionRepository.save(assinatura);
  }

  /**
   * Obtém status da assinatura de um usuário
   */
  async obterStatusAssinatura(usuarioId: string): Promise<{
    plano: SubscriptionPlan;
    status: SubscriptionStatus;
    dataRenovacao: Date;
    featuresDesbloqueadas: string[];
  }> {
    const assinatura = await this.subscriptionRepository.findOne({
      where: {
        usuario_id: usuarioId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const plano = assinatura?.plano || SubscriptionPlan.FREE;

    return {
      plano,
      status: assinatura?.status || SubscriptionStatus.ACTIVE,
      dataRenovacao: assinatura?.data_proximo_pagamento || new Date(),
      featuresDesbloqueadas: PLAN_FEATURES[plano],
    };
  }

  /**
   * Verifica se um usuário tem acesso a um feature
   */
  async verificarAcesso(usuarioId: string, feature: string): Promise<boolean> {
    const status = await this.obterStatusAssinatura(usuarioId);
    return status.featuresDesbloqueadas.includes(feature);
  }

  /**
   * Processa webhook do Stripe para renovação automática
   */
  async processarWebhookRenovacao(
    stripeSubscriptionId: string,
    novoStatus: string,
  ): Promise<void> {
    const assinatura = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscriptionId },
    });

    if (!assinatura) {
      throw new NotFoundException('Assinatura Stripe não encontrada');
    }

    if (novoStatus === 'active') {
      assinatura.status = SubscriptionStatus.ACTIVE;
      assinatura.data_proximo_pagamento = this.calcularProximaDataPagamento(new Date());

      // Registra pagamento
      await this.registrarTransacao(
        assinatura.usuario_id,
        assinatura.preco_mensal,
        `Renovação de assinatura ${assinatura.plano}`,
        TransactionType.SUBSCRIPTION_PAYMENT,
        {
          subscription_id: assinatura.id,
        },
      );
    } else if (novoStatus === 'cancelled') {
      assinatura.status = SubscriptionStatus.CANCELLED;
    }

    await this.subscriptionRepository.save(assinatura);
  }

  /**
   * Obtém lista de assinaturas ativas
   */
  async obterAssinaturasAtivas(limite: number = 100): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['usuario'],
      order: { criado_em: 'DESC' },
      take: limite,
    } as any);
  }

  /**
   * Obtém assinaturas que vencem hoje
   */
  async obterAssinaturasParaRenovar(): Promise<Subscription[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('sub.data_proximo_pagamento >= :inicio', { inicio: hoje })
      .andWhere('sub.data_proximo_pagamento < :fim', { fim: amanha })
      .getMany();
  }

  /**
   * Registra uma transação de assinatura
   */
  private async registrarTransacao(
    usuarioId: string,
    valor: number,
    descricao: string,
    tipo: TransactionType,
    metadata?: any,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      usuario_id: usuarioId,
      tipo,
      valor,
      descricao,
      status: TransactionStatus.COMPLETED,
      metadata,
      processed_at: new Date(),
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Calcula próxima data de pagamento (próximo mês, mesmo dia)
   */
  private calcularProximaDataPagamento(dataAtual: Date): Date {
    const proxima = new Date(dataAtual);
    proxima.setMonth(proxima.getMonth() + 1);
    return proxima;
  }

  private readonly LIMITES_FREE = { ocr: 3, ia: 5 };

  private mesAtual(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  }

  private async resetarUsoSeNecessario(assinatura: Subscription): Promise<Subscription> {
    const resetadoEm = assinatura.usos_resetados_em;
    const mesReset = resetadoEm
      ? `${resetadoEm.getFullYear()}-${resetadoEm.getMonth()}`
      : null;
    if (mesReset !== this.mesAtual()) {
      assinatura.ocr_usos_mes = 0;
      assinatura.ia_usos_mes = 0;
      assinatura.usos_resetados_em = new Date();
      return this.subscriptionRepository.save(assinatura);
    }
    return assinatura;
  }

  async obterUsoMensal(usuarioId: string): Promise<{
    ocr: { usado: number; limite: number | null };
    ia:  { usado: number; limite: number | null };
  }> {
    let assinatura = await this.subscriptionRepository.findOne({
      where: { usuario_id: usuarioId, status: SubscriptionStatus.ACTIVE },
    });
    if (!assinatura) {
      return {
        ocr: { usado: 0, limite: this.LIMITES_FREE.ocr },
        ia:  { usado: 0, limite: this.LIMITES_FREE.ia },
      };
    }
    assinatura = await this.resetarUsoSeNecessario(assinatura);
    const isPremium = assinatura.plano !== SubscriptionPlan.FREE;
    return {
      ocr: { usado: assinatura.ocr_usos_mes, limite: isPremium ? null : this.LIMITES_FREE.ocr },
      ia:  { usado: assinatura.ia_usos_mes,  limite: isPremium ? null : this.LIMITES_FREE.ia },
    };
  }

  async verificarPremium(usuarioId: string, feature: string): Promise<void> {
    const assinatura = await this.subscriptionRepository.findOne({
      where: { usuario_id: usuarioId, status: SubscriptionStatus.ACTIVE },
    });
    const plano = assinatura?.plano ?? SubscriptionPlan.FREE;
    if (plano === SubscriptionPlan.FREE) {
      throw new PremiumRequiredError(feature, plano);
    }
  }

  async registrarUso(usuarioId: string, tipo: 'ocr' | 'ia'): Promise<void> {
    // Killswitch para instâncias que não gerenciam plano (ex: API/leitor de teste).
    // Produção do CookMe NÃO seta esta env → limite de plano continua valendo.
    if (process.env.SUBSCRIPTION_LIMITS_DISABLED === 'true') return;

    let assinatura = await this.subscriptionRepository.findOne({
      where: { usuario_id: usuarioId, status: SubscriptionStatus.ACTIVE },
    });
    if (!assinatura) {
      assinatura = this.subscriptionRepository.create({
        usuario_id: usuarioId,
        plano: SubscriptionPlan.FREE,
        preco_mensal: 0,
        status: SubscriptionStatus.ACTIVE,
        data_proximo_pagamento: this.calcularProximaDataPagamento(new Date()),
        usos_resetados_em: new Date(),
      });
      assinatura = await this.subscriptionRepository.save(assinatura);
    }
    assinatura = await this.resetarUsoSeNecessario(assinatura);
    const isPremium = assinatura.plano !== SubscriptionPlan.FREE;
    if (!isPremium) {
      const usado = tipo === 'ocr' ? assinatura.ocr_usos_mes : assinatura.ia_usos_mes;
      const limite = tipo === 'ocr' ? this.LIMITES_FREE.ocr : this.LIMITES_FREE.ia;
      if (usado >= limite) {
        throw new LimitExceededError(tipo, limite);
      }
    }
    if (tipo === 'ocr') assinatura.ocr_usos_mes += 1;
    else assinatura.ia_usos_mes += 1;
    await this.subscriptionRepository.save(assinatura);
  }
}
