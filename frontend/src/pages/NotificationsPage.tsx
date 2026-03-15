import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Check, Loader, Filter, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { notificationService } from '../services/notificationService';
import { useNotificacoes } from '../hooks/useNotificacoes';
import type { NotificacaoTipo } from '../services/notificationService';

export const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificacaoTipo | 'todos'>('todos');
  const [readFilter, setReadFilter] = useState<'todos' | 'lidas' | 'nao-lidas'>('todos');

  // Obter usuarioId
  const usuarioId = localStorage.getItem('usuarioId') || null;

  // Hook WebSocket
  const { notifications, isConnected } = useNotificacoes(usuarioId);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // Fallback a cada 15s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Carregar apenas como fallback - o WebSocket já está atualizando em tempo real
      await notificationService.listar(false);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.marcarComoLida(id);
      await loadNotifications();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.marcarTodasComoLidas();
      await loadNotifications();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deletar(id);
      await loadNotifications();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    const typeMatch = typeFilter === 'todos' || notif.tipo === typeFilter;
    const readMatch =
      readFilter === 'todos' ||
      (readFilter === 'lidas' && notif.lido) ||
      (readFilter === 'nao-lidas' && !notif.lido);
    return typeMatch && readMatch;
  });

  const stats = {
    total: notifications.length,
    naoLidas: notifications.filter((n) => !n.lido).length,
    criticas: notifications.filter((n) => n.severidade === 'critica').length,
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

  const getTypeLabel = (tipo: NotificacaoTipo) => {
    const labels: Record<NotificacaoTipo, string> = {
      moderacao: '🛡️ Moderação',
      qualidade: '✨ Qualidade',
      usuarios: '👥 Usuários',
      sistema: '⚙️ Sistema',
    };
    return labels[tipo];
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <header className="-mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Notificações</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Wifi size={14} />
              Tempo real
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
              <WifiOff size={14} />
              Fallback
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500 opacity-50" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Não Lidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.naoLidas}</p>
            </div>
            <span className="text-2xl">🔔</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Críticas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.criticas}</p>
            </div>
            <span className="text-2xl">🔴</span>
          </CardContent>
        </Card>
      </section>

      {/* Filters & Actions */}
      <Card>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-600 dark:text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificacaoTipo | 'todos')}
              className="text-sm px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-0 focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos os tipos</option>
              <option value="moderacao">Moderação</option>
              <option value="qualidade">Qualidade</option>
              <option value="usuarios">Usuários</option>
              <option value="sistema">Sistema</option>
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as 'todos' | 'lidas' | 'nao-lidas')}
              className="text-sm px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-0 focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos</option>
              <option value="nao-lidas">Não lidas</option>
              <option value="lidas">Lidas</option>
            </select>
          </div>

          {stats.naoLidas > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Check size={14} />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma notificação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <Card key={notif.id} className={getSeverityColor(notif.severidade)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{getSeverityIcon(notif.severidade)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{notif.titulo}</h3>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {getTypeLabel(notif.tipo)}
                        </span>
                      </div>
                      {!notif.lido && (
                        <span className="flex-shrink-0 inline-block w-2 h-2 rounded-full bg-red-500 mt-2"></span>
                      )}
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{notif.mensagem}</p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600/50">
                      <div className="flex items-center gap-3">
                        {notif.acao_rota && (
                          <a
                            href={notif.acao_rota}
                            className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            {notif.acao_label || 'Ver detalhes'}
                          </a>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(notif.criado_em).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {!notif.lido && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors"
                            title="Marcar como lido"
                          >
                            <Check size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
