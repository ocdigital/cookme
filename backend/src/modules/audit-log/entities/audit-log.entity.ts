import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  user_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  user_email: string | null;

  @Column({ type: 'varchar', nullable: true })
  user_role: string | null;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar' })
  route: string;

  @Column({ type: 'varchar' })
  path: string;

  @Column({ type: 'varchar', nullable: true })
  action: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  resource_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  resource_id: string | null;

  @Column({ type: 'int' })
  status_code: number;

  @Column({ type: 'int', nullable: true })
  duration_ms: number | null;

  @Column({ type: 'varchar', nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  user_agent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  request_body: Record<string, any> | null;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
