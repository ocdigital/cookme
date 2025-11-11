import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '@common/enums/user-role.enum';
import { Preferencia } from './preferencia.entity';
import { Compra } from '../../compras/entities/compra.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { ReceitaExecutada } from '../../receitas/entities/receita-executada.entity';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    email: string;

    @Column()
    @Exclude() // Nunca retorna a senha nas responses
    senha: string;

    @Column()
    nome: string;

    @Column({ nullable: true })
    telefone: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: true })
    alertas_habilitados: boolean;

    @Column({ type: 'time', nullable: true })
    horario_alertas: string; // Ex: "08:00:00"

    @Column({ nullable: true })
    avatar_url: string;

    @Column({ default: false })
    email_verificado: boolean;

    @Column({ nullable: true, type: 'text' })
    @Exclude()
    refresh_token: string | null;

    @Column({ type: 'timestamp', nullable: true })
    ultimo_acesso: Date;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    // Relacionamentos
    @OneToOne(() => Preferencia, (preferencia) => preferencia.usuario, {
        cascade: true,
    })
    preferencias: Preferencia;

    @OneToMany(() => Compra, (compra) => compra.usuario)
    compras: Compra[];

    @OneToMany(() => Inventario, (inventario) => inventario.usuario)
    inventario: Inventario[];

    @OneToMany(() => ReceitaExecutada, (executada) => executada.usuario)
    receitas_executadas: ReceitaExecutada[];
}
