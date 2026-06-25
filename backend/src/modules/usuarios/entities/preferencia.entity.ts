import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('preferencias')
export class Preferencia {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    usuario_id: string;

    // Tags de dieta (vegetariano, vegano, sem-gluten, etc)
    @Column('simple-array', { nullable: true })
    tags_dieta: string[];

    // Tags de preparo (rapido, facil, pouco-ingrediente, etc)
    @Column('simple-array', { nullable: true })
    tags_preparo: string[];

    // Ingredientes que NÃO gosta
    @Column('simple-array', { nullable: true })
    ingredientes_evitar: string[];

    // Alergias/Restrições
    @Column('simple-array', { nullable: true })
    restricoes: string[];

    // Preferências de complexidade
    @Column({ default: false })
    apenas_receitas_faceis: boolean;

    // Tempo máximo de preparo (em minutos)
    @Column({ type: 'int', nullable: true })
    tempo_maximo_preparo: number;

    // Número de pessoas no domicílio (para ajustar porções)
    @Column({ type: 'int', default: 1 })
    numero_pessoas: number;

    // Estado do usuário (para inteligência regional)
    @Column({ nullable: true })
    estado: string; // ex: "SP", "BA", "RS"

    // Região culinária derivada do estado
    @Column({ nullable: true })
    regiao_culinaria: string; // norte, nordeste, centro_oeste, sudeste, sul

    // Modo alimentar — define filtro/ordenação de receitas
    @Column({ nullable: true, default: 'normal' })
    modo_alimentar: 'normal' | 'fitness' | 'vegetariano' | 'vegano';

    // Refeições que deseja planejar
    @Column({
      type: 'enum',
      enum: ['almoco_jantar', 'almoco', 'jantar'],
      default: 'almoco_jantar',
    })
    refeicoes_planejamento: 'almoco_jantar' | 'almoco' | 'jantar';

    // LGPD: registro de consentimento explícito para dados de saúde (restricoes, tags_dieta)
    @Column({ type: 'timestamp', nullable: true })
    consentimento_dados_saude_em: Date | null;

    @CreateDateColumn()
    criado_em: Date;

    @UpdateDateColumn()
    atualizado_em: Date;

    // Relacionamento
    @OneToOne(() => Usuario, (usuario) => usuario.preferencias, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;
}