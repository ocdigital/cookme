import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { Receita } from './receita.entity';
import { Produto } from '../../produtos/entities/produto.entity';

@Entity('receita_ingredientes')
export class ReceitaIngrediente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    receita_id: string;

    @Column('uuid', { nullable: true })
    produto_id: string;

    // Quantidade null quando a_gosto = true
    @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
    quantidade: number;

    @Column({
        type: 'enum',
        enum: UnidadeMedida,
        nullable: true,
    })
    unidade: UnidadeMedida;

    // Usado "a gosto" — sem quantidade exata (sal, pimenta, azeite de finalização)
    @Column({ default: false })
    a_gosto: boolean;

    // Se é opcional (cheiro-verde, coentro — pode omitir sem quebrar a receita)
    @Column({ default: false })
    opcional: boolean;

    // Texto original da IA: "2 ovos", "500g de farinha", "sal a gosto"
    @Column({ nullable: true })
    observacao: string;

    // Ordem de uso no preparo
    @Column({ type: 'int', default: 0 })
    ordem: number;

    // Relacionamentos
    @ManyToOne(() => Receita, (receita) => receita.ingredientes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'receita_id' })
    receita: Receita;

    @ManyToOne(() => Produto)
    @JoinColumn({ name: 'produto_id' })
    produto: Produto;
}