import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Snapshot persistente das sessões de scraper (a fonte quente continua em
 * memória — o processo filho não é serializável). Sobrevive a restart do pm2:
 * sessões órfãs são marcadas como erro na inicialização, com mensagem
 * amigável em vez de sumirem silenciosamente.
 */
@Entity('scraper_sessoes')
export class ScraperSessao {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  usuario_id: string;

  @Column({ type: 'text' })
  qrcode_texto: string;

  @Column({ type: 'varchar', length: 30 })
  @Index()
  status: string;

  @Column({ type: 'integer', default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  mensagem_erro: string | null;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;

  @Column({ type: 'timestamp' })
  expira_em: Date;
}
