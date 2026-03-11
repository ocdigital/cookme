import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { notificationsService } from '../services/notificationsService';

type Notification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
};

type NotificationsPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await notificationsService.deleteNotification(id);
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} não lida(s)</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="text-4xl mb-2">🔔</div>
          <p className="text-gray-500 text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <>
          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.map((notification) => {
              // const colors = notificationsService.getNotificationColor(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`text-xl flex-shrink-0 mt-0.5`}>
                      {notification.icon ||
                        notificationsService.getNotificationIcon(
                          notification.type,
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {notificationsService.formatRelativeTime(
                          notification.timestamp,
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Marcar como lida"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleMarkAllAsRead}
                className="w-full text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Marcar tudo como lido
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
