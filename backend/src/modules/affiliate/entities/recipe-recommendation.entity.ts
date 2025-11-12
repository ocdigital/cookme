import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Receita } from '../../receitas/entities/receita.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum RecommendationType {
  WITH_YOUR_ITEMS = 'com_seus_alimentos', // Receita que pode fazer com o que tem
  PURCHASE_INCENTIVE = 'incentivar_compra', // Receita que incentiva compra
}

@Entity('receita_recomendacoes')
@Index(['usuario_id', 'created_at'])
@Index(['receita_id', 'categoria_recomendacao'])
export class RecipeRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  receita_id: string;

  @ManyToOne(() => Receita, {
    eager: true,
    onDelete: 'CASCADE',
  })
  receita: Receita;

  @Column('uuid')
  usuario_id: string;

  @ManyToOne(() => Usuario, {
    eager: false,
    onDelete: 'CASCADE',
  })
  usuario: Usuario;

  @Column({ type: 'jsonb', nullable: true })
  ingredientes_faltantes: Array<{
    nome: string;
    preco_estimado: number;
    unidade?: string;
  }>;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  preco_estimado: number; // Total de ingredientes faltantes

  @Column({
    type: 'enum',
    enum: RecommendationType,
    default: RecommendationType.WITH_YOUR_ITEMS,
  })
  categoria_recomendacao: RecommendationType;

  @Column({ type: 'integer', default: 0 })
  percentual_alimentos_disponiveis: number; // 0-100%

  @Column({ type: 'boolean', default: false })
  foi_clicada: boolean;

  @Column({ type: 'timestamp', nullable: true })
  data_clique: Date;

  @CreateDateColumn()
  created_at: Date;
}
