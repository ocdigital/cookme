import api from './api';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;  // alias — backend retorna como 'lido'
  lido: boolean;
  icone?: string;
  criado_em: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificacoesService = {
  /**
   * Lista todas as notificações do usuário
   */
  getAll: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Notificacao>> => {
    const response = await api.get<PaginatedResponse<Notificacao>>(
      '/notificacoes',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  /**
   * Obtém a contagem de notificações não lidas
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ unreadCount: number }>(
      '/notificacoes/unread-count'
    );
    return response.data.unreadCount;
  },

  /**
   * Marca uma notificação como lida
   */
  markAsRead: async (id: string): Promise<Notificacao> => {
    const response = await api.patch<Notificacao>(
      `/notificacoes/${id}/lido`
    );
    return response.data;
  },

  /**
   * Marca todas as notificações como lidas
   */
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notificacoes/marcar-todas/lido');
  },

  /**
   * Deleta uma notificação
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notificacoes/${id}`);
  },

  // ===== HELPER FUNCTIONS =====

  /**
   * Obtém o ícone apropriado para o tipo de notificação
   */
  getNotificationIcon: (tipo: NotificationType) => {
    const icons: Record<NotificationType, any> = {
      info: Info,
      success: CheckCircle,
      warning: AlertCircle,
      error: AlertCircle,
    };
    return icons[tipo] || Bell;
  },

  /**
   * Obtém a cor/estilo apropriado para o tipo de notificação
   */
  getNotificationColor: (tipo: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      info: 'bg-blue-50 text-blue-800 border-blue-200',
      success: 'bg-green-50 text-green-800 border-green-200',
      warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      error: 'bg-red-50 text-red-800 border-red-200',
    };
    return colors[tipo] || 'bg-gray-50 text-gray-800 border-gray-200';
  },

  /**
   * Obtém a cor de fundo do ícone
   */
  getNotificationIconBg: (tipo: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      info: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-yellow-100 text-yellow-600',
      error: 'bg-red-100 text-red-600',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-600';
  },

  /**
   * Formata timestamp relativo (ex: "há 2 horas")
   */
  formatRelativeTime: (date: string | Date): string => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    // Formato de data para notificações antigas
    return notificationDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  },
};

export default notificacoesService;
