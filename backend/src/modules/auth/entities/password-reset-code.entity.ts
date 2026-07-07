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
 * Código de recuperação de senha (6 dígitos, enviado por e-mail).
 * Armazenado como hash bcrypt — nunca em claro. Single-use, TTL 15min,
 * máximo 5 tentativas de validação por código.
 */
@Entity('password_reset_codes')
export class PasswordResetCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  usuario_id: string;

  @Column({ type: 'varchar', length: 100 })
  codigo_hash: string;

  @Column({ type: 'timestamp' })
  expira_em: Date;

  @Column({ type: 'timestamp', nullable: true })
  usado_em: Date | null;

  @Column({ type: 'integer', default: 0 })
  tentativas: number;

  @CreateDateColumn()
  criado_em: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
