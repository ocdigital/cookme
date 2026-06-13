import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('abbreviation_expansions')
@Index(['abbr'], { unique: true })
export class AbbreviationExpansion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Abreviação em maiúsculas (ex: "MAC", "BIS", "DET", "CR LEITE")
  @Column({ type: 'varchar', length: 30, unique: true })
  abbr: string;

  // Nome expandido canônico (ex: "macarrão", "biscoito", "detergente")
  @Column({ type: 'varchar', length: 100 })
  expanded: string;

  // É ingrediente elegível para receitas?
  @Column({ type: 'boolean', default: true })
  is_ingredient: boolean;

  // Categoria do produto para agrupamento
  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria: string;

  // Origem da entrada: seed = pré-cadastrado, user = admin inseriu, ai = sugerido pela IA
  @Column({ type: 'varchar', length: 10, default: 'seed' })
  source: 'seed' | 'user' | 'ai';

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}
