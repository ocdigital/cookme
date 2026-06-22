import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium',           // premium_mensal no Stripe
  PREMIUM_PLUS = 'premium_plus', // premium_anual no Stripe
  FAMILIA = 'familia',           // familia no Stripe
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

@Entity('subscriptions')
@Index(['usuario_id', 'status'])
@Index(['status', 'data_proximo_pagamento'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @ManyToOne(() => Usuario, {
    eager: false,
    onDelete: 'CASCADE',
  })
  usuario: Usuario;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plano: SubscriptionPlan;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  preco_mensal: number;

  @CreateDateColumn()
  data_inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_proximo_pagamento: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_cancelamento: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_subscription_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_customer_id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'int', default: 0 })
  ocr_usos_mes: number;

  @Column({ type: 'int', default: 0 })
  ia_usos_mes: number;

  @Column({ type: 'timestamp', nullable: true })
  usos_resetados_em: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    cancel_reason?: string;
    notes?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}
