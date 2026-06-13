import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  Package,
  UtensilsCrossed,
  LogOut,
  BarChart3,
  ShieldCheck,
  ClipboardList,
  DatabaseZap,
  ShoppingCart,
  Brain,
  Hash,
  Salad,
  Settings2,
  Terminal,
  // ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CookmeLogoHorizontal } from './CookmeLogo';

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
    { icon: ShieldCheck, label: 'Moderação', path: '/moderacao' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: ClipboardList, label: 'Auditoria', path: '/audit-logs' },
    { icon: ShoppingCart, label: 'Compras', path: '/compras' },
    { icon: Brain, label: 'Base de Ingredientes', path: '/knowledge-base' },
    { icon: Salad, label: 'Ingredientes', path: '/ingredients' },
    { icon: Hash, label: 'Abreviações OCR', path: '/abbreviations' },
    { icon: DatabaseZap, label: 'Gerenciar Dados', path: '/data-management' },
    { icon: Settings2, label: 'Config. Sistema', path: '/system-config' },
    { icon: Terminal, label: 'Logs', path: '/logs' },
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
          fixed left-0 top-0 h-screen w-48 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm
          transition-all duration-300 z-40 flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:relative
        `}
      >
        {/* Logo */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <CookmeLogoHorizontal size={36} />
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium
                    ${
                      isActive(item.path)
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon size={15} />
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
            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 text-xs font-medium"
          >
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};
