import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar sesión al iniciar
  useEffect(() => {
    const initAuth = () => {
      const session = authService.getSession();
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      const userData = {
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      };

      authService.saveSession(response.token, userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Error al iniciar sesión' 
      };
    }
  };

  // Register
  const register = async (fullName, email, password) => {
    try {
      await authService.register(fullName, email, password);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Error al registrarse' 
      };
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Actualizar datos del usuario
  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
    const session = authService.getSession();
    if (session) {
      authService.saveSession(session.token, { ...session.user, ...userData });
    }
  };

  // Verificar roles
  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole(ROLES.ADMIN);
  const isOperator = () => hasRole(ROLES.OPERARIO);
  const isUser = () => hasRole(ROLES.USUARIO);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isOperator,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};