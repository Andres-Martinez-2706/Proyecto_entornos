package uis.edu.co.appointments.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.Notification;
import uis.edu.co.appointments.models.NotificationType;
import uis.edu.co.appointments.models.User;

@Service
public class NotificationSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationSchedulerService.class);

    private final NotificationService notificationService;
    private final EmailService emailService;

    public NotificationSchedulerService(NotificationService notificationService,
                                       EmailService emailService) {
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    /**
     * Programar notificaciones para una cita nueva
     * - 1 día antes a las 9:00 AM
     * - X horas antes según preferencia del usuario
     */
    @Transactional
    public void scheduleAppointmentNotifications(Appointment appointment) {
        User user = appointment.getUser();
        LocalDate appointmentDate = appointment.getDate();
        LocalTime appointmentTime = appointment.getStartTime();

        // 1) Notificación 1 día antes a las 9:00 AM
        LocalDate dayBefore = appointmentDate.minusDays(1);
        LocalDateTime scheduledDayBefore = dayBefore.atTime(9, 0);

        // Solo programar si la fecha es futura
        if (scheduledDayBefore.isAfter(LocalDateTime.now())) {
            String messageDayBefore = String.format(
                    "Recordatorio: Tienes una cita mañana '%s' el %s a las %s.",
                    appointment.getTitle(),
                    appointmentDate,
                    appointmentTime
            );

            notificationService.createScheduledNotification(
                    user,
                    appointment,
                    messageDayBefore,
                    NotificationType.REMINDER_DAY,
                    scheduledDayBefore
            );
        }

        // 2) Notificación X horas antes según preferencia
        int hoursBefore = user.getReminderHours();
        LocalDateTime appointmentDateTime = appointmentDate.atTime(appointmentTime);
        LocalDateTime scheduledHoursBefore = appointmentDateTime.minusHours(hoursBefore);

        // Solo programar si la fecha es futura
        if (scheduledHoursBefore.isAfter(LocalDateTime.now())) {
            String messageHoursBefore = String.format(
                    "Recordatorio: Tu cita '%s' es en %d hora(s), a las %s.",
                    appointment.getTitle(),
                    hoursBefore,
                    appointmentTime
            );

            notificationService.createScheduledNotification(
                    user,
                    appointment,
                    messageHoursBefore,
                    NotificationType.REMINDER_HOUR,
                    scheduledHoursBefore
            );
        }

        logger.info("Notificaciones programadas para cita ID: {}", appointment.getId());
    }

    /**
     * Re-programar notificaciones cuando se modifica una cita
     * Elimina las antiguas y crea nuevas
     */
    @Transactional
    public void rescheduleAppointmentNotifications(Appointment appointment) {
        // Eliminar notificaciones programadas antiguas que no se han enviado
        notificationService.deleteScheduledNotificationsByAppointmentId(appointment.getId());

        // Programar nuevas
        scheduleAppointmentNotifications(appointment);
        
        logger.info("Notificaciones re-programadas para cita ID: {}", appointment.getId());
    }

    /**
     * Tarea programada: Enviar notificaciones pendientes cada 10 minutos
     */
    @Scheduled(fixedDelayString = "${scheduler.notification.check.interval:600000}") // 10 minutos por defecto
    @Transactional
    public void sendScheduledNotifications() {
        List<Notification> pending = notificationService.findPendingScheduledNotifications();

        if (pending.isEmpty()) {
            return;
        }

        logger.info("Procesando {} notificaciones programadas pendientes", pending.size());

        for (Notification notification : pending) {
            try {
                User user = notification.getUser();
                Appointment appointment = notification.getAppointment();
                String subject = "Recordatorio de cita";
                String message = notification.getMessage();

                // Enviar email con plantilla
                emailService.sendAppointmentEmail(
                    user.getEmail(),
                    subject,
                    user.getFullName(),
                    appointment.getTitle(),
                    appointment.getDate().toString(),
                    appointment.getStartTime() + " - " + appointment.getEndTime(),
                    message,
                    null,
                    "reminder"
                );

                // Marcar como enviada
                notificationService.markAsSent(notification.getId());

                logger.info("Notificación enviada: ID={}, Usuario={}", 
                        notification.getId(), user.getEmail());

            } catch (Exception e) {
                logger.error("Error enviando notificación ID {}: {}", 
                            notification.getId(), e.getMessage());
            }
        }

        logger.info("Finalizó envío de notificaciones programadas");
    }

    /**
     * Tarea programada: Limpiar notificaciones antiguas leídas (cada semana)
     */
    @Scheduled(cron = "0 0 2 * * SUN") // Domingos a las 2:00 AM
    @Transactional
    public void cleanOldNotifications() {
        int daysOld = 90; // Eliminar notificaciones leídas mayores a 90 días
        int deleted = notificationService.cleanOldReadNotifications(daysOld);
        
        if (deleted > 0) {
            logger.info("Limpieza automática: {} notificaciones antiguas eliminadas", deleted);
        }
    }
}