import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Receita } from '../../receitas/entities/receita.entity';
import { AffiliateClick } from './affiliate-click.entity';

@Entity('affiliate_links')
@Index(['receita_id', 'is_active'])
@Index(['supermarket_name', 'is_active'])
export class AffiliateLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  receita_id: string;

  @ManyToOne(() => Receita, (receita) => receita.affiliate_links, {
    eager: false,
    onDelete: 'CASCADE',
  })
  receita: Receita;

  @Column({ nullable: true })
  supermarket_id: string;

  @Column()
  supermarket_name: string; // Ex: 'Carrefour', 'Extra', 'Ifood'

  @Column({ type: 'text' })
  affiliate_url: string; // URL com código de rastreamento

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 2.0 })
  comissao_percentual: number; // 2%, 5%, etc

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  comissao_por_clique: number; // R$ 0,20, R$ 0,50

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relacionamentos
  @OneToMany(() => AffiliateClick, (click) => click.affiliate_link)
  clicks: AffiliateClick[];
}
