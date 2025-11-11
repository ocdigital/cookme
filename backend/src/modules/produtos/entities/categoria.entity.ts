import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Produto } from './produto.entity';

@Entity('categorias')
export class Categoria {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nome: string;

    @Column({ nullable: true })
    descricao: string;

    @Column({ nullable: true })
    icone: string; // Nome do ícone (ex: "apple", "meat", "dairy")

    @Column({ default: false })
    is_food: boolean; // Flag para identificar categorias de alimentos

    // Categoria pai (para subcategorias)
    @Column('uuid', { nullable: true })
    categoria_pai_id: string;

    @CreateDateColumn()
    criado_em: Date;

    // Relacionamentos
    @ManyToOne(() => Categoria, (categoria) => categoria.subcategorias, {
        nullable: true,
    })
    @JoinColumn({ name: 'categoria_pai_id' })
    categoria_pai: Categoria;

    @OneToMany(() => Categoria, (categoria) => categoria.categoria_pai)
    subcategorias: Categoria[];

    @OneToMany(() => Produto, (produto) => produto.categoria)
    produtos: Produto[];
}