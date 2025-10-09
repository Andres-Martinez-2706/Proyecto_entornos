package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.NotBlank;

public class DeleteAppointmentByAdminRequest {
    
    @NotBlank(message = "La observación es obligatoria para cancelaciones de admin")
    private String adminObservation;

    public String getAdminObservation() {
        return adminObservation;
    }

    public void setAdminObservation(String adminObservation) {
        this.adminObservation = adminObservation;
    }
}