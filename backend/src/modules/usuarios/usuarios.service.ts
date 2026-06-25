import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { Preferencia } from './entities/preferencia.entity';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePreferenciaDto } from './dto/update-preferencia.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UserRole } from '@common/enums/user-role.enum';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Preferencia)
    private readonly preferenciaRepository: Repository<Preferencia>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Busca usuário por ID
   */
  async findById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['preferencias'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  /**
   * Cria novo usuário (admin)
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Verifica se email já existe
    const usuarioExistente = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);

    // Cria novo usuário
    const usuario = this.usuarioRepository.create({
      email: createUsuarioDto.email,
      nome: createUsuarioDto.nome,
      senha: hashedPassword,
      role: createUsuarioDto.role || UserRole.USER,
      avatar_url: createUsuarioDto.avatar_url,
      email_verificado: false,
      alertas_habilitados: true,
    });

    return this.usuarioRepository.save(usuario);
  }

  /**
   * Atualiza dados do usuário
   */
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findById(id);

    Object.assign(usuario, updateUsuarioDto);

    return this.usuarioRepository.save(usuario);
  }

  // LGPD Art. 18 — direito ao esquecimento
  // Cascata via FK: compras, inventario, listas, preferencias, receitas_executadas, etc.
  // audit_logs sem FK: anonimiza (mantém estatísticas, remove dados pessoais)
  async remove(id: string): Promise<void> {
    const usuario = await this.findById(id);
    // Anonimiza audit_logs antes de deletar (sem FK, sem cascata automática)
    await this.dataSource.query(
      `UPDATE audit_logs SET user_id = NULL, user_email = '[removido]', ip_address = NULL, user_agent = NULL, request_body = NULL WHERE user_id = $1`,
      [id],
    );
    await this.usuarioRepository.remove(usuario);
  }

  async delete(id: string): Promise<void> {
    return this.remove(id);
  }

  /**
   * Busca ou cria preferências do usuário
   */
  async getPreferencias(usuarioId: string): Promise<Preferencia> {
    const usuario = await this.findById(usuarioId);

    let preferencias = await this.preferenciaRepository.findOne({
      where: { usuario: { id: usuarioId } },
    });

    // Se não existir, cria uma preferência padrão
    if (!preferencias) {
      preferencias = this.preferenciaRepository.create({
        usuario,
        tags_dieta: [],
        tags_preparo: [],
        ingredientes_evitar: [],
        restricoes: [],
        numero_pessoas: 1,
      });
      await this.preferenciaRepository.save(preferencias);
    }

    return preferencias;
  }

  /**
   * Atualiza preferências do usuário
   */
  async updatePreferencias(
    usuarioId: string,
    updatePreferenciaDto: UpdatePreferenciaDto,
  ): Promise<Preferencia> {
    let preferencias = await this.preferenciaRepository.findOne({
      where: { usuario: { id: usuarioId } },
    });

    if (!preferencias) {
      // Cria preferências se não existirem
      const usuario = await this.findById(usuarioId);
      preferencias = this.preferenciaRepository.create({
        usuario,
        ...updatePreferenciaDto,
      });
    } else {
      // Atualiza preferências existentes
      Object.assign(preferencias, updatePreferenciaDto);
    }

    return this.preferenciaRepository.save(preferencias);
  }

  async savePushToken(usuarioId: string, token: string): Promise<void> {
    await this.usuarioRepository.update(usuarioId, { push_token: token });
  }
}
