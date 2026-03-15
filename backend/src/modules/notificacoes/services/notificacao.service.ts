import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from '../entities/notificacao.entity';
import { NotificacaoGateway } from '../gateways/notificacao.gateway';

@Injectable()
export class NotificacaoService {
  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
    private readonly notificacaoGateway: NotificacaoGateway,
  ) {}

  async criar(dados: {
    tipo: string;
    severidade: string;
    titulo: string;
    mensagem: string;
    dados?: Record<string, any>;
    acao_label?: string;
    acao_rota?: string;
    acao_id?: string;
    usuario_admin_id: string;
  }): Promise<Notificacao> {
    const notificacao = this.notificacaoRepository.create(dados);
    const saved = await this.notificacaoRepository.save(notificacao);

    // Emitir via WebSocket em tempo real
    this.notificacaoGateway.enviarNotificacaoParaUsuario(
      dados.usuario_admin_id,
      saved,
    );

    return saved;
  }

  async listarPorAdmin(usuarioAdminId: string, naoLidas = false) {
    const query = this.notificacaoRepository
      .createQueryBuilder('notificacao')
      .where('notificacao.usuario_admin_id = :usuarioAdminId', { usuarioAdminId })
      .orderBy('notificacao.criado_em', 'DESC');

    if (naoLidas) {
      query.andWhere('notificacao.lido = false');
    }

    return query.getMany();
  }

  async contarNaoLidas(usuarioAdminId: string): Promise<number> {
    return this.notificacaoRepository.countBy({
      usuario_admin_id: usuarioAdminId,
      lido: false,
    });
  }

  async marcarComoLida(id: string): Promise<void> {
    await this.notificacaoRepository.update(id, {
      lido: true,
      lido_em: new Date(),
    });
  }

  async marcarTodasComoLidas(usuarioAdminId: string): Promise<void> {
    await this.notificacaoRepository.update(
      { usuario_admin_id: usuarioAdminId, lido: false },
      {
        lido: true,
        lido_em: new Date(),
      },
    );
  }

  async deletar(id: string): Promise<void> {
    await this.notificacaoRepository.delete(id);
  }
}
