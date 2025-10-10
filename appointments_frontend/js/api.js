/**
 * API Client - Gestión de llamadas HTTP al backend
 */

// Configuración base
const API_BASE_URL = 'http://localhost:8080';

// Clase para manejar errores de API
class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Cliente API
const API = {
    /**
     * Obtener token JWT del localStorage
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Obtener headers base para las peticiones
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    },

    /**
     * Realizar petición HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const includeAuth = options.includeAuth !== false;

        const config = {
            ...options,
            headers: {
                ...this.getHeaders(includeAuth),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorData = null;
                let errorMessage = `Error ${response.status}`;
                
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        errorData = await response.json();
                        errorMessage = errorData?.message || errorData?.error || errorMessage;
                    } else {
                        const text = await response.text();
                        if (text) errorMessage = text;
                    }
                } catch (e) {
                    // Si falla parsear el error, usar mensaje por defecto
                    console.error('Error parsing error response:', e);
                }
                
                throw new APIError(errorMessage, response.status, errorData);
            }

            // Manejar respuesta exitosa
            const contentType = response.headers.get('content-type');
            
            // Si no hay contenido (204 No Content, etc)
            if (response.status === 204 || !contentType) {
                return null;
            }

            // Parsear JSON
            if (contentType.includes('application/json')) {
                const text = await response.text();
                return text ? JSON.parse(text) : null;
            }

            // Otros tipos de contenido
            return await response.text();
            
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            // Error de red, CORS, o timeout
            console.error('Network error:', error);
            throw new APIError(
                'Error de conexión con el servidor. Verifica que el backend esté corriendo.',
                0,
                null
            );
        }
    },

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET'
        });
    },

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * PATCH request
     */
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    /**
     * DELETE request
     */
    async delete(endpoint, data = null, options = {}) {
        const config = {
            ...options,
            method: 'DELETE'
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        return this.request(endpoint, config);
    },

    // ==================== AUTH ENDPOINTS ====================

    /**
     * Login
     */
    async login(email, password) {
        return this.post('/auth/login', { email, password }, { includeAuth: false });
    },

    /**
     * Register
     */
    async register(fullName, email, password) {
        return this.post('/auth/register', { fullName, email, password }, { includeAuth: false });
    },

    // ==================== USER ENDPOINTS ====================

    /**
     * Obtener perfil del usuario autenticado
     */
    async getMyProfile() {
        return this.get('/api/users/me');
    },

    /**
     * Obtener usuario por ID
     */
    async getUserById(userId) {
        return this.get(`/api/users/${userId}`);
    },

    /**
     * Actualizar email
     */
    async updateEmail(userId, newEmail) {
        return this.patch(`/api/users/${userId}/email`, { newEmail });
    },

    /**
     * Actualizar contraseña
     */
    async updatePassword(userId, currentPassword, newPassword) {
        return this.patch(`/api/users/${userId}/password`, { currentPassword, newPassword });
    },

    /**
     * Actualizar preferencia de notificación
     */
    async updateNotificationPreference(userId, reminderHours) {
        return this.patch(`/api/users/${userId}/notification-preference`, { reminderHours });
    },

    /**
     * Obtener estadísticas de usuarios (admin)
     */
    async getUserStats() {
        return this.get('/api/users/stats');
    },

    // ==================== APPOINTMENT ENDPOINTS ====================

    /**
     * Obtener todas las citas
     */
    async getAppointments(includeDeleted = true) {
        return this.get(`/api/appointments?includeDeleted=${includeDeleted}`);
    },

    /**
     * Obtener citas próximas (7 días)
     */
    async getUpcomingAppointments() {
        return this.get('/api/appointments/upcoming');
    },

    /**
     * Obtener cita por ID
     */
    async getAppointmentById(appointmentId) {
        return this.get(`/api/appointments/${appointmentId}`);
    },

    /**
     * Crear cita
     */
    async createAppointment(appointmentData) {
        return this.post('/api/appointments', appointmentData);
    },

    /**
     * Actualizar cita (usuario normal)
     */
    async updateAppointment(appointmentId, appointmentData) {
        return this.put(`/api/appointments/${appointmentId}`, appointmentData);
    },

    /**
     * Actualizar cita por admin con observación
     */
    async updateAppointmentByAdmin(appointmentId, appointmentData, adminObservation) {
        return this.put(`/api/appointments/${appointmentId}/admin`, {
            appointment: appointmentData,
            adminObservation
        });
    },

    /**
     * Eliminar cita (soft delete)
     */
    async deleteAppointment(appointmentId) {
        return this.delete(`/api/appointments/${appointmentId}`);
    },

    /**
     * Eliminar cita por admin con observación
     */
    async deleteAppointmentByAdmin(appointmentId, adminObservation) {
        return this.delete(`/api/appointments/${appointmentId}/admin`, { adminObservation });
    },

    /**
     * Marcar cita como completada
     */
    async markAppointmentCompleted(appointmentId) {
        return this.patch(`/api/appointments/${appointmentId}/complete`, {});
    },

    // ==================== NOTIFICATION ENDPOINTS ====================

    /**
     * Obtener notificaciones del usuario
     */
    async getMyNotifications(unreadOnly = false) {
        return this.get(`/api/notifications/me?unreadOnly=${unreadOnly}`);
    },

    /**
     * Obtener todas las notificaciones (admin)
     */
    async getAllNotifications() {
        return this.get('/api/notifications');
    },

    /**
     * Obtener notificación por ID
     */
    async getNotificationById(notificationId) {
        return this.get(`/api/notifications/${notificationId}`);
    },

    /**
     * Contar notificaciones no leídas
     */
    async getUnreadCount() {
        return this.get('/api/notifications/me/unread-count');
    },

    /**
     * Marcar notificación como leída
     */
    async markNotificationAsRead(notificationId) {
        return this.patch(`/api/notifications/${notificationId}/read`, {});
    },

    /**
     * Marcar todas las notificaciones como leídas
     */
    async markAllNotificationsAsRead() {
        return this.patch('/api/notifications/me/read-all', {});
    },

    /**
     * Eliminar notificación
     */
    async deleteNotification(notificationId) {
        return this.delete(`/api/notifications/${notificationId}`);
    },

    /**
     * Obtener notificaciones de admin
     */
    async getAdminNotifications() {
        return this.get('/api/notifications/me/admin-notifications');
    },

    // ==================== CATEGORY ENDPOINTS ====================

    /**
     * Obtener todas las categorías
     */
    async getCategories() {
        return this.get('/api/categories');
    },

    /**
     * Obtener categoría por ID
     */
    async getCategoryById(categoryId) {
        return this.get(`/api/categories/${categoryId}`);
    },

    /**
     * Crear categoría (admin)
     */
    async createCategory(categoryData) {
        return this.post('/api/categories', categoryData);
    },

    /**
     * Actualizar categoría (admin)
     */
    async updateCategory(categoryId, categoryData) {
        return this.put(`/api/categories/${categoryId}`, categoryData);
    },

    /**
     * Eliminar categoría (admin)
     */
    async deleteCategory(categoryId) {
        return this.delete(`/api/categories/${categoryId}`);
    }
};

// Exportar para uso global
window.API = API;
window.APIError = APIError;