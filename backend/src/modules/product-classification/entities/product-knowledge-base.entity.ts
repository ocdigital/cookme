import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProductValidation } from './product-validation.entity';

export enum FoodCategory {
  ALIMENTO = 'alimento',
  NAO_ALIMENTO = 'nao_alimento',
  INDEFINIDO = 'indefinido',
}

@Entity('product_knowledge_base')
@Index(['product_name', 'categoria'])
@Index(['confidence_score', 'categoria'])
export class ProductKnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  product_name: string;

  @Column({ type: 'varchar', length: 50 })
  normalized_name: string;

  // Nome canônico do ingrediente para matching com receitas (ex: "ovo", "leite", "frango")
  // Null = ainda não mapeado, usar normalizer como fallback
  @Column({ type: 'varchar', length: 100, nullable: true })
  canonical_ingredient: string;

  // EAN aprendido — resolve canonização com zero ambiguidade em recompras
  @Column({ type: 'varchar', length: 14, nullable: true })
  @Index()
  codigo_barras: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: FoodCategory.INDEFINIDO,
  })
  categoria: FoodCategory;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  confidence_score: number;

  @Column({ type: 'integer', default: 1 })
  total_validacoes: number;

  @Column({ type: 'integer', default: 0 })
  validacoes_alimento: number;

  @Column({ type: 'integer', default: 0 })
  validacoes_nao_alimento: number;

  @Column({ type: 'boolean', default: true, nullable: true })
  ingrediente_receita: boolean;

  @Column({ type: 'integer', default: 0 })
  validacoes_ingrediente_sim: number;

  @Column({ type: 'integer', default: 0 })
  validacoes_ingrediente_nao: number;

  @Column({ type: 'jsonb', nullable: true })
  classification_metadata: {
    keywords?: string[];
    brand?: string;
    subcategory?: string;
    source?: 'openai' | 'user_feedback' | 'manual';
    last_classified_by?: 'openai' | 'user';
  };

  @Column({ type: 'text', nullable: true })
  descricao_classificacao: string;

  @Column({ type: 'integer', default: 0 })
  total_adicoes: number;

  @Column({ type: 'timestamp', nullable: true })
  ultima_classificacao: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;

  @OneToMany(
    () => ProductValidation,
    (validation) => validation.product_knowledge,
    { cascade: true },
  )
  validacoes: ProductValidation[];
}
