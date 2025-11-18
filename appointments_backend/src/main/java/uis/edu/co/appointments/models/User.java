package uis.edu.co.appointments.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.hibernate.annotations.Type;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre completo es obligatorio")
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Email(message = "Debe ser un correo válido")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "La contraseña no puede estar vacía")
    @Column(name = "password_hash", nullable = false)
    @JsonIgnore
    private String passwordHash;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @Min(value = 1, message = "La notificación debe ser al menos 1 hora antes")
    @Max(value = 6, message = "La notificación debe ser máximo 6 horas antes")
    @Column(name = "reminder_hours", nullable = false)
    private Integer reminderHours = 1;

    // ========== NUEVOS CAMPOS ==========
    
    @Column(name = "email_notifications_enabled", nullable = false)
    private Boolean emailNotificationsEnabled = true;

    @Column(name = "in_app_notifications_enabled", nullable = false)
    private Boolean inAppNotificationsEnabled = true;

    @Column(name = "reminder_day_before_enabled", nullable = false)
    private Boolean reminderDayBeforeEnabled = true;

    @Column(name = "reminder_hours_before_enabled", nullable = false)
    private Boolean reminderHoursBeforeEnabled = true;

    @Type(JsonType.class)
    @Column(name = "notification_types_enabled", columnDefinition = "jsonb")
    @JsonProperty("notificationTypesEnabled")
    private List<String> notificationTypesEnabled = Arrays.asList(
        "SYSTEM",
        "ADMIN_MODIFICATION",
        "ADMIN_CANCELLATION",
        "REMINDER_DAY",
        "REMINDER_HOUR",
        "OPERATOR_ASSIGNED",
        "OPERATOR_CHANGED",
        "COMPLETION_REQUIRED",
        "RATING_RECEIVED"
    );

    @Column(name = "total_appointments")
    private Integer totalAppointments = 0;

    @Column(name = "attended_appointments")
    private Integer attendedAppointments = 0;

    @Column(name = "failed_appointments")
    private Integer failedAppointments = 0;

    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"user", "notifications"})
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "operator", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"operator"})
    private List<OperatorSchedule> operatorSchedules;

    @ManyToMany
    @JoinTable(
        name = "operator_categories",
        joinColumns = @JoinColumn(name = "operator_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @JsonIgnoreProperties({"operators"})
    private List<Category> operatorCategories = new ArrayList<>();

    
}