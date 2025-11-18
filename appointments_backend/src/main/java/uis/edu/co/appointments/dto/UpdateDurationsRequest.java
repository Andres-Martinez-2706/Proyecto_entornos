package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class UpdateDurationsRequest {
    
    @NotEmpty(message = "Debe proporcionar al menos una duración")
    private List<Integer> allowedDurations;

    public List<Integer> getAllowedDurations() { return allowedDurations; }
    public void setAllowedDurations(List<Integer> allowedDurations) { 
        this.allowedDurations = allowedDurations; 
    }
}