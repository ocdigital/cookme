import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { CompraItem } from './compra-item.entity';

@Entity('compras')
export class Compra {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    usuario_id: string;

    @Column({ type: 'date' })
    data_compra: Date;

    @Column({ nullable: true })
    local_compra: string; // Nome do supermercado

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    valor_total: number;

    @Column({
        type: 'enum',
        enum: MetodoCadastro,
        default: MetodoCadastro.MANUAL,
    })
    metodo_cadastro: MetodoCadastro;

    // URL da nota fiscal (se OCR)
    @Column({ nullable: true })
    nota_fiscal_url: string;

    // Tempo que levou para cadastrar (analytics UX)
    @Column({ type: 'int', nullable: true })
    tempo_cadastro_segundos: number;

    // Metadados extras (JSON)
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    // Relacionamentos
    @ManyToOne(() => Usuario, (usuario) => usuario.compras, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;

    @OneToMany(() => CompraItem, (item) => item.compra, { cascade: true })
    itens: CompraItem[];
}