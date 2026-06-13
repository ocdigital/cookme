import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notificacao } from '../services/notificationService';

// Socket.IO não usa prefixo /api — extrai só o origin
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api$/, '');

export const useNotificacoes = (usuarioId: string | null) => {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!usuarioId) return;

    // Conectar ao WebSocket
    const socket = io(`${API_URL}/notificacoes`, {
      query: { usuarioId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    });

    socket.on('nova-notificacao', (notificacao: Notificacao) => {
      console.log('Notificação recebida:', notificacao);
      setNotifications((prev) => [notificacao, ...prev]);
    });

    socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [usuarioId]);

  const addNotification = (notification: Notificacao) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    addNotification,
    removeNotification,
    clearAll,
  };
};
