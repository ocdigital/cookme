import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notificacoes')
@Index(['usuario_admin_id', 'lido'])
@Index(['tipo'])
@Index(['criado_em'])
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 50 })
  tipo: string;

  @Column('varchar', { length: 50 })
  severidade: string;

  @Column('varchar', { length: 255 })
  titulo: string;

  @Column('text')
  mensagem: string;

  @Column('jsonb', { nullable: true })
  dados: Record<string, any> | null;

  @Column('varchar', { length: 50, nullable: true })
  acao_label: string | null;

  @Column('varchar', { length: 255, nullable: true })
  acao_rota: string | null;

  @Column('uuid', { nullable: true })
  acao_id: string | null;

  @Column('uuid')
  usuario_admin_id: string;

  @Column('boolean', { default: false })
  lido: boolean;

  @Column('timestamp', { nullable: true })
  lido_em: Date | null;

  @CreateDateColumn()
  criado_em: Date;
}
