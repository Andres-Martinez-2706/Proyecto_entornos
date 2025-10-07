package uis.edu.co.appointments.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.Notification;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.AppointmentRepository;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserService userService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              NotificationService notificationService,
                              EmailService emailService,
                              UserService userService) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.userService = userService;
    }

    public List<Appointment> findAll() {
        return appointmentRepository.findAll();
    }

    public Optional<Appointment> findById(Long id) {
        return appointmentRepository.findById(id);
    }

    /**
     * Save funciona tanto para crear como para actualizar.
     * - valida duración mínima y solapamientos por usuario
     * - actualiza updatedAt
     * - crea notificación en BD
     * - intenta enviar email (si falla, solo se registra el error)
     */
    @Transactional
    public Appointment save(Appointment appointment) {
        boolean isNew = (appointment.getId() == null);

        // 1) Asegurarnos de tener el usuario gestionado (evita transiente)
        if (appointment.getUser() == null || appointment.getUser().getId() == null) {
            throw new IllegalArgumentException("La cita debe incluir el usuario (user.id).");
        }
        Long userId = appointment.getUser().getId();
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + userId));
        appointment.setUser(user);

        // 2) Validaciones (duración mínima y solapamientos)
        validateAppointment(appointment);

        // 3) Actualizar timestamp
        appointment.setUpdatedAt(LocalDateTime.now());

        // 4) Guardar cita
        Appointment saved = appointmentRepository.save(appointment);

        // 5) Crear notificación en BD
        String subject;
        String text;
        if (isNew) {
            subject = "Cita creada";
            text = String.format("Tu cita '%s' ha sido creada para el %s de %s a %s.",
                    saved.getTitle(),
                    saved.getDate().toString(),
                    saved.getStartTime().toString(),
                    saved.getEndTime().toString());
        } else {
            subject = "Cita modificada";
            text = String.format("Tu cita '%s' ha sido modificada para el %s de %s a %s.",
                    saved.getTitle(),
                    saved.getDate().toString(),
                    saved.getStartTime().toString(),
                    saved.getEndTime().toString());
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(saved);
        notification.setMessage(text);
        notification.setIsRead(false);
        notificationService.save(notification);

        // 6) Intentar enviar email (no debe producir rollback si falla)
        try {
            emailService.sendEmail(user.getEmail(), subject, text);
            logger.info("Email enviado a {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("No se pudo enviar email a {}: {}", user.getEmail(), e.getMessage());
            // no propagamos la excepción para no romper la transacción/operación principal
        }

        return saved;
    }

    /**
     * Eliminar: antes de borrar, crear notificación de cancelación y enviar email.
     */
    @Transactional
    public void delete(Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Cita no encontrada con id: " + id);
        }
        Appointment appt = opt.get();
        User user = appt.getUser();

        String subject = "Cita cancelada";
        String text = String.format("Tu cita '%s' para el %s de %s a %s ha sido cancelada.",
                appt.getTitle(),
                appt.getDate().toString(),
                appt.getStartTime().toString(),
                appt.getEndTime().toString());

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(appt);
        notification.setMessage(text);
        notification.setIsRead(false);
        notificationService.save(notification);

        try {
            emailService.sendEmail(user.getEmail(), subject, text);
            logger.info("Email de cancelación enviado a {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("Fallo envío email de cancelación a {}: {}", user.getEmail(), e.getMessage());
        }

        appointmentRepository.deleteById(id);
    }

    // --- Validaciones de horario y duración mínima ---
    private void validateAppointment(Appointment newAppointment) {
        LocalTime start = newAppointment.getStartTime();
        LocalTime end = newAppointment.getEndTime();

        if (start == null || end == null) {
            throw new IllegalArgumentException("startTime y endTime son obligatorios.");
        }

        // Validar duración mínima de 5 minutos
        if (end.isBefore(start.plusMinutes(5))) {
            throw new IllegalArgumentException("La cita debe durar al menos 5 minutos.");
        }

        // Validar conflictos de horario por usuario (no considera solapamiento si comparten borde)
        Long userId = newAppointment.getUser().getId();
        LocalDate date = newAppointment.getDate();

        List<Appointment> sameDayAppointments = appointmentRepository.findByUserIdAndDate(userId, date);

        for (Appointment existing : sameDayAppointments) {
            if (newAppointment.getId() != null && existing.getId().equals(newAppointment.getId())) {
                continue; // ignorar la misma cita si se está editando
            }
            boolean overlap = start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime());
            if (overlap) {
                throw new IllegalArgumentException("Conflicto: ya existe una cita en ese rango horario.");
            }
        }
    }
    public List<Appointment> findByUserId(Long userId) {
        return appointmentRepository.findByUserId(userId);
    }

}
