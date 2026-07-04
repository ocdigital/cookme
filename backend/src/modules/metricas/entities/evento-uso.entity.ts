import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

/**
 * Event log de produto — base das métricas de retenção D7/D30.
 * Eventos mínimos: app_open, cupom_lido, receita_gerada, receita_feita,
 * paywall_visto, assinatura_criada.
 */
@Entity('eventos_uso')
@Index(['usuario_id', 'criado_em'])
@Index(['evento', 'criado_em'])
export class EventoUso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @Column({ type: 'varchar', length: 40 })
  evento: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  criado_em: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
