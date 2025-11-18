import axiosInstance from './axiosConfig';

const userService = {
  /**
   * Obtener todos los usuarios (admin)
   */
  getAll: async () => {
    const response = await axiosInstance.get('/api/users');
    return response.data;
  },

  /**
   * Obtener usuario por ID
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/api/users/${id}`);
    // ✅ FIX: El backend devuelve el usuario directamente, no envuelto
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getMyProfile: async () => {
    const response = await axiosInstance.get('/api/users/me');
    return response.data;
  },

  /**
   * Crear usuario (admin)
   */
  create: async (userData) => {
    const response = await axiosInstance.post('/api/users', userData);
    // ✅ Extraer data si viene en ApiResponse
    return response.data.data || response.data;
  },

  /**
   * Actualizar usuario (admin)
   */
  update: async (id, userData) => {
    const response = await axiosInstance.put(`/api/users/${id}`, userData);
    return response.data.data || response.data;
  },

  /**
   * Eliminar usuario (admin)
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Actualizar email
   */
  updateEmail: async (id, newEmail) => {
    const response = await axiosInstance.patch(`/api/users/${id}/email`, {
      newEmail,
    });
    return response.data.data || response.data;
  },

  /**
   * Actualizar contraseña
   */
  updatePassword: async (id, currentPassword, newPassword) => {
    const response = await axiosInstance.patch(`/api/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Actualizar preferencia de notificación (horas antes)
   */
  updateNotificationPreference: async (id, reminderHours) => {
    const response = await axiosInstance.patch(
      `/api/users/${id}/notification-preference`,
      { reminderHours }
    );
    return response.data.data || response.data;
  },

  /**
   * Actualizar preferencias completas de notificación
   */
  updateNotificationPreferences: async (id, preferences) => {
    const response = await axiosInstance.patch(
      `/api/users/${id}/notification-preferences`,
      preferences
    );
    return response.data.data || response.data;
  },

  /**
   * Obtener estadísticas de usuarios (admin)
   */
  getStats: async () => {
    const response = await axiosInstance.get('/api/users/stats/admin');
    return response.data;
  },

  /**
   * Listar operarios activos
   */
  getOperators: async () => {
    const response = await axiosInstance.get('/api/users/operators');
    return response.data;
  },

  /**
   * Obtener operarios por categoría
   */
  getOperatorsByCategory: async (categoryId) => {
    const response = await axiosInstance.get(
      `/api/users/operators/by-category/${categoryId}`
    );
    return response.data;
  },

  /**
   * Asignar categorías a operario
   * ✅ FIX: Manejar respuesta correctamente
   */
  assignCategories: async (operatorId, categoryIds) => {
    const response = await axiosInstance.patch(
      `/api/users/${operatorId}/categories`,
      { categoryIds }
    );
    // El backend devuelve ApiResponse con solo mensaje, no data
    return response.data;
  },

  /**
   * Cambiar estado activo/inactivo de usuario (admin)
   */
  updateActiveStatus: async (userId, active) => {
    const response = await axiosInstance.patch(
      `/api/users/${userId}/active-status`,
      null,
      { params: { active } }
    );
    return response.data;
  },

  /**
   * Obtener estadísticas básicas de usuario
   */
  getUserBasicStats: async (userId) => {
    const response = await axiosInstance.get(`/api/users/${userId}/stats`);
    return response.data;
  },

  /**
   * Cambiar rol de usuario (admin)
   */
  changeRole: async (userId, roleName) => {
    const response = await axiosInstance.patch(
      `/api/users/${userId}/change-role`,
      null,
      { params: { roleName } }
    );
    return response.data.data || response.data;
  },

  /**
   * Crear usuario operario (admin)
   */
  createOperator: async (fullName, email, password) => {
    const response = await axiosInstance.post('/api/users/create-operator', {
      fullName,
      email,
      password,
    });
    return response.data.data || response.data;
  },

  /**
   * Búsqueda avanzada de usuarios (admin)
   */
  search: async (filters = {}, page = 0, size = 10, sort = ['fullName', 'asc']) => {
    const params = {
      page,
      size,
      sort: sort.join(','),
      ...filters,
    };

    const response = await axiosInstance.get('/api/users/search', { params });
    return response.data;
  },
};

export default userService;