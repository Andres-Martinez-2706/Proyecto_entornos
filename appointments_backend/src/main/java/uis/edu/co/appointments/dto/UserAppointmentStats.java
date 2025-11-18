package uis.edu.co.appointments.dto;

public class UserAppointmentStats {
    private long totalAppointments;
    private long attendedAppointments;
    private long failedAppointments;
    private double failureRate;
    private double averageRating;

    public UserAppointmentStats(long totalAppointments, long attendedAppointments, 
                               long failedAppointments, double failureRate, 
                               double averageRating) {
        this.totalAppointments = totalAppointments;
        this.attendedAppointments = attendedAppointments;
        this.failedAppointments = failedAppointments;
        this.failureRate = failureRate;
        this.averageRating = averageRating;
    }

    // Getters y Setters
    public long getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(long totalAppointments) { 
        this.totalAppointments = totalAppointments; 
    }
    
    public long getAttendedAppointments() { return attendedAppointments; }
    public void setAttendedAppointments(long attendedAppointments) { 
        this.attendedAppointments = attendedAppointments; 
    }
    
    public long getFailedAppointments() { return failedAppointments; }
    public void setFailedAppointments(long failedAppointments) { 
        this.failedAppointments = failedAppointments; 
    }
    
    public double getFailureRate() { return failureRate; }
    public void setFailureRate(double failureRate) { 
        this.failureRate = failureRate; 
    }
    
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { 
        this.averageRating = averageRating; 
    }
}