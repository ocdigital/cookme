import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Receita } from './receita.entity';

@Entity('receita_favoritas')
@Unique(['usuario_id', 'receita_id'])
export class ReceitaFavorita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'uuid' })
  receita_id: string;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Receita, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receita_id' })
  receita: Receita;

  @CreateDateColumn()
  criado_em: Date;
}
