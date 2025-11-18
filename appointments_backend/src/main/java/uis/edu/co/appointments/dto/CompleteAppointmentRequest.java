package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CompleteAppointmentRequest {
    
    @NotNull(message = "El estado de asistencia es obligatorio")
    private Boolean attended;
    
    @NotBlank(message = "La observación del operario es obligatoria")
    private String operatorObservation;
    
    @Min(value = 1, message = "La calificación mínima es 1")
    @Max(value = 5, message = "La calificación máxima es 5")
    private Integer operatorRating; // Opcional

    // Getters y Setters
    public Boolean getAttended() { return attended; }
    public void setAttended(Boolean attended) { this.attended = attended; }
    
    public String getOperatorObservation() { return operatorObservation; }
    public void setOperatorObservation(String operatorObservation) { 
        this.operatorObservation = operatorObservation; 
    }
    
    public Integer getOperatorRating() { return operatorRating; }
    public void setOperatorRating(Integer operatorRating) { 
        this.operatorRating = operatorRating; 
    }
}