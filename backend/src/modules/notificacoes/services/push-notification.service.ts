import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async enviarParaUsuario(
    usuarioId: string,
    titulo: string,
    corpo: string,
    dados?: Record<string, any>,
  ): Promise<void> {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario?.push_token) return;

    await this.enviar([{
      to: usuario.push_token,
      title: titulo,
      body: corpo,
      data: dados,
      sound: 'default',
      channelId: 'cookme',
    }]);
  }

  async enviarParaTodos(
    titulo: string,
    corpo: string,
    dados?: Record<string, any>,
  ): Promise<void> {
    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .where('u.push_token IS NOT NULL')
      .andWhere('u.alertas_habilitados = true')
      .select(['u.push_token'])
      .getMany();

    if (!usuarios.length) return;

    const mensagens: ExpoPushMessage[] = usuarios.map(u => ({
      to: u.push_token!,
      title: titulo,
      body: corpo,
      data: dados,
      sound: 'default' as const,
      channelId: 'cookme',
    }));

    // Expo aceita até 100 mensagens por request
    for (let i = 0; i < mensagens.length; i += 100) {
      await this.enviar(mensagens.slice(i, i + 100));
    }
  }

  private async enviar(mensagens: ExpoPushMessage[]): Promise<void> {
    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mensagens),
      });

      const result = await response.json();
      const tickets: ExpoPushTicket[] = result.data || [];

      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error') {
          this.logger.error(`Push falhou para ${mensagens[i]?.to}: ${ticket.message}`);
        }
      });
    } catch (err) {
      this.logger.error('Erro ao enviar push notification:', err);
    }
  }
}
