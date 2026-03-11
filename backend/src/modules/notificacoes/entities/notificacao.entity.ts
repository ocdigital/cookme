import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum NotificacaoTipo {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

@Entity('notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  usuario_id: string;

  @Column({
    type: 'enum',
    enum: NotificacaoTipo,
    default: NotificacaoTipo.INFO,
  })
  tipo: NotificacaoTipo;

  @Column()
  titulo: string;

  @Column('text')
  mensagem: string;

  @Column({ default: false })
  lida: boolean;

  @Column({ nullable: true })
  icone: string;

  @CreateDateColumn()
  criado_em: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
