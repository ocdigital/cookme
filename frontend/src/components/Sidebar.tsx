import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  Package,
  UtensilsCrossed,
  ShoppingCart,
  BarChart3,
  LogOut,
  // ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Usuários', path: '/users' },
    { icon: Package, label: 'Produtos', path: '/products' },
    { icon: UtensilsCrossed, label: 'Receitas', path: '/recipes' },
    { icon: ShoppingCart, label: 'Compras', path: '/purchases' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm
          transition-all duration-300 z-40 flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:relative
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              🍳
            </div>
            <div>
              <span className="text-lg font-bold text-dark dark:text-white block">CookMe</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Admin</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                    ${
                      isActive(item.path)
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};
