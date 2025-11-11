import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { Compra } from './compra.entity';
import { Produto } from '../../produtos/entities/produto.entity';

@Entity('compra_itens')
export class CompraItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    compra_id: string;

    @Column('uuid')
    produto_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantidade: number;

    @Column({
        type: 'enum',
        enum: UnidadeMedida,
    })
    unidade: UnidadeMedida;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    preco_unitario: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    preco_total: number;

    // Validade escaneada via OCR
    @Column({ type: 'date', nullable: true })
    validade_escaneada: Date;

    // Validade digitada manualmente
    @Column({ type: 'date', nullable: true })
    validade_manual: Date;

    // Validade final (prioriza manual > escaneada > estimada)
    @Column({ type: 'date', nullable: true })
    validade_final: Date | null;

    // Lote (rastreabilidade)
    @Column({ nullable: true })
    lote: string;

    @CreateDateColumn()
    criado_em: Date;

    // Relacionamentos
    @ManyToOne(() => Compra, (compra) => compra.itens, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'compra_id' })
    compra: Compra;

    @ManyToOne(() => Produto, (produto) => produto.compra_itens)
    @JoinColumn({ name: 'produto_id' })
    produto: Produto;
}