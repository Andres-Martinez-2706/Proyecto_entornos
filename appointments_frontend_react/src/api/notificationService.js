import axiosInstance from './axiosConfig';

const notificationService = {
  getAll: async (unreadOnly = false) => {
    const response = await axiosInstance.get('/api/notifications', {
      params: { unreadOnly },
    });
    return response.data;
  },

  getMyNotifications: async (unreadOnly = false) => {
    const response = await axiosInstance.get('/api/notifications/me', {
      params: { unreadOnly },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axiosInstance.get('/api/notifications/me/unread-count');
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/api/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axiosInstance.patch(`/api/notifications/${id}/read`, {});
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axiosInstance.patch('/api/notifications/me/read-all', {});
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/notifications/${id}`);
    return response.data;
  },

  getAdminNotifications: async () => {
    const response = await axiosInstance.get('/api/notifications/me/admin-notifications');
    return response.data;
  },
};

export { notificationService };
export default notificationService;