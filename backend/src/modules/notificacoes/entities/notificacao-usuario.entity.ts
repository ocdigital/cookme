import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notificacoes_usuario')
@Index(['usuario_id', 'lido'])
@Index(['criado_em'])
export class NotificacaoUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @Column('varchar', { length: 50 })
  tipo: string; // 'foto_pendente' | 'foto_aprovada' | 'foto_rejeitada' | 'receita_aprovada'

  @Column('varchar', { length: 255 })
  titulo: string;

  @Column('text')
  mensagem: string;

  @Column('jsonb', { nullable: true })
  dados: Record<string, any> | null;

  @Column('boolean', { default: false })
  lido: boolean;

  @Column('timestamp', { nullable: true })
  lido_em: Date | null;

  @CreateDateColumn()
  criado_em: Date;
}
