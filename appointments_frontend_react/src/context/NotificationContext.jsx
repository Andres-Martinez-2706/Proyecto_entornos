import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../api/notificationService';
import { useAuth } from './AuthContext';
import { POLLING_INTERVAL } from '../utils/constants';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
      
      // Contar no leídas
      const unread = data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }, [isAuthenticated]);

  // Cargar contador de no leídas (más ligero)
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error al cargar contador:', error);
    }
  }, [isAuthenticated]);

  // Polling automático para actualizar notificaciones
  useEffect(() => {
    if (!isAuthenticated) return;

    // Cargar inicialmente
    fetchNotifications();

    // Configurar polling
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Marcar como leída
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      throw error;
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      throw error;
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.delete(notificationId);
      
      const notification = notifications.find((n) => n.id === notificationId);
      
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  };

  // Refrescar notificaciones manualmente
  const refresh = async () => {
    setLoading(true);
    try {
      await fetchNotifications();
    } finally {
      setLoading(false);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personalizado
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};