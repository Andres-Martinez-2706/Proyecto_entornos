import { Bell } from 'lucide-react';
import NotificationItem from './NotificationItem';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

const NotificationList = ({ 
  notifications = [],
  loading = false,
  emptyMessage = 'No tienes notificaciones',
  emptyDescription = 'Las notificaciones aparecerán aquí cuando tengas novedades',
  onNotificationClick,
  onMarkAsRead,
  onDelete,
  showEmptyState = true,
  compact = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notifications.length === 0) {
    if (!showEmptyState) return null;
    
    return (
      <EmptyState
        icon={<Bell />}
        title={emptyMessage}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={`divide-y ${className}`}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={onNotificationClick}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          compact={compact}
        />
      ))}
    </div>
  );
};

export default NotificationList;