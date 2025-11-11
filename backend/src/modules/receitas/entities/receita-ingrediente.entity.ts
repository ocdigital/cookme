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

    @Column('uuid')
    produto_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantidade: number;

    @Column({
        type: 'enum',
        enum: UnidadeMedida,
    })
    unidade: UnidadeMedida;

    // Se é opcional
    @Column({ default: false })
    opcional: boolean;

    // Observação (ex: "picado", "ralado", "em cubos")
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