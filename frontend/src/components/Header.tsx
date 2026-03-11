import React, { useState, useEffect } from 'react';
import { Bell, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from './NotificationsPopover';
import { SettingsPopover } from './SettingsPopover';
import { notificationsService } from '../services/notificationsService';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    const count = await notificationsService.getUnreadCount();
    setUnreadCount(count);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  };

  const handleSettingsToggle = () => {
    setIsSettingsOpen(!isSettingsOpen);
    if (isNotificationsOpen) {
      setIsNotificationsOpen(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end">
        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 relative">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationsToggle}
              className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsPopover
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={handleSettingsToggle}
              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <Settings size={20} />
            </button>
            <SettingsPopover
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* User Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-dark">{user?.nome || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.role === 'ADMIN' ? 'Admin' : 'Usuário'}</p>
            </div>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-9 h-9 rounded-full shadow-sm hover:shadow-md transition-shadow object-cover"
              />
            ) : (
              <img
                src={`https://i.pravatar.cc/40?u=${user?.email}`}
                alt="Avatar"
                className="w-9 h-9 rounded-full shadow-sm hover:shadow-md transition-shadow object-cover"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
