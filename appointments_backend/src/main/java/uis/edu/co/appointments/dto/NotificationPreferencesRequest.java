package uis.edu.co.appointments.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class NotificationPreferencesRequest {
    
    @NotNull(message = "Las horas de recordatorio son obligatorias")
    @Min(value = 1, message = "El mínimo es 1 hora antes")
    @Max(value = 6, message = "El máximo es 6 horas antes")
    private Integer reminderHours;
    
    @NotNull(message = "El estado de notificaciones por email es obligatorio")
    private Boolean emailNotificationsEnabled;
    
    @NotNull(message = "El estado de notificaciones in-app es obligatorio")
    private Boolean inAppNotificationsEnabled;
    
    @NotNull(message = "El estado de recordatorio del día anterior es obligatorio")
    private Boolean reminderDayBeforeEnabled;
    
    @NotNull(message = "El estado de recordatorio de horas antes es obligatorio")
    private Boolean reminderHoursBeforeEnabled;
    
    private List<String> notificationTypesEnabled;

    // Getters y Setters
    public Integer getReminderHours() { return reminderHours; }
    public void setReminderHours(Integer reminderHours) { this.reminderHours = reminderHours; }
    
    public Boolean getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { 
        this.emailNotificationsEnabled = emailNotificationsEnabled; 
    }
    
    public Boolean getInAppNotificationsEnabled() { return inAppNotificationsEnabled; }
    public void setInAppNotificationsEnabled(Boolean inAppNotificationsEnabled) { 
        this.inAppNotificationsEnabled = inAppNotificationsEnabled; 
    }
    
    public Boolean getReminderDayBeforeEnabled() { return reminderDayBeforeEnabled; }
    public void setReminderDayBeforeEnabled(Boolean reminderDayBeforeEnabled) { 
        this.reminderDayBeforeEnabled = reminderDayBeforeEnabled; 
    }
    
    public Boolean getReminderHoursBeforeEnabled() { return reminderHoursBeforeEnabled; }
    public void setReminderHoursBeforeEnabled(Boolean reminderHoursBeforeEnabled) { 
        this.reminderHoursBeforeEnabled = reminderHoursBeforeEnabled; 
    }
    
    public List<String> getNotificationTypesEnabled() { return notificationTypesEnabled; }
    public void setNotificationTypesEnabled(List<String> notificationTypesEnabled) { 
        this.notificationTypesEnabled = notificationTypesEnabled; 
    }
}