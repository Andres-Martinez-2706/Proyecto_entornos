package uis.edu.co.appointments.dto;

import java.util.Map;

public class DashboardStatsDTO {
    private Long totalAppointments;
    private Long scheduledAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;
    private Long failedAppointments;
    private Double completionRate;
    private Double attendanceRate;
    private Double averageRating;
    
    // Para admin
    private Long totalUsers;
    private Long totalOperators;
    private Long activeUsers;
    
    // Distribución por categoría
    private Map<String, Long> appointmentsByCategory;
    
    // Distribución por operario (top 5)
    private Map<String, Long> appointmentsByOperator;
    
    // Tendencia semanal (últimos 7 días)
    private Map<String, Long> appointmentsByDay;

    // Constructor
    public DashboardStatsDTO() {}

    // Getters y Setters
    public Long getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(Long totalAppointments) { 
        this.totalAppointments = totalAppointments; 
    }
    
    public Long getScheduledAppointments() { return scheduledAppointments; }
    public void setScheduledAppointments(Long scheduledAppointments) { 
        this.scheduledAppointments = scheduledAppointments; 
    }
    
    public Long getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(Long completedAppointments) { 
        this.completedAppointments = completedAppointments; 
    }
    
    public Long getCancelledAppointments() { return cancelledAppointments; }
    public void setCancelledAppointments(Long cancelledAppointments) { 
        this.cancelledAppointments = cancelledAppointments; 
    }
    
    public Long getFailedAppointments() { return failedAppointments; }
    public void setFailedAppointments(Long failedAppointments) { 
        this.failedAppointments = failedAppointments; 
    }
    
    public Double getCompletionRate() { return completionRate; }
    public void setCompletionRate(Double completionRate) { 
        this.completionRate = completionRate; 
    }
    
    public Double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(Double attendanceRate) { 
        this.attendanceRate = attendanceRate; 
    }
    
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { 
        this.averageRating = averageRating; 
    }
    
    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { 
        this.totalUsers = totalUsers; 
    }
    
    public Long getTotalOperators() { return totalOperators; }
    public void setTotalOperators(Long totalOperators) { 
        this.totalOperators = totalOperators; 
    }
    
    public Long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(Long activeUsers) { 
        this.activeUsers = activeUsers; 
    }
    
    public Map<String, Long> getAppointmentsByCategory() { 
        return appointmentsByCategory; 
    }
    public void setAppointmentsByCategory(Map<String, Long> appointmentsByCategory) { 
        this.appointmentsByCategory = appointmentsByCategory; 
    }
    
    public Map<String, Long> getAppointmentsByOperator() { 
        return appointmentsByOperator; 
    }
    public void setAppointmentsByOperator(Map<String, Long> appointmentsByOperator) { 
        this.appointmentsByOperator = appointmentsByOperator; 
    }
    
    public Map<String, Long> getAppointmentsByDay() { 
        return appointmentsByDay; 
    }
    public void setAppointmentsByDay(Map<String, Long> appointmentsByDay) { 
        this.appointmentsByDay = appointmentsByDay; 
    }
}