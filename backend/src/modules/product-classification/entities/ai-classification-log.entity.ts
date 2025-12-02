import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum APIStatus {
  SUCESSO = 'sucesso',
  ERRO = 'erro',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
}

@Entity('ai_classification_logs')
@Index(['api_status', 'criado_em'])
@Index(['model_used', 'criado_em'])
export class AIClassificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  product_name: string;

  @Column({ type: 'varchar', length: 50 })
  model_used: string;

  @Column({
    type: 'enum',
    enum: APIStatus,
  })
  api_status: APIStatus;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence_score: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria_classificada: string;

  @Column({ type: 'integer' })
  tempo_requisicao_ms: number;

  @Column({ type: 'integer', nullable: true })
  tokens_utilizados: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  custo_estimado_usd: number;

  @Column({ type: 'text', nullable: true })
  erro_mensagem: string;

  @Column({ type: 'jsonb', nullable: true })
  request_metadata: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    model_temperature?: number;
    max_tokens?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  response_metadata: {
    finish_reason?: string;
    raw_response?: string;
    processing_time?: number;
  };

  @Column({ type: 'boolean', default: false })
  from_cache: boolean;

  @CreateDateColumn()
  criado_em: Date;
}
