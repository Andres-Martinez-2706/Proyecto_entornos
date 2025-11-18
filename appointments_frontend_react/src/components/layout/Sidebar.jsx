import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Bell, 
  User, 
  Folder, 
  Users, 
  Clock,
  BarChart3,
  X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { cn } from '../../utils/cn';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isOperator } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    {
      to: '/dashboard',
      icon: Home,
      label: 'Inicio',
      roles: [ROLES.ADMIN, ROLES.OPERARIO, ROLES.USUARIO],
    },
    {
      to: '/appointments',
      icon: Calendar,
      label: 'Citas',
      roles: [ROLES.ADMIN, ROLES.OPERARIO, ROLES.USUARIO],
    },
    {
      to: '/calendar',
      icon: Calendar,
      label: 'Calendario',
      roles: [ROLES.ADMIN, ROLES.OPERARIO, ROLES.USUARIO],
    },
    {
      to: '/notifications',
      icon: Bell,
      label: 'Notificaciones',
      badge: unreadCount,
      roles: [ROLES.ADMIN, ROLES.OPERARIO, ROLES.USUARIO],
    },
    {
      to: '/schedule',
      icon: Clock,
      label: 'Mis Horarios',
      roles: [ROLES.OPERARIO],
    },
    {
      to: '/categories',
      icon: Folder,
      label: 'Categorías',
      roles: [ROLES.ADMIN],
    },
    {
      to: '/users',
      icon: Users,
      label: 'Usuarios',
      roles: [ROLES.ADMIN],
    },
    {
      to: '/operators',
      icon: Users,
      label: 'Operarios',
      roles: [ROLES.ADMIN],
    },
    {
      to: '/stats',
      icon: BarChart3,
      label: 'Estadísticas',
      roles: [ROLES.ADMIN, ROLES.OPERARIO],
    },
    {
      to: '/profile',
      icon: User,
      label: 'Perfil',
      roles: [ROLES.ADMIN, ROLES.OPERARIO, ROLES.USUARIO],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-30',
          'transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Navigation */}
        <nav className="py-6 px-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors relative',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-danger-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;