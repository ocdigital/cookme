import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'notificacoes',
})
export class NotificacaoGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificacaoGateway');
  private usuarioSockets = new Map<string, string[]>(); // usuarioId -> socketIds

  handleConnection(client: Socket) {
    const usuarioId = client.handshake.query.usuarioId as string;

    if (!usuarioId) {
      client.disconnect();
      return;
    }

    // Armazenar relação usuário <-> socket
    if (!this.usuarioSockets.has(usuarioId)) {
      this.usuarioSockets.set(usuarioId, []);
    }
    this.usuarioSockets.get(usuarioId)!.push(client.id);

    // Adicionar socket a sala do usuário para organização
    client.join(`usuario:${usuarioId}`);

    this.logger.log(`Cliente conectado: ${client.id} (usuário: ${usuarioId})`);
  }

  handleDisconnect(client: Socket) {
    const usuarioId = client.handshake.query.usuarioId as string;

    if (usuarioId) {
      const sockets = this.usuarioSockets.get(usuarioId);
      if (sockets) {
        const index = sockets.indexOf(client.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          this.usuarioSockets.delete(usuarioId);
        }
      }
    }

    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Emitir notificação para um usuário admin específico
   */
  enviarNotificacaoParaUsuario(
    usuarioId: string,
    notificacao: any,
  ) {
    this.server
      .to(`usuario:${usuarioId}`)
      .emit('nova-notificacao', notificacao);

    this.logger.log(`Notificação enviada para usuário: ${usuarioId}`);
  }

  /**
   * Emitir notificação para todos os admins (broadcast)
   */
  enviarNotificacaoParaTodos(notificacao: any) {
    this.server.emit('nova-notificacao', notificacao);
    this.logger.log('Notificação enviada para todos os clientes');
  }

  /**
   * Emitir para grupo específico (ex: moderadores)
   */
  enviarNotificacaoParaGrupo(grupo: string, notificacao: any) {
    this.server.to(grupo).emit('nova-notificacao', notificacao);
    this.logger.log(`Notificação enviada para grupo: ${grupo}`);
  }
}
