package uis.edu.co.appointments.dto;

public class OperatorStats {
    private long totalAppointments;
    private long completedAppointments;
    private long failedAppointments;
    private double averageRating;
    private double userFailureRate;

    public OperatorStats(long totalAppointments, long completedAppointments, 
                        long failedAppointments, double averageRating, 
                        double userFailureRate) {
        this.totalAppointments = totalAppointments;
        this.completedAppointments = completedAppointments;
        this.failedAppointments = failedAppointments;
        this.averageRating = averageRating;
        this.userFailureRate = userFailureRate;
    }

    // Getters y Setters
    public long getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(long totalAppointments) { 
        this.totalAppointments = totalAppointments; 
    }
    
    public long getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(long completedAppointments) { 
        this.completedAppointments = completedAppointments; 
    }
    
    public long getFailedAppointments() { return failedAppointments; }
    public void setFailedAppointments(long failedAppointments) { 
        this.failedAppointments = failedAppointments; 
    }
    
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { 
        this.averageRating = averageRating; 
    }
    
    public double getUserFailureRate() { return userFailureRate; }
    public void setUserFailureRate(double userFailureRate) { 
        this.userFailureRate = userFailureRate; 
    }
}