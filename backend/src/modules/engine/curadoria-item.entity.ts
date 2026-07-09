import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Fila de curadoria (PLANO_PRECISAO_ENGINE.md §7): todo item resolvido com
 * confiança abaixo de LIMIAR_CURADORIA acumula aqui, contado por frequência.
 * Sem isto, ninguém sabe O QUE corrigir — o endpoint /engine/corrigir existia,
 * mas não havia fila alimentando-o. Prioriza por impacto: "QUEIJO PROVOLONE"
 * visto 500x/dia vale mais corrigir do que um item visto 1x.
 */
@Entity('curadoria_itens')
@Index(['confianca', 'ocorrencias'])
export class CuradoriaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Chave de deduplicação — mesma normalização usada na KB
  @Column({ type: 'varchar', length: 255, unique: true })
  descricao_normalizada: string;

  // Última descrição bruta vista (para o curador ler algo legível)
  @Column({ type: 'varchar', length: 255 })
  descricao_exemplo: string;

  // O que a Engine propôs (pode estar certo ou errado — é o que será
  // pré-preenchido na tela de curadoria para agilizar a correção)
  @Column({ type: 'varchar', length: 255 })
  produto_proposto: string;

  @Column({ type: 'varchar', length: 20 })
  estagio: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confianca: number;

  // Quantas vezes este item apareceu com baixa confiança — a base da
  // priorização por frequência
  @Column({ type: 'integer', default: 1 })
  ocorrencias: number;

  // Resolvido = já foi corrigido (via /engine/corrigir) e sai da fila ativa
  @Column({ type: 'boolean', default: false })
  resolvido: boolean;

  @CreateDateColumn()
  criado_em: Date;

  @UpdateDateColumn()
  atualizado_em: Date;
}
