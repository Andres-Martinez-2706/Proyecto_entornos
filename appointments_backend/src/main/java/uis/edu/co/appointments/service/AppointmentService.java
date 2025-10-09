package uis.edu.co.appointments.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.Notification;
import uis.edu.co.appointments.models.NotificationType;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.AppointmentRepository;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final NotificationSchedulerService schedulerService;
    private final EmailService emailService;
    private final UserService userService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              NotificationService notificationService,
                              @Lazy NotificationSchedulerService schedulerService,
                              EmailService emailService,
                              UserService userService) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.schedulerService = schedulerService;
        this.emailService = emailService;
        this.userService = userService;
    }

    /**
     * Obtener todas las citas (con filtro de eliminadas)
     */
    public List<Appointment> findAll(boolean includeDeleted) {
        return appointmentRepository.findAllWithDeletedFilter(includeDeleted);
    }

    public List<Appointment> findAll() {
        return findAll(true); // Por defecto incluye eliminadas
    }

    public Optional<Appointment> findById(Long id) {
        return appointmentRepository.findById(id);
    }

    /**
     * Obtener citas de un usuario (con filtro de eliminadas)
     */
    public List<Appointment> findByUserId(Long userId, boolean includeDeleted) {
        return appointmentRepository.findByUserIdWithDeletedFilter(userId, includeDeleted);
    }

    public List<Appointment> findByUserId(Long userId) {
        return findByUserId(userId, true); // Por defecto incluye eliminadas
    }

    /**
     * Obtener citas próximas (próximos 7 días)
     */
    public List<Appointment> getUpcomingAppointments(Long userId, boolean isAdmin) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(7);

        if (isAdmin) {
            return appointmentRepository.findUpcomingAppointments(today, endDate);
        } else {
            return appointmentRepository.findUpcomingByUserId(userId, today, endDate);
        }
    }

    /**
     * Guardar o actualizar cita (usuario normal)
     * Crea notificaciones programadas automáticamente
     */
    @Transactional
    public Appointment save(Appointment appointment) {
        boolean isNew = (appointment.getId() == null);

        // 1) Validar y preparar usuario
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
        appointment.setDeleted(false); // Asegurar que no esté marcada como eliminada

        // 4) Guardar cita
        Appointment saved = appointmentRepository.save(appointment);

        // 5) Programar notificaciones automáticas (1 día antes y X horas antes)
        if (isNew) {
            schedulerService.scheduleAppointmentNotifications(saved);
            logger.info("Notificaciones programadas para cita ID: {}", saved.getId());
        } else {
            // Si se modificó, re-programar notificaciones
            schedulerService.rescheduleAppointmentNotifications(saved);
            logger.info("Notificaciones re-programadas para cita ID: {}", saved.getId());
        }

        // 6) Crear notificación en BD (confirmación de creación/modificación)
        String action = isNew ? "creada" : "modificada";
        String subject = "Cita " + action;
        String text = String.format("Tu cita '%s' ha sido %s para el %s de %s a %s.",
                saved.getTitle(), action,
                saved.getDate(),
                saved.getStartTime(),
                saved.getEndTime());

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(saved);
        notification.setMessage(text);
        notification.setNotificationType(NotificationType.SYSTEM);
        notification.setIsRead(false);
        notification.setIsSent(true); // Se enviará email inmediatamente
        notificationService.save(notification);

        // 7) Enviar email inmediato (no debe causar rollback si falla)
        // 7) Enviar email inmediato con plantilla HTML
        try {
            String emailType = isNew ? "created" : "modified";
            emailService.sendAppointmentEmail(
                user.getEmail(),
                subject,
                user.getFullName(),
                saved.getTitle(),
                saved.getDate().toString(),
                saved.getStartTime() + " - " + saved.getEndTime(),
                text,
                null,
                emailType
            );
            logger.info("Email enviado a {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("No se pudo enviar email a {}: {}", user.getEmail(), e.getMessage());
        }

        return saved;
    }

    /**
     * Guardar o modificar cita por ADMIN con observación
     */
    @Transactional
    public Appointment saveByAdmin(Appointment appointment, String adminObservation, User admin) {
        if (!"admin".equalsIgnoreCase(admin.getRole().getName())) {
            throw new IllegalArgumentException("Solo administradores pueden usar este método.");
        }

        boolean isNew = (appointment.getId() == null);

        // Validar usuario
        if (appointment.getUser() == null || appointment.getUser().getId() == null) {
            throw new IllegalArgumentException("La cita debe incluir el usuario (user.id).");
        }
        Long userId = appointment.getUser().getId();
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + userId));
        appointment.setUser(user);

        // Validaciones
        validateAppointment(appointment);

        // Agregar observación del admin
        appointment.setAdminObservation(adminObservation);
        appointment.setUpdatedAt(LocalDateTime.now());
        appointment.setDeleted(false);

        // Guardar
        Appointment saved = appointmentRepository.save(appointment);

        // Programar/re-programar notificaciones automáticas
        if (isNew) {
            schedulerService.scheduleAppointmentNotifications(saved);
        } else {
            schedulerService.rescheduleAppointmentNotifications(saved);
        }

        // Notificación de modificación por admin
        String subject = "Cita modificada por administrador";
        String text = String.format(
            "Tu cita '%s' ha sido modificada por un administrador.\n\n" +
            "Fecha: %s\nHora: %s a %s\n\n" +
            "Observación del administrador:\n%s",
            saved.getTitle(),
            saved.getDate(),
            saved.getStartTime(),
            saved.getEndTime(),
            adminObservation != null ? adminObservation : "Sin observaciones"
        );

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(saved);
        notification.setMessage(text);
        notification.setNotificationType(NotificationType.ADMIN_MODIFICATION);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Enviar email inmediato
        // Enviar email inmediato con plantilla
        try {
            emailService.sendAppointmentEmail(
                user.getEmail(),
                subject,
                user.getFullName(),
                saved.getTitle(),
                saved.getDate().toString(),
                saved.getStartTime() + " - " + saved.getEndTime(),
                "Tu cita ha sido modificada por un administrador.",
                adminObservation,
                "modified"
            );
            logger.info("Email de modificación admin enviado a {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("Error enviando email a {}: {}", user.getEmail(), e.getMessage());
        }

        return saved;
    }

    /**
     * Eliminar cita (soft-delete)
     */
    @Transactional
    public void delete(Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Cita no encontrada con id: " + id);
        }
        Appointment appt = opt.get();
        User user = appt.getUser();

        // Marcar como eliminada (soft-delete)
        appt.setDeleted(true);
        appt.setDeletedAt(LocalDateTime.now());
        appt.setStatus("Cancelada");
        appointmentRepository.save(appt);

        // Notificación de cancelación
        String subject = "Cita cancelada";
        String text = String.format("Tu cita '%s' para el %s de %s a %s ha sido cancelada.",
                appt.getTitle(),
                appt.getDate(),
                appt.getStartTime(),
                appt.getEndTime());

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(appt);
        notification.setMessage(text);
        notification.setNotificationType(NotificationType.SYSTEM);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Enviar email
        // Enviar email con plantilla
        try {
            emailService.sendAppointmentEmail(
                user.getEmail(),
                subject,
                user.getFullName(),
                appt.getTitle(),
                appt.getDate().toString(),
                appt.getStartTime() + " - " + appt.getEndTime(),
                text,
                null,
                "cancelled"
            );
            logger.info("Email de cancelación enviado a {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("Error enviando email a {}: {}", user.getEmail(), e.getMessage());
        }

        logger.info("Cita ID {} marcada como eliminada (soft-delete)", id);
    }

    /**
     * Eliminar cita por ADMIN con observación
     */
    @Transactional
    public void deleteByAdmin(Long id, String adminObservation, User admin) {
        if (!"admin".equalsIgnoreCase(admin.getRole().getName())) {
            throw new IllegalArgumentException("Solo administradores pueden usar este método.");
        }

        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Cita no encontrada con id: " + id);
        }
        Appointment appt = opt.get();
        User user = appt.getUser();

        // Marcar como eliminada con observación
        appt.setDeleted(true);
        appt.setDeletedAt(LocalDateTime.now());
        appt.setStatus("Cancelada");
        appt.setAdminObservation(adminObservation);
        appt.setCancelledBy(admin);
        appointmentRepository.save(appt);

        // Notificación de cancelación por admin
        String subject = "Cita cancelada por administrador";
        String text = String.format(
            "Tu cita '%s' para el %s de %s a %s ha sido cancelada por un administrador.\n\n" +
            "Motivo:\n%s",
            appt.getTitle(),
            appt.getDate(),
            appt.getStartTime(),
            appt.getEndTime(),
            adminObservation != null ? adminObservation : "Sin motivo especificado"
        );

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(appt);
        notification.setMessage(text);
        notification.setNotificationType(NotificationType.ADMIN_CANCELLATION);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Enviar email
        // Enviar email con plantilla
        try {
            emailService.sendAppointmentEmail(
                user.getEmail(),
                subject,
                user.getFullName(),
                appt.getTitle(),
                appt.getDate().toString(),
                appt.getStartTime() + " - " + appt.getEndTime(),
                "Tu cita ha sido cancelada por un administrador.",
                adminObservation,
                "cancelled"
            );
            logger.info("Email de cancelación admin enviado a {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("Error enviando email a {}: {}", user.getEmail(), e.getMessage());
        }

        logger.info("Cita ID {} cancelada por admin: {}", id, admin.getEmail());
    }

    /**
     * Marcar cita como completada/terminada
     */
    @Transactional
    public void markAsCompleted(Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Cita no encontrada con id: " + id);
        }
        Appointment appt = opt.get();
        appt.setStatus("Terminada");
        appointmentRepository.save(appt);
        logger.info("Cita ID {} marcada como terminada", id);
    }

    /**
     * Método programado: Auto-completar citas pasadas
     * Se ejecuta periódicamente desde un @Scheduled
     */
    @Transactional
    public void autoCompleteAppointments() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Appointment> toComplete = appointmentRepository.findAppointmentsToComplete(today, now);

        for (Appointment appt : toComplete) {
            appt.setStatus("Terminada");
            appointmentRepository.save(appt);
            logger.info("Auto-completada cita ID: {}", appt.getId());
        }

        if (!toComplete.isEmpty()) {
            logger.info("Total de citas auto-completadas: {}", toComplete.size());
        }
    }

    // --- Validaciones ---
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

        // Validar conflictos de horario (solo citas activas, no eliminadas)
        Long userId = newAppointment.getUser().getId();
        LocalDate date = newAppointment.getDate();

        List<Appointment> sameDayAppointments = appointmentRepository.findActiveByUserIdAndDate(userId, date);

        for (Appointment existing : sameDayAppointments) {
            if (newAppointment.getId() != null && existing.getId().equals(newAppointment.getId())) {
                continue; // Ignorar la misma cita si se está editando
            }
            boolean overlap = start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime());
            if (overlap) {
                throw new IllegalArgumentException("Conflicto: ya existe una cita en ese rango horario.");
            }
        }
    }
}