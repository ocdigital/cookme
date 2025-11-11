import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { Marca } from './marca.entity';
import { Categoria } from './categoria.entity';
import { CompraItem } from '../../compras/entities/compra-item.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { ReceitaIngrediente } from '../../receitas/entities/receita-ingrediente.entity';

@Entity('produtos')
export class Produto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nome: string;

    @Column({ nullable: true })
    descricao: string;

    // Código de barras (EAN-13, UPC, etc)
    @Column({ nullable: true, unique: true })
    @Index()
    codigo_barras: string;

    // Código interno (se houver)
    @Column({ nullable: true })
    codigo_interno: string;

    @Column('uuid', { nullable: true })
    marca_id: string;

    @Column('uuid', { nullable: true })
    categoria_id: string;

    // Unidade padrão
    @Column({
        type: 'enum',
        enum: UnidadeMedida,
        default: UnidadeMedida.UN,
    })
    unidade_padrao: UnidadeMedida;

    // Validade média em dias (para estimativa)
    @Column({ type: 'int', nullable: true })
    validade_media_dias: number;

    // Imagem do produto
    @Column({ nullable: true })
    imagem_url: string;

    // Informações nutricionais (JSON)
    @Column({ type: 'jsonb', nullable: true })
    informacoes_nutricionais: {
        calorias?: number;
        proteinas?: number;
        carboidratos?: number;
        gorduras?: number;
        fibras?: number;
        sodio?: number;
        acucares?: number;
    };

    // Tags (vegano, sem-gluten, organico, etc)
    @Column('simple-array', { nullable: true })
    tags: string[];

    // IDs de produtos alternativos (para substituição)
    @Column('simple-array', { nullable: true })
    alternativas_ids: string[];

    // Origem do cadastro
    @Column({ default: 'manual' })
    origem: string; // manual, api_externa, usuario, marca

    // Verificado (curadoria)
    @Column({ default: false })
    verificado: boolean;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    // Relacionamentos
    @ManyToOne(() => Marca, (marca) => marca.produtos, { nullable: true })
    @JoinColumn({ name: 'marca_id' })
    marca: Marca;

    @ManyToOne(() => Categoria, (categoria) => categoria.produtos, {
        nullable: true,
    })
    @JoinColumn({ name: 'categoria_id' })
    categoria: Categoria;

    @OneToMany(() => CompraItem, (item) => item.produto)
    compra_itens: CompraItem[];

    @OneToMany(() => Inventario, (inventario) => inventario.produto)
    inventario: Inventario[];

    @OneToMany(() => ReceitaIngrediente, (ingrediente) => ingrediente.produto)
    receita_ingredientes: ReceitaIngrediente[];
}