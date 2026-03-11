import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from './entities/notificacao.entity';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';

@Injectable()
export class NotificacoesService {
  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
  ) {}

  async create(
    usuarioId: string,
    createNotificacaoDto: CreateNotificacaoDto,
  ): Promise<Notificacao> {
    const notificacao = this.notificacaoRepository.create({
      ...createNotificacaoDto,
      usuario_id: usuarioId,
    });
    return this.notificacaoRepository.save(notificacao);
  }

  async findAll(usuarioId: string): Promise<Notificacao[]> {
    return this.notificacaoRepository.find({
      where: { usuario_id: usuarioId },
      order: { criado_em: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(usuarioId: string): Promise<number> {
    return this.notificacaoRepository.count({
      where: { usuario_id: usuarioId, lida: false },
    });
  }

  async markAsRead(id: string, usuarioId: string): Promise<Notificacao> {
    const notificacao = await this.notificacaoRepository.findOne({
      where: { id, usuario_id: usuarioId },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    notificacao.lida = true;
    return this.notificacaoRepository.save(notificacao);
  }

  async markAllAsRead(usuarioId: string): Promise<void> {
    await this.notificacaoRepository.update(
      { usuario_id: usuarioId, lida: false },
      { lida: true },
    );
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const notificacao = await this.notificacaoRepository.findOne({
      where: { id, usuario_id: usuarioId },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    await this.notificacaoRepository.remove(notificacao);
  }
}
