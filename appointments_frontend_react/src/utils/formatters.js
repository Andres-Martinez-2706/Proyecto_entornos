import { format, formatDistance, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato legible
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch {
    return '-';
  }
};

/**
 * Formatea una fecha completa (con día de semana)
 */
export const formatFullDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return '-';
  }
};

/**
 * Formatea una hora
 */
export const formatTime = (timeString) => {
  if (!timeString) return '-';
  try {
    // Si viene en formato HH:mm:ss, extraer solo HH:mm
    if (typeof timeString === 'string' && timeString.includes(':')) {
      return timeString.substring(0, 5);
    }
    return timeString;
  } catch {
    return '-';
  }
};

/**
 * Formatea una fecha y hora completa
 */
export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  try {
    const date = typeof dateTimeString === 'string' ? parseISO(dateTimeString) : dateTimeString;
    return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  } catch {
    return '-';
  }
};

/**
 * Formatea tiempo relativo (hace X tiempo)
 */
export const formatRelativeTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  try {
    const date = typeof dateTimeString === 'string' ? parseISO(dateTimeString) : dateTimeString;
    
    if (isToday(date)) {
      return `Hoy a las ${format(date, 'HH:mm')}`;
    }
    if (isTomorrow(date)) {
      return `Mañana a las ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
      return `Ayer a las ${format(date, 'HH:mm')}`;
    }
    
    return formatDistance(date, new Date(), { 
      addSuffix: true, 
      locale: es 
    });
  } catch {
    return '-';
  }
};

/**
 * Formatea un número como porcentaje
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
};

/**
 * Formatea un rating (estrellas)
 */
export const formatRating = (rating) => {
  if (rating === null || rating === undefined) return 'Sin calificar';
  return `${rating.toFixed(1)} ⭐`;
};

/**
 * Trunca texto largo
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formatea duración en minutos a texto legible
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};

/**
 * Obtiene las iniciales de un nombre
 */
export const getInitials = (fullName) => {
  if (!fullName) return 'U';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};