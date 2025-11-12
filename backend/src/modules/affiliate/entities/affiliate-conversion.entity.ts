import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { AffiliateClick } from './affiliate-click.entity';

export enum ConversionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('affiliate_conversions')
@Index(['affiliate_click_id', 'status'])
@Index(['status', 'created_at'])
export class AffiliateConversion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  affiliate_click_id: string;

  @ManyToOne(() => AffiliateClick, (click) => click.conversions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  affiliate_click: AffiliateClick;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pedido_id: string; // ID do pedido no supermercado/plataforma

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_pedido: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  comissao_ganha: number;

  @Column({
    type: 'enum',
    enum: ConversionStatus,
    default: ConversionStatus.PENDING,
  })
  status: ConversionStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  converted_at: Date;

  @Column({ type: 'text', nullable: true })
  notas: string; // Notas para rastreamento
}
