import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Crear instancia de Axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request - Agregar token JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response - Manejo de errores
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Error de red o servidor caído
    if (!error.response) {
      console.error('Error de conexión:', error.message);
      return Promise.reject({
        message: 'Error de conexión con el servidor. Verifica que el backend esté corriendo.',
        status: 0,
      });
    }

    // Error 401 - No autorizado (token expirado o inválido)
    if (error.response.status === 401) {
      // Limpiar sesión y redirigir a login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject({
        message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
        status: 401,
      });
    }

    // Error 403 - Prohibido (sin permisos)
    if (error.response.status === 403) {
      return Promise.reject({
        message: 'No tienes permisos para realizar esta acción.',
        status: 403,
        data: error.response.data,
      });
    }

    // Error 404 - No encontrado
    if (error.response.status === 404) {
      return Promise.reject({
        message: 'Recurso no encontrado.',
        status: 404,
        data: error.response.data,
      });
    }

    // Error 500 - Error del servidor
    if (error.response.status >= 500) {
      return Promise.reject({
        message: 'Error del servidor. Intenta nuevamente más tarde.',
        status: error.response.status,
        data: error.response.data,
      });
    }

    // Otros errores (400, 422, etc.)
    const errorMessage = 
      error.response.data?.message || 
      error.response.data?.error || 
      'Ocurrió un error inesperado.';

    return Promise.reject({
      message: errorMessage,
      status: error.response.status,
      data: error.response.data,
    });
  }
);

export default axiosInstance;