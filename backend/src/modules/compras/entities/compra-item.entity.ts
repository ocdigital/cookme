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

    // Nullable: itens OCR de não-alimentos não têm produto no catálogo
    @Column('uuid', { nullable: true })
    produto_id: string | null;

    // Nome exato como veio do OCR do cupom fiscal
    @Column({ nullable: true })
    nome_ocr: string;

    // Nome limpo para exibição (sem marca, sem unidade)
    @Column({ nullable: true })
    nome_display: string;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantidade: number;

    @Column({
        type: 'enum',
        enum: UnidadeMedida,
        default: UnidadeMedida.UN,
    })
    unidade: UnidadeMedida;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    preco_unitario: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    preco_total: number;

    // Classificação do item
    @Column({ nullable: true })
    eh_alimento: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    confianca: number;

    // Nome canonical do ingrediente (ex: "frango", não "Frango Sadia 1kg")
    @Column({ nullable: true })
    ingrediente_canonical: string;

    // EAN/código de barras do item como veio da nota (chave canônica p/ recompra)
    @Column({ type: 'varchar', length: 14, nullable: true })
    codigo_barras: string | null;

    // Indica se este item já foi adicionado ao inventário de ingredientes
    @Column({ default: false })
    adicionado_inventario: boolean;

    // Validade escaneada via OCR
    @Column({ type: 'date', nullable: true })
    validade_escaneada: Date;

    // Validade digitada manualmente
    @Column({ type: 'date', nullable: true })
    validade_manual: Date;

    // Validade final (prioriza manual > escaneada > estimada)
    @Column({ type: 'date', nullable: true })
    validade_final: Date | null;

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

    @ManyToOne(() => Produto, (produto) => produto.compra_itens, { nullable: true })
    @JoinColumn({ name: 'produto_id' })
    produto: Produto | null;
}
