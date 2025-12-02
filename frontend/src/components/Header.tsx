import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left side - empty for desktop, can add breadcrumbs */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Bell size={20} />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold text-[10px]">
              3
            </span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Settings size={20} />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-dark">{user?.nome || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.role === 'ADMIN' ? 'Admin' : 'Usuário'}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm hover:shadow-md transition-shadow">
              {user?.nome?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
