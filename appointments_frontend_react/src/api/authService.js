import axiosInstance from './axiosConfig';

const authService = {
  /**
   * Login de usuario
   */
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Registro de usuario
   */
  register: async (fullName, email, password) => {
    const response = await axiosInstance.post('/auth/register', {
      fullName,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async () => {
    const response = await axiosInstance.get('/api/users/me');
    return response.data;
  },

  /**
   * Guardar sesión en localStorage
   */
  saveSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Obtener sesión del localStorage
   */
  getSession: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return { token, user };
    } catch {
      return null;
    }
  },

  /**
   * Cerrar sesión
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Verificar si el usuario es admin
   */
  isAdmin: () => {
    const session = authService.getSession();
    return session?.user?.role === 'ADMIN';
  },

  /**
   * Verificar si el usuario es operario
   */
  isOperator: () => {
    const session = authService.getSession();
    return session?.user?.role === 'OPERARIO';
  },

  /**
   * Verificar si el usuario es usuario normal
   */
  isUser: () => {
    const session = authService.getSession();
    return session?.user?.role === 'USUARIO';
  },
};

export default authService;