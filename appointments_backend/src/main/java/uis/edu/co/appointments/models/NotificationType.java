package uis.edu.co.appointments.models;

public enum NotificationType {
    SYSTEM,                 // Notificaciones generales del sistema
    ADMIN_MODIFICATION,     // Cuando admin modifica una cita
    ADMIN_CANCELLATION,     // Cuando admin cancela/elimina una cita
    REMINDER_DAY,           // Recordatorio 1 día antes
    REMINDER_HOUR,          // Recordatorio X horas antes
    OPERATOR_ASSIGNED,      // Cuando se asigna operario
    OPERATOR_CHANGED,       // Cuando se reasigna operario
    COMPLETION_REQUIRED,    // Recordatorio para completar
    RATING_RECEIVED;        // Cuando recibe calificación
    
    // Métodos helper para convertir desde/hacia String
    public static NotificationType fromString(String type) {
        if (type == null) return SYSTEM;
        try {
            return NotificationType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SYSTEM;
        }
    }
}