import axiosInstance from './axiosConfig';

const scheduleService = {
  getMySchedules: async () => {
    const response = await axiosInstance.get('/api/operator-schedules/me');
    return response.data;
  },

  getOperatorSchedules: async (operatorId) => {
    const response = await axiosInstance.get(
      `/api/operator-schedules/operator/${operatorId}`
    );
    return response.data;
  },

  create: async (scheduleData) => {
    const response = await axiosInstance.post('/api/operator-schedules', scheduleData);
    return response.data;
  },

  update: async (id, scheduleData) => {
    const response = await axiosInstance.put(`/api/operator-schedules/${id}`, scheduleData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/operator-schedules/${id}`);
    return response.data;
  },

  validate: async (scheduleData) => {
    const response = await axiosInstance.post(
      '/api/operator-schedules/validate',
      scheduleData
    );
    return response.data;
  },

  checkAvailability: async (operatorId, dayOfWeek) => {
    const response = await axiosInstance.get(
      `/api/operator-schedules/availability/${operatorId}/${dayOfWeek}`
    );
    return response.data;
  },
};

export { scheduleService };