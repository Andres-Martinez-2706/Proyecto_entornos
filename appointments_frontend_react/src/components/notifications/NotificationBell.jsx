import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import NotificationItem from './NotificationItem';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { useNotifications } from '../../context/NotificationContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    // Marcar como leída
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Cerrar dropdown
    setIsOpen(false);

    // Navegar si tiene cita relacionada
    if (notification.relatedAppointmentId) {
      navigate(`/appointments/${notification.relatedAppointmentId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  // Mostrar solo las últimas 5 notificaciones
  const recentNotifications = notifications.slice(0, 5);
  const hasMore = notifications.length > 5;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-gray-900">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({unreadCount} sin leer)
                </span>
              )}
            </h3>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {recentNotifications.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<Bell />}
                  title="No hay notificaciones"
                  description="Las notificaciones aparecerán aquí"
                />
              </div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="flex-1"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAll}
                  className="flex-1"
                >
                  Ver todas {hasMore && `(+${notifications.length - 5})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;