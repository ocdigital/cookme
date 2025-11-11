import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Produto } from './produto.entity';

@Entity('marcas')
export class Marca {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    nome: string;

    @Column({ nullable: true })
    logo_url: string;

    @Column({ nullable: true })
    site: string;

    // Para sistema de patrocínio (futuro)
    @Column({ default: false })
    parceiro_patrocinio: boolean;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    // Relacionamentos
    @OneToMany(() => Produto, (produto) => produto.marca)
    produtos: Produto[];
}