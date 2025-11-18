import axiosInstance from './axiosConfig';

const appointmentService = {
  /**
   * Obtener todas las citas
   */
  getAll: async (includeDeleted = false) => {
    const response = await axiosInstance.get('/api/appointments', {
      params: { includeDeleted },
    });
    return response.data;
  },

  /**
   * Obtener citas próximas (7 días)
   */
  getUpcoming: async () => {
    const response = await axiosInstance.get('/api/appointments/upcoming');
    return response.data;
  },

  /**
   * Obtener cita por ID
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/api/appointments/${id}`);
    return response.data;
  },

  /**
   * Crear nueva cita
   */
  create: async (appointmentData) => {
    // 🐛 DEBUG: Ver datos antes de enviar
    console.log('📤 Datos que se enviarán al backend:', appointmentData);
    console.log('📤 Estructura completa:', JSON.stringify(appointmentData, null, 2));
    
    // Validar campos obligatorios
    const requiredFields = ['title', 'categoryId', 'date', 'startTime', 'endTime', 'durationMinutes'];
    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Faltan campos obligatorios:', missingFields);
    }
    
    const response = await axiosInstance.post('/api/appointments', appointmentData);
    return response.data;
  },

  /**
   * Actualizar cita
   */
  update: async (id, appointmentData) => {
    const response = await axiosInstance.put(`/api/appointments/${id}`, appointmentData);
    return response.data;
  },

  /**
   * Eliminar cita (soft delete)
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/appointments/${id}`);
    return response.data;
  },

  /**
   * Completar cita (operario)
   */
  complete: async (id, completionData) => {
    const response = await axiosInstance.post(
      `/api/appointments/${id}/complete`,
      completionData
    );
    return response.data;
  },

  /**
   * Calificar operario (usuario)
   */
  rateOperator: async (id, rating, observation) => {
    const response = await axiosInstance.patch(
      `/api/appointments/${id}/rate-operator`,
      { rating, observation }
    );
    return response.data;
  },

  /**
   * Obtener citas pendientes de completar (operario)
   */
  getPendingCompletion: async () => {
    const response = await axiosInstance.get('/api/appointments/pending-completion');
    return response.data;
  },

  /**
   * Buscar operarios disponibles
   */
  getAvailableOperators: async (categoryId, date, startTime, durationMinutes) => {
    const response = await axiosInstance.get('/api/appointments/available-operators', {
      params: { categoryId, date, startTime, durationMinutes },
    });
    return response.data;
  },

  /**
   * Obtener citas de un operario
   */
  getByOperator: async (operatorId, includeDeleted = false) => {
    const response = await axiosInstance.get(`/api/appointments/operator/${operatorId}`, {
      params: { includeDeleted },
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de operario
   */
  getOperatorStats: async (operatorId, startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get(
      `/api/appointments/operator-stats/${operatorId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de usuario
   */
  getUserStats: async (userId, startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get(
      `/api/appointments/user-stats/${userId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Búsqueda avanzada de citas con paginación
   */
  search: async (filters = {}, page = 0, size = 10, sort = ['date', 'desc']) => {
    const params = {
      page,
      size,
      sort: sort.join(','),
      ...filters,
    };

    const response = await axiosInstance.get('/api/appointments/search', { params });
    return response.data;
  },

  /**
   * Obtener estadísticas del dashboard
   */
  getDashboardStats: async (period = '30d', customStart = null, customEnd = null) => {
    const params = { period };
    if (customStart) params.customStart = customStart;
    if (customEnd) params.customEnd = customEnd;

    const response = await axiosInstance.get('/api/appointments/dashboard/stats', { params });
    return response.data;
  },
  /**
   * Cancelar cita con observación (operario)
   */
  cancelWithObservation: async (id, observation) => {
    const response = await axiosInstance.post(
      `/api/appointments/${id}/cancel`,
      { observation }
    );
    return response.data;
  },
};

export default appointmentService;