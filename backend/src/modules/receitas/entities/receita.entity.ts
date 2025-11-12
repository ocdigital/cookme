import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { DificuldadeReceita } from '@common/enums/dificuldade-receita.enum';
import { ReceitaIngrediente } from './receita-ingrediente.entity';
import { ReceitaExecutada } from './receita-executada.entity';
import { AffiliateLink } from '../../affiliate/entities/affiliate-link.entity';

@Entity('receitas')
export class Receita {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    nome: string;

    @Column({ type: 'text', nullable: true })
    descricao: string;

    @Column({ type: 'text' })
    modo_preparo: string;

    // Tempo de preparo em minutos
    @Column({ type: 'int', nullable: true })
    tempo_preparo: number;

    // Rendimento (número de porções)
    @Column({ type: 'int', default: 1 })
    rendimento_porcoes: number;

    @Column({
        type: 'enum',
        enum: DificuldadeReceita,
        default: DificuldadeReceita.MEDIA,
    })
    dificuldade: DificuldadeReceita;

    // Tags de dieta (vegetariano, vegano, low-carb, etc)
    @Column('simple-array', { nullable: true })
    @Index()
    tags_dieta: string[];

    // Tags de preparo (rapido, facil, festa, etc)
    @Column('simple-array', { nullable: true })
    tags_preparo: string[];

    // Categoria da receita (cafe-da-manha, almoco, jantar, sobremesa)
    @Column({ nullable: true })
    categoria_receita: string;

    // Imagem da receita
    @Column({ nullable: true })
    imagem_url: string;

    // Informações nutricionais totais
    @Column({ type: 'jsonb', nullable: true })
    informacoes_nutricionais: {
        calorias?: number;
        proteinas?: number;
        carboidratos?: number;
        gorduras?: number;
    };

    // Origem (catalogo, ia_gerada, usuario)
    @Column({ default: 'catalogo' })
    origem: string;

    // Se foi gerada por IA, guardar prompt usado
    @Column({ type: 'text', nullable: true })
    prompt_ia: string;

    // Avaliação média (calculado)
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    avaliacao_media: number;

    // Número de vezes que foi feita (calculado)
    @Column({ type: 'int', default: 0 })
    vezes_executada: number;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    // Relacionamentos
    @OneToMany(
        () => ReceitaIngrediente,
        (ingrediente) => ingrediente.receita,
        { cascade: true },
    )
    ingredientes: ReceitaIngrediente[];

    @OneToMany(() => ReceitaExecutada, (executada) => executada.receita)
    execucoes: ReceitaExecutada[];

    @OneToMany(() => AffiliateLink, (link) => link.receita)
    affiliate_links: AffiliateLink[];
}