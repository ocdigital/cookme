import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from './NotificationsPopover';
import { notificationsService } from '../services/notificationsService';
import { useNotificacoes } from '../hooks/useNotificacoes';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const usuarioId = localStorage.getItem('usuarioId') || '00000000-0000-0000-0000-000000000000';
  const { notifications: wsNotifications } = useNotificacoes(usuarioId);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Incrementa badge direto quando WS entrega nova notificação
  useEffect(() => {
    if (wsNotifications.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [wsNotifications.length]);

  const loadUnreadCount = async () => {
    const count = await notificationsService.getUnreadCount();
    setUnreadCount(count);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
      <div className="px-4 sm:px-5 lg:px-6 py-1.5 flex items-center justify-end">
        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 relative">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationsToggle}
              className="relative p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsPopover
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              onUnreadCountChange={(count) => setUnreadCount(count)}
            />
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* User Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.nome || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'ADMIN' ? 'Admin' : 'Usuário'}</p>
            </div>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-7 h-7 rounded-full shadow-sm hover:shadow-md transition-shadow object-cover"
              />
            ) : (
              <img
                src={`https://i.pravatar.cc/40?u=${user?.email}`}
                alt="Avatar"
                className="w-7 h-7 rounded-full shadow-sm hover:shadow-md transition-shadow object-cover"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
