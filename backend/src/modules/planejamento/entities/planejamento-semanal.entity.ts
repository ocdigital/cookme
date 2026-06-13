import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Receita } from '../../receitas/entities/receita.entity';

@Entity('planejamento_semanal')
@Index(['usuario_id', 'numero_semana', 'dia_semana', 'tipo_refeicao'], { unique: true })
export class PlanejamentoSemanal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  usuario_id: string;

  // 1, 2, 3, 4 — semana do mês
  @Column({ type: 'int' })
  numero_semana: number;

  // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  @Column({ type: 'int' })
  dia_semana: number;

  // almoco ou jantar
  @Column({ type: 'enum', enum: ['almoco', 'jantar'] })
  tipo_refeicao: 'almoco' | 'jantar';

  @Column('uuid', { nullable: true })
  receita_id: string | null;

  @ManyToOne(() => Receita, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receita_id' })
  receita: Receita | null;

  // Se foi marcada como feita
  @Column({ default: false })
  feita: boolean;

  // Avaliação rápida: 1-5
  @Column({ type: 'int', nullable: true })
  avaliacao: number | null;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}
