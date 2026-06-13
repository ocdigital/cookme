import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
    Index,
    CreateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export enum TipoPreferencia {
    INGREDIENTE_FAVORITO = 'ingrediente_favorito',
    INGREDIENTE_AVERSAO = 'ingrediente_aversao',
    CATEGORIA_FAVORITA = 'categoria_favorita',
    CATEGORIA_AVERSAO = 'categoria_aversao',
}

@Entity('preferencias_aprendidas')
@Index(['usuario_id', 'tipo', 'valor'], { unique: true })
export class PreferenciaAprendida {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    usuario_id: string;

    @Column({ type: 'enum', enum: TipoPreferencia })
    tipo: TipoPreferencia;

    @Column()
    valor: string;

    // 0.0 a 1.0 — quanto mais forte o sinal, mais alto o score
    @Column({ type: 'float', default: 0 })
    score: number;

    // Quantas vezes esse sinal foi reforçado
    @Column({ type: 'int', default: 1 })
    contagem: number;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;
}
