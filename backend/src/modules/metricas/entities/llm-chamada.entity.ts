import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Observabilidade da cadeia de LLMs (molde: ai_classification_logs).
 * Registra TAMBÉM as falhas — é o dado que faltou quando o crédito
 * Anthropic zerou em produção sem ninguém perceber.
 */
@Entity('llm_chamadas')
@Index(['provider', 'criado_em'])
@Index(['contexto', 'criado_em'])
export class LlmChamada {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // geracao | rag_adaptacao | validacao
  @Column({ type: 'varchar', length: 30 })
  contexto: string;

  // anthropic | gemini | groq
  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  modelo: string | null;

  @Column({ type: 'integer', nullable: true })
  tokens_in: number | null;

  @Column({ type: 'integer', nullable: true })
  tokens_out: number | null;

  @Column({ type: 'integer', nullable: true })
  latencia_ms: number | null;

  @Column({ type: 'boolean', default: true })
  sucesso: boolean;

  @Column({ type: 'text', nullable: true })
  erro: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  custo_estimado: number | null;

  @CreateDateColumn()
  criado_em: Date;
}
