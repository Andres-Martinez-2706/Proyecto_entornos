package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateEmailRequest {
    
    @NotBlank(message = "El nuevo email es obligatorio")
    @Email(message = "Debe ser un email válido")
    private String newEmail;

    public String getNewEmail() {
        return newEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
    }
}