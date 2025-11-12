import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TransactionType {
  AFFILIATE_COMMISSION = 'affiliate_commission',
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  SUBSCRIPTION_REFUND = 'subscription_refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
@Index(['usuario_id', 'created_at'])
@Index(['tipo', 'status'])
export class Transaction {
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
    enum: TransactionType,
  })
  tipo: TransactionType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  valor: number;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referencia_externa_id: string; // stripe_id, affiliate_id, etc

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    affiliate_link_id?: string;
    conversion_id?: string;
    subscription_id?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;
}
