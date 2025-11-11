import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Produto } from '../../produtos/entities/produto.entity';

@Entity('inventario')
@Unique(['usuario_id', 'produto_id', 'data_validade']) // Evita duplicatas
export class Inventario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    usuario_id: string;

    @Column('uuid')
    @Index()
    produto_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantidade_disponivel: number;

    @Column({
        type: 'enum',
        enum: UnidadeMedida,
    })
    unidade: UnidadeMedida;

    @Column({ type: 'date', nullable: true })
    @Index() // Importante para queries de vencimento
    data_validade: Date;

    // Rastreabilidade: de qual compra veio
    @Column('uuid', { nullable: true })
    compra_item_id: string;

    // Método de entrada no estoque
    @Column({
        type: 'enum',
        enum: MetodoCadastro,
        default: MetodoCadastro.MANUAL,
    })
    metodo_atualizacao: MetodoCadastro;

    // Localização no estoque (geladeira, despensa, freezer)
    @Column({ nullable: true })
    localizacao: string;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    ultima_atualizacao: Date;

    // Relacionamentos
    @ManyToOne(() => Usuario, (usuario) => usuario.inventario, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;

    @ManyToOne(() => Produto, (produto) => produto.inventario)
    @JoinColumn({ name: 'produto_id' })
    produto: Produto;
}