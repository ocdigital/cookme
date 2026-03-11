import { notificacoesService as apiService } from './notificacoesService';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
};

export const notificationsService = {
  /**
   * Get all notifications from API
   */
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiService.getAll(1, 20);
      return (response.data || []).map((notif) => ({
        id: notif.id,
        type: (notif.tipo as NotificationType) || 'info',
        title: notif.titulo,
        message: notif.mensagem,
        timestamp: new Date(notif.criado_em),
        read: notif.lida,
        icon: notif.icone,
      }));
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      return [];
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiService.getAll(1, 100);
      return (response.data || []).filter((n) => !n.lida).length;
    } catch (err) {
      console.error('Erro ao obter contagem de não lidas:', err);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiService.markAsRead(id);
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiService.markAllAsRead();
    } catch (err) {
      console.error('Erro ao marcar tudo como lido:', err);
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    try {
      await apiService.delete(id);
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
    }
  },

  /**
   * Get notification icon based on type
   */
  getNotificationIcon: (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[type];
  },

  /**
   * Get notification badge color based on type
   */
  getNotificationColor: (
    type: NotificationType,
  ): {
    bg: string;
    text: string;
    icon: string;
  } => {
    const colors: Record<
      NotificationType,
      { bg: string; text: string; icon: string }
    > = {
      success: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: '✅',
      },
      error: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: '❌',
      },
      warning: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        icon: '⚠️',
      },
      info: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: 'ℹ️',
      },
    };
    return colors[type];
  },

  /**
   * Format relative time (e.g., "5 minutes ago")
   */
  formatRelativeTime: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;

    return date.toLocaleDateString('pt-BR');
  },
};
