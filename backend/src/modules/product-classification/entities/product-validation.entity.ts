import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductKnowledgeBase, FoodCategory } from './product-knowledge-base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('product_validations')
@Index(['product_knowledge_id', 'validacao_do_usuario'])
@Index(['usuario_id', 'criado_em'])
export class ProductValidation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_knowledge_id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  validacao_do_usuario: FoodCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comentario_usuario: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  ia_confidence_score: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ia_categoria_sugerida: string;

  @Column({ type: 'boolean', default: false })
  concordou_com_ia: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ip_address?: string;
    device_type?: string;
    user_confidence?: number;
    feedback_reason?: string;
  };

  @CreateDateColumn()
  criado_em: Date;

  @ManyToOne(
    () => ProductKnowledgeBase,
    (product) => product.validacoes,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'product_knowledge_id' })
  product_knowledge: ProductKnowledgeBase;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
