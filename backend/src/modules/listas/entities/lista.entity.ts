import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { ItemLista } from './item-lista.entity';

export enum ListaStatus {
  ATIVA = 'ativa',
  ARQUIVADA = 'arquivada',
  COMPARTILHADA = 'compartilhada',
}

@Entity('listas')
@Index(['usuarioId', 'criado_em'])
export class Lista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ nullable: true, type: 'text' })
  descricao: string;

  @Column({
    type: 'enum',
    enum: ListaStatus,
    default: ListaStatus.ATIVA,
  })
  status: ListaStatus;

  @Column({ default: false })
  compartilhada: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  orcamento: number; // Budget límite (opcional)

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  total_estimado: number; // Total estimado baseado nos itens

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  total_gasto: number; // Total já gasto (baseado em itens marcados como comprados)

  @Column()
  usuarioId: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @OneToMany(() => ItemLista, (item) => item.lista, { cascade: true })
  itens: ItemLista[];

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}
