package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateNotificationPreferenceRequest {
    
    @NotNull(message = "Las horas de recordatorio son obligatorias")
    @Min(value = 1, message = "El mínimo es 1 hora antes")
    @Max(value = 6, message = "El máximo es 6 horas antes")
    private Integer reminderHours;

    public Integer getReminderHours() {
        return reminderHours;
    }

    public void setReminderHours(Integer reminderHours) {
        this.reminderHours = reminderHours;
    }
}