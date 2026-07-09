import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Shadow eval (PLANO_PRECISAO_ENGINE.md §11 A8): o golden set é curado por nós
 * a partir dos erros que já vimos — enviesado por construção, sempre vai bater
 * perto de 100%. Isto aqui é o número honesto: amostra ALEATÓRIA (não filtrada
 * por confiança) da própria KB — ou seja, do que o tráfego real já produziu —
 * rotulada às cegas por um humano depois. A acurácia dessa amostra é o que
 * pode ir no contrato B2B; o golden continua só como catraca de regressão.
 */
@Entity('shadow_eval_amostras')
@Index(['lote_semana'])
export class ShadowEvalAmostra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifica a rodada semanal (ex: "2026-W28") — agrupa a amostra pra cálculo de acurácia por lote
  @Column({ type: 'varchar', length: 10 })
  lote_semana: string;

  @Column({ type: 'varchar', length: 255 })
  descricao_original: string;

  // O que a Engine respondeu no momento da amostragem — congelado aqui para
  // não mudar debaixo do pé do rotulador se a KB for re-canonizada depois
  @Column({ type: 'varchar', length: 255 })
  produto_canonizado: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  origem_estagio: string | null;

  // Preenchido às cegas por um humano depois da amostragem — nunca antes
  @Column({ type: 'varchar', length: 255, nullable: true })
  rotulo_correto: string | null;

  @Column({ type: 'boolean', nullable: true })
  acertou: boolean | null;

  @CreateDateColumn()
  criado_em: Date;
}
