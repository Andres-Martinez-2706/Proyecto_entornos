package uis.edu.co.appointments.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {
    
    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(min = 3, max = 150, message = "El nombre debe tener entre 3 y 150 caracteres")
    private String fullName;
    
    @Email(message = "Email inválido")
    @NotBlank(message = "El email es obligatorio")
    private String email;
    
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;  // Opcional en updates
    
    private String role;  // ← Como String: "ADMIN", "OPERARIO", "USUARIO"
    
    private Boolean active;
    
    // Constructors
    public UpdateUserRequest() {}
    
    // Getters y Setters
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
}