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
import { ProductType } from '@common/enums/product-type.enum';
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

    // Nome limpo para exibição em receitas e no app (ex: "Leite de Coco", "Alho")
    @Column({ nullable: true })
    nome_display: string;

    @Column({
        type: 'enum',
        enum: ProductType,
        default: ProductType.ALIMENTO,
    })
    tipo: ProductType;

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

    // Flag: pode ser usado como ingrediente em receitas
    @Column({ default: false })
    ingrediente_receita: boolean;

    // Classificação IA: confiança da classificação (0-100)
    @Column({ type: 'int', nullable: true, default: null })
    confianca_classificacao: number;

    // Precisa validação manual?
    @Column({ default: false })
    requer_validacao_manual: boolean;

    // ─── Inteligência culinária ────────────────────────────────────────────────

    // ─── Inteligência culinária (adicionado via migration) ────────────────────
    // Sempre usado "a gosto" — nunca gerar com quantidade exata (ex: sal, pimenta)
    @Column({ default: false })
    sempre_a_gosto: boolean;

    // Pode ser omitido sem quebrar a receita (ex: cheiro-verde, coentro, louro)
    @Column({ default: false })
    opcional_por_natureza: boolean;

    // Se false, receita pode ser sugerida mesmo sem este item no inventário
    @Column({ default: true })
    bloqueia_receita_se_ausente: boolean;

    // Categoria culinária (ex: proteina_animal, aromatico_base, especiaria)
    @Column({ nullable: true })
    categoria_culinaria: string;

    // Região de origem (nordeste, norte, sul, sudeste, centro_oeste)
    @Column({ nullable: true })
    regional: string;

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