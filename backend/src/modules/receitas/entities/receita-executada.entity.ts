import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Receita } from './receita.entity';

@Entity('receitas_executadas')
export class ReceitaExecutada {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    usuario_id: string;

    @Column('uuid')
    @Index()
    receita_id: string;

    @CreateDateColumn({ name: 'data_execucao' })
    data_execucao: Date;

    // Quantas porções fez (pode ser diferente do padrão da receita)
    @Column({ type: 'int', default: 1 })
    porcoes_feitas: number;

    // Tempo real que levou (vs. tempo estimado)
    @Column({ type: 'int', nullable: true })
    tempo_real_preparo: number;

    // Avaliação (1-5 estrelas)
    @Column({ type: 'int', nullable: true })
    avaliacao: number;

    // Comentário
    @Column({ type: 'text', nullable: true })
    comentario: string;

    // Se sobrou comida
    @Column({ default: false })
    sobras: boolean;

    // Foto do resultado (opcional)
    @Column({ nullable: true })
    foto_url: string;

    @CreateDateColumn()
    criado_em: Date;

    // Relacionamentos
    @ManyToOne(() => Usuario, (usuario) => usuario.receitas_executadas, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;

    @ManyToOne(() => Receita, (receita) => receita.execucoes)
    @JoinColumn({ name: 'receita_id' })
    receita: Receita;
}