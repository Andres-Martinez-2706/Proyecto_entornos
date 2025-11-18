import { Check, Trash2, Calendar, Bell, AlertCircle, Info } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/formatters';
import Badge from '../common/Badge';

const NotificationItem = ({ 
  notification, 
  onClick,
  onMarkAsRead,
  onDelete,
  compact = false, // Modo compacto para dropdown
}) => {
  const getNotificationIcon = (type) => {
    const icons = {
      'APPOINTMENT_CREATED': Calendar,
      'APPOINTMENT_UPDATED': Calendar,
      'APPOINTMENT_CANCELLED': Calendar,
      'APPOINTMENT_REMINDER': Bell,
      'APPOINTMENT_COMPLETED': Calendar,
      'SYSTEM': Info,
      'default': AlertCircle,
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'APPOINTMENT_CREATED': 'success',
      'APPOINTMENT_UPDATED': 'warning',
      'APPOINTMENT_CANCELLED': 'danger',
      'APPOINTMENT_REMINDER': 'primary',
      'APPOINTMENT_COMPLETED': 'success',
      'SYSTEM': 'default',
    };
    return colors[type] || 'default';
  };

  const Icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  const handleClick = (e) => {
    if (onClick) {
      onClick(notification);
    }
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        !notification.isRead 
          ? 'bg-primary-50 hover:bg-primary-100' 
          : 'hover:bg-gray-50'
      } ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className={`p-2 rounded-lg bg-${color}-100 flex-shrink-0`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold ${
              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
            } ${compact ? 'text-sm' : 'text-base'}`}>
              {notification.title}
            </h4>
            
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5"></span>
            )}
          </div>

          <p className={`${
            !notification.isRead ? 'text-gray-700' : 'text-gray-600'
          } ${compact ? 'text-xs' : 'text-sm'} line-clamp-2 mb-2`}>
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
              {formatDate(notification.createdAt)}
              {' • '}
              {formatTime(notification.createdAt)}
            </span>

            {/* Acciones */}
            {!compact && (
              <div className="flex gap-2">
                {!notification.isRead && onMarkAsRead && (
                  <button
                    onClick={handleMarkAsRead}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Marcar como leída"
                  >
                    <Check className="w-4 h-4 text-primary-600" />
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-danger-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Badge de tipo (solo en modo no compacto) */}
          {!compact && notification.type && (
            <div className="mt-2">
              <Badge variant={color} className="text-xs">
                {notification.type.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de no leída en modo compacto */}
      {compact && !notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l"></div>
      )}
    </div>
  );
};

export default NotificationItem;