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

    // Lista normalizada de ingredientes para busca rápida (lowercase, sem acento)
    @Column('text', { array: true, nullable: true })
    @Index()
    ingredientes_chave: string[];

    // Lista de EXIBIÇÃO dos ingredientes (texto original da IA, com quantidade/unidade).
    // Fonte de verdade da seção "Ingredientes" na tela, sem exigir match com produto_id.
    // ingredientes_chave = derivada (para busca); ingredientes_texto = para o usuário ler.
    @Column('text', { array: true, nullable: true })
    ingredientes_texto: string[] | null;

    // Origem (catalogo, ia_gerada, usuario, internet)
    @Column({ default: 'catalogo' })
    origem: string;

    // URL da fonte original (sites brasileiros de receitas)
    @Column({ type: 'varchar', nullable: true })
    url_fonte: string | null;

    // Se foi gerada por IA, guardar prompt usado
    @Column({ type: 'text', nullable: true })
    prompt_ia: string;

    // Avaliação média (calculado)
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    avaliacao_media: number;

    // Número de vezes que foi feita (calculado)
    @Column({ type: 'int', default: 0 })
    vezes_executada: number;

    // Inteligência regional
    @Column({ nullable: true })
    regiao_origem: string; // norte, nordeste, centro_oeste, sudeste, sul, nacional

    // Dias da semana tradicionais (ex: ["sexta","sabado"] para feijoada)
    @Column('simple-array', { nullable: true })
    dias_semana_tradicionais: string[];

    // Período sazonal (ex: "festas_juninas", "quaresma", "natal")
    @Column({ nullable: true })
    periodo_sazonal: string;

    // Moderação
    @Column({ type: 'int', default: 0 })
    denuncias: number;

    @Column({
        type: 'enum',
        enum: ['ok', 'em_revisao', 'arquivado'],
        default: 'ok'
    })
    status_moderacao: 'ok' | 'em_revisao' | 'arquivado';

    // Validação automática (Mestre Cuca)
    @Column({ type: 'int', nullable: true })
    validation_score: number | null;

    @Column({ type: 'text', nullable: true })
    validation_issues: string | null;

    // Comunidade — autor (usuário que publicou a receita)
    @Column('uuid', { nullable: true })
    autor_id: string | null;

    // Foto sugerida pela comunidade, aguardando moderação
    @Column({ type: 'varchar', nullable: true })
    foto_pendente_url: string | null;

    @Column('uuid', { nullable: true })
    foto_pendente_autor_id: string | null;

    @Column({ type: 'text', nullable: true })
    foto_pendente_motivo_rejeicao: string | null;

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