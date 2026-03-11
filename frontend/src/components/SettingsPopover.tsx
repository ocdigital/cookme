import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, User, Lock, Volume2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function getDefaultAvatar(email: string): string {
  return `https://i.pravatar.cc/150?u=${email}`;
}

type SettingsPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(true);

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


  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const handleToggleDarkMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTheme();
  };

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
    // TODO: Implement notification settings in future
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Configurações</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* User Info Section */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="w-10 h-10 rounded-full shadow-sm object-cover"
            />
          ) : (
            <img
              src={getDefaultAvatar(user?.email || '')}
              alt="Avatar"
              className="w-10 h-10 rounded-full shadow-sm object-cover"
            />
          )}
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {user?.nome || 'Admin'}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="py-2">
        {/* Profile */}
        <button
          onClick={() => {
            navigate('/profile');
            onClose();
          }}
          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <User size={16} className="text-gray-400" />
          <span>Editar Perfil</span>
        </button>

        {/* Change Password */}
        <button className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
          <Lock size={16} className="text-gray-400" />
          <span>Alterar Senha</span>
        </button>

        {/* Divider */}
        <div className="my-2 px-4">
          <div className="h-px bg-gray-100" />
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={handleToggleDarkMode}
          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon size={16} className="text-gray-400" />
            ) : (
              <Sun size={16} className="text-gray-400" />
            )}
            <span>Modo Escuro</span>
          </span>
          <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
            theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
          }`}>
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Notifications Toggle */}
        <button
          onClick={handleToggleNotifications}
          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span className="flex items-center gap-3">
            <Volume2 size={16} className="text-gray-400" />
            <span>Notificações</span>
          </span>
          <div className="relative w-10 h-6 bg-gray-300 rounded-full transition-colors" style={{backgroundColor: notifications ? '#3b82f6' : '#d1d5db'}}>
            <div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
              style={{ transform: notifications ? 'translateX(16px)' : 'translateX(0)' }}
            />
          </div>
        </button>

        {/* Divider */}
        <div className="my-2 px-4">
          <div className="h-px bg-gray-100" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          CookMe v1.0.0 • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};
