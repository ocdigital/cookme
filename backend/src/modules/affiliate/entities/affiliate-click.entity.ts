import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { AffiliateLink } from './affiliate-link.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Receita } from '../../receitas/entities/receita.entity';
import { AffiliateConversion } from './affiliate-conversion.entity';

@Entity('affiliate_clicks')
@Index(['affiliate_link_id', 'clicked_at'])
@Index(['usuario_id', 'clicked_at'])
@Index(['receita_id', 'clicked_at'])
export class AffiliateClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  affiliate_link_id: string;

  @ManyToOne(() => AffiliateLink, (link) => link.clicks, {
    eager: true,
    onDelete: 'CASCADE',
  })
  affiliate_link: AffiliateLink;

  @Column('uuid', { nullable: true })
  usuario_id: string;

  @ManyToOne(() => Usuario, {
    eager: false,
    onDelete: 'SET NULL',
  })
  usuario: Usuario;

  @Column('uuid', { nullable: true })
  receita_id: string;

  @ManyToOne(() => Receita, {
    eager: false,
    onDelete: 'SET NULL',
  })
  receita: Receita;

  @CreateDateColumn()
  clicked_at: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'jsonb', nullable: true })
  device_info: {
    platform?: string;
    app_version?: string;
    device_name?: string;
    user_agent?: string;
  };

  // Relacionamentos
  @OneToMany(() => AffiliateConversion, (conversion) => conversion.affiliate_click)
  conversions: AffiliateConversion[];
}
