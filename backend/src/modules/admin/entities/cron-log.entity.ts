import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cron_logs')
export class CronLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60 })
  job: string;

  @Column({ type: 'varchar', length: 20, default: 'ok' })
  status: 'ok' | 'erro' | 'skip';

  @Column({ type: 'int', default: 0 })
  receitas_salvas: number;

  @Column({ type: 'int', default: 0 })
  receitas_descartadas: number;

  @Column({ type: 'text', nullable: true })
  detalhe: string | null;

  @Column({ type: 'int', nullable: true })
  duracao_ms: number | null;

  @CreateDateColumn()
  criado_em: Date;
}
