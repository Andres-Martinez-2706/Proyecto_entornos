// Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  OPERARIO: 'OPERARIO',
  USUARIO: 'USUARIO',
};

// Estados de citas
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

// Traducción de estados
export const APPOINTMENT_STATUS_LABELS = {
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En Curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  FAILED: 'Fallida',
};

// Estados de asistencia
export const ATTENDANCE_STATUS = {
  PENDING: 'PENDING',
  ATTENDED: 'ATTENDED',
  NOT_ATTENDED: 'NOT_ATTENDED',
};

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  SYSTEM: 'SYSTEM',
  ADMIN_MODIFICATION: 'ADMIN_MODIFICATION',
  ADMIN_CANCELLATION: 'ADMIN_CANCELLATION',
  REMINDER_DAY: 'REMINDER_DAY',
  REMINDER_HOUR: 'REMINDER_HOUR',
  OPERATOR_ASSIGNED: 'OPERATOR_ASSIGNED',
  OPERATOR_CHANGED: 'OPERATOR_CHANGED',
  COMPLETION_REQUIRED: 'COMPLETION_REQUIRED',
  RATING_RECEIVED: 'RATING_RECEIVED',
};

// Días de la semana
export const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

// Rangos de fechas predefinidos
export const DATE_RANGES = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'custom', label: 'Personalizado' },
];

// Opciones de recordatorio (horas antes)
export const REMINDER_HOURS_OPTIONS = [
  { value: 1, label: '1 hora antes' },
  { value: 2, label: '2 horas antes' },
  { value: 3, label: '3 horas antes' },
  { value: 4, label: '4 horas antes' },
  { value: 5, label: '5 horas antes' },
  { value: 6, label: '6 horas antes' },
];

// Tamaños de página para paginación
export const PAGE_SIZES = [10, 20, 50, 100];

// Colores por estado de cita
export const STATUS_COLORS = {
  SCHEDULED: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  COMPLETED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
  },
  FAILED: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
  },
};

// Emojis por estado
export const STATUS_EMOJIS = {
  SCHEDULED: '⏳',
  IN_PROGRESS: '⚡',
  COMPLETED: '✅',
  CANCELLED: '❌',
  FAILED: '⚠️',
};

// Configuración de polling
export const POLLING_INTERVAL = parseInt(
  import.meta.env.VITE_NOTIFICATION_POLLING_INTERVAL || '30000'
);

// URLs de navegación
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  APPOINTMENTS_CREATE: '/appointments/create',
  APPOINTMENTS_DETAILS: '/appointments/:id',
  CALENDAR: '/calendar',
  SCHEDULE: '/schedule',
  USERS: '/users',
  OPERATORS: '/operators',
  CATEGORIES: '/categories',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  STATS: '/stats',
};