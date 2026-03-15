import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, Wifi, WifiOff } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useNotificacoes } from '../hooks/useNotificacoes';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obter usuarioId (assumindo que você tem auth context ou similar)
  const usuarioId = localStorage.getItem('usuarioId') || null;

  // Hook WebSocket
  const { notifications, isConnected } = useNotificacoes(usuarioId);

  useEffect(() => {
    loadNotifications();
    // Fallback: ainda fazer polling a cada 30 segundos caso WebSocket falhe
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const count = await notificationService.contarNaoLidas();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.marcarComoLida(id);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.marcarTodasComoLidas();
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deletar(id);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const getSeverityColor = (severidade: string) => {
    switch (severidade) {
      case 'critica':
        return 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500';
      case 'alta':
        return 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500';
      case 'media':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500';
    }
  };

  const getSeverityIcon = (severidade: string) => {
    switch (severidade) {
      case 'critica':
        return '🔴';
      case 'alta':
        return '🟠';
      case 'media':
        return '🟡';
      default:
        return '🔵';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
              {isConnected ? (
                <Wifi size={14} className="text-green-500" />
              ) : (
                <WifiOff size={14} className="text-yellow-500" />
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Marcar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    getSeverityColor(notif.severidade)
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-1">{getSeverityIcon(notif.severidade)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {notif.titulo}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        {notif.mensagem}
                      </p>
                      {notif.acao_rota && (
                        <a
                          href={notif.acao_rota}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 mt-2 inline-block"
                        >
                          {notif.acao_label || 'Ver detalhes'} →
                        </a>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(notif.criado_em).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {!notif.lido && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors"
                          title="Marcar como lido"
                        >
                          <Check size={14} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={14} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <a
                href="/admin/notificacoes"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
              >
                Ver todas as notificações →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
