package uis.edu.co.appointments.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @NotBlank(message = "El mensaje no puede estar vacío")
    @Column(nullable = false)
    private String message;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(length = 50)
    private String type; 

    @Column(columnDefinition = "TEXT")
    private String metadata; 

    @Column(name = "scheduled_for")
    private LocalDateTime scheduledFor; 

    @Column(name = "is_sent", nullable = false)
    private Boolean isSent = false; 

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt = LocalDateTime.now();

    public NotificationType getNotificationType() {
        return NotificationType.fromString(this.type);
    }

    public void setNotificationType(NotificationType notificationType) {
        this.type = notificationType != null ? notificationType.name() : null;
    }
}