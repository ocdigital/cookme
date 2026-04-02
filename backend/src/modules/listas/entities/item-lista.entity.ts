import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lista } from './lista.entity';

@Entity('itens_listas')
export class ItemLista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  listaId: string;

  @ManyToOne(() => Lista, (lista) => lista.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listaId' })
  lista: Lista;

  @Column()
  nome: string;

  @Column({ nullable: true, type: 'text' })
  descricao: string;

  @Column({ type: 'int', default: 1 })
  quantidade: number;

  @Column({ nullable: true })
  unidade: string; // kg, l, unidades, pacotes, etc

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  preco_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  preco_total: number; // quantidade * preco_unitario

  @Column({ default: false })
  comprado: boolean; // Marcado como já comprado

  @Column({ nullable: true })
  categoria: string; // Frutas, Legumes, Carnes, Bebidas, etc

  @Column({ nullable: true })
  loja: string; // Onde foi/será comprado

  @Column({ nullable: true })
  prioridade: 'alta' | 'media' | 'baixa'; // Prioridade de compra

  @Column({ default: 0, type: 'int' })
  ordem: number; // Para ordenação customizada

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}
