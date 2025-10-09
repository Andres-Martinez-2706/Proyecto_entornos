package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.NotNull;
import uis.edu.co.appointments.models.Appointment;

public class UpdateAppointmentByAdminRequest {
    
    @NotNull(message = "La cita es obligatoria")
    private Appointment appointment;
    
    private String adminObservation;

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public String getAdminObservation() {
        return adminObservation;
    }

    public void setAdminObservation(String adminObservation) {
        this.adminObservation = adminObservation;
    }
}