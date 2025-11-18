import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Bell, Check, CheckCheck, Trash2, Calendar, 
  AlertCircle, Info, RefreshCw 
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { useNotifications } from '../../context/NotificationContext';
import { formatDate, formatTime } from '../../utils/formatters';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // all, unread, read
  const [actionLoading, setActionLoading] = useState(false);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (error) {
      toast.error('Error al marcar como leída');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast.info('No hay notificaciones sin leer');
      return;
    }

    setActionLoading(true);
    try {
      await markAllAsRead();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      toast.error('Error al marcar notificaciones');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success('Notificación eliminada');
    } catch (error) {
      toast.error('Error al eliminar notificación');
    }
  };

  const handleNotificationClick = (notification) => {
    // Marcar como leída si no lo está
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Redirigir según el tipo de notificación
    if (notification.relatedAppointmentId) {
      navigate(`/appointments/${notification.relatedAppointmentId}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT_CREATED':
      case 'APPOINTMENT_UPDATED':
      case 'APPOINTMENT_CANCELLED':
        return Calendar;
      case 'APPOINTMENT_REMINDER':
        return Bell;
      case 'SYSTEM':
        return Info;
      default:
        return AlertCircle;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'APPOINTMENT_CREATED':
        return 'success';
      case 'APPOINTMENT_UPDATED':
        return 'warning';
      case 'APPOINTMENT_CANCELLED':
        return 'danger';
      case 'APPOINTMENT_REMINDER':
        return 'primary';
      default:
        return 'default';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-7 h-7" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="danger">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              Mantente al día con las actualizaciones
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                loading={actionLoading}
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          No leídas ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('read')}
        >
          Leídas ({notifications.length - unreadCount})
        </Button>
      </div>

      {/* Lista de notificaciones */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title={
            filter === 'unread' 
              ? 'No tienes notificaciones sin leer' 
              : filter === 'read'
              ? 'No tienes notificaciones leídas'
              : 'No tienes notificaciones'
          }
          description={
            filter === 'all' 
              ? 'Las notificaciones aparecerán aquí cuando tengas novedades'
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => {
            const Icon = getNotificationIcon(notification.type);
            const color = getNotificationColor(notification.type);

            return (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className={`p-2 rounded-lg bg-${color}-100 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>

                    <p className={`text-sm mb-2 ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)} a las {formatTime(notification.createdAt)}
                      </span>

                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="text-danger-600 hover:text-danger-700 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;