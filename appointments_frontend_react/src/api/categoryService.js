import axiosInstance from './axiosConfig';

const categoryService = {
  getAll: async () => {
    const response = await axiosInstance.get('/api/categories');
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/api/categories/${id}`);
    return response.data;
  },

  create: async (categoryData) => {
    const response = await axiosInstance.post('/api/categories', categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await axiosInstance.put(`/api/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/api/categories/${id}`);
    return response.data;
  },

  updateAllowedDurations: async (id, allowedDurations) => {
    const response = await axiosInstance.patch(`/api/categories/${id}/durations`, {
      allowedDurations,
    });
    return response.data;
  },

  getAllowedDurations: async (id) => {
    const response = await axiosInstance.get(`/api/categories/${id}/durations`);
    return response.data;
  },

  assignOperators: async (id, operatorIds) => {
    const response = await axiosInstance.patch(`/api/categories/${id}/operators`, {
      categoryIds: operatorIds, // Backend usa categoryIds pero son operatorIds
    });
    return response.data;
  },

  getOperators: async (id) => {
    const response = await axiosInstance.get(`/api/categories/${id}/operators`);
    return response.data;
  },
};

export default categoryService;