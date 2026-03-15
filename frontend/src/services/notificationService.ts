import api from './api';

export type NotificacaoTipo = 'moderacao' | 'qualidade' | 'usuarios' | 'sistema';
export type NotificacaoSeveridade = 'critica' | 'alta' | 'media' | 'baixa';

export interface Notificacao {
  id: string;
  tipo: NotificacaoTipo;
  severidade: NotificacaoSeveridade;
  titulo: string;
  mensagem: string;
  dados?: Record<string, any>;
  acao_label?: string;
  acao_rota?: string;
  acao_id?: string;
  lido: boolean;
  criado_em: Date;
  lido_em?: Date;
}

export const notificationService = {
  listar: async (naoLidas = false): Promise<Notificacao[]> => {
    const params = new URLSearchParams();
    if (naoLidas) {
      params.append('naoLidas', 'true');
    }
    const response = await api.get(`/notificacoes?${params.toString()}`);
    return response.data;
  },

  contarNaoLidas: async (): Promise<number> => {
    const response = await api.get('/notificacoes/nao-lidas/count');
    return response.data.naoLidas;
  },

  marcarComoLida: async (id: string): Promise<void> => {
    await api.patch(`/notificacoes/${id}/lido`);
  },

  marcarTodasComoLidas: async (): Promise<void> => {
    await api.patch('/notificacoes/marcar-todas/lido');
  },

  deletar: async (id: string): Promise<void> => {
    await api.delete(`/notificacoes/${id}`);
  },
};
