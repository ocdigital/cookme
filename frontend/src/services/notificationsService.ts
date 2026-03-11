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

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Novo produto adicionado',
    message: 'O produto "Açúcar Refinado União 1kg" foi adicionado ao catálogo',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    read: false,
    icon: '📦',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Estoque baixo',
    message: 'O produto "Sal Marinho" está com estoque abaixo do limite recomendado',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    read: false,
    icon: '⚠️',
  },
  {
    id: '3',
    type: 'info',
    title: 'Novo usuário registrado',
    message: 'Um novo usuário se registrou na plataforma',
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    read: true,
    icon: '👤',
  },
  {
    id: '4',
    type: 'success',
    title: 'Relatório gerado',
    message: 'Seu relatório mensal de vendas está pronto para download',
    timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
    read: true,
    icon: '📊',
  },
  {
    id: '5',
    type: 'error',
    title: 'Erro na sincronização',
    message: 'Falha ao sincronizar dados com o servidor',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000), // 3 days ago
    read: true,
    icon: '❌',
  },
];

export const notificationsService = {
  /**
   * Get all notifications (mock)
   */
  getNotifications: async (): Promise<Notification[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_NOTIFICATIONS;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const notification = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    MOCK_NOTIFICATIONS.forEach((n) => {
      n.read = true;
    });
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = MOCK_NOTIFICATIONS.findIndex((n) => n.id === id);
    if (index > -1) {
      MOCK_NOTIFICATIONS.splice(index, 1);
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
