import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificacaoUsuario } from '../entities/notificacao-usuario.entity';
import { NotificacaoGateway } from '../gateways/notificacao.gateway';

@Injectable()
export class NotificacaoUsuarioService {
  constructor(
    @InjectRepository(NotificacaoUsuario)
    private readonly repo: Repository<NotificacaoUsuario>,
    private readonly gateway: NotificacaoGateway,
  ) {}

  async enviar(dados: {
    usuario_id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    dados?: Record<string, any>;
  }): Promise<NotificacaoUsuario> {
    const notif = this.repo.create(dados);
    const saved = await this.repo.save(notif);
    // Entrega em tempo real se o usuário estiver conectado
    this.gateway.enviarNotificacaoParaUsuario(dados.usuario_id, saved);
    return saved;
  }

  async listar(usuarioId: string) {
    return this.repo.find({
      where: { usuario_id: usuarioId },
      order: { criado_em: 'DESC' },
      take: 50,
    });
  }

  async marcarLida(id: string, usuarioId: string) {
    await this.repo.update(
      { id, usuario_id: usuarioId },
      { lido: true, lido_em: new Date() },
    );
  }

  async marcarTodasLidas(usuarioId: string) {
    await this.repo.update(
      { usuario_id: usuarioId, lido: false },
      { lido: true, lido_em: new Date() },
    );
  }

  async contarNaoLidas(usuarioId: string): Promise<number> {
    return this.repo.count({ where: { usuario_id: usuarioId, lido: false } });
  }
}
