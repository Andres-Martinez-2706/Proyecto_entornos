package uis.edu.co.appointments.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final uis.edu.co.appointments.repository.AppointmentRepository appointmentRepository;

    public NotificationSchedulerService(NotificationService notificationService,
                                       EmailService emailService,
                                       uis.edu.co.appointments.repository.AppointmentRepository appointmentRepository) {
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.appointmentRepository = appointmentRepository;
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

    /**
     * Tarea programada: Recordar a operarios completar registros pendientes
     * Se ejecuta cada 12 horas
     */
    @Scheduled(fixedDelayString = "43200000") // 12 horas
    @Transactional
    public void remindOperatorsPendingCompletion() {
        logger.info("Verificando operarios con citas pendientes de completar...");

        // Obtener todos los operarios
        List<uis.edu.co.appointments.models.User> operators = 
            appointmentRepository.findAll().stream()
                .filter(a -> a.getOperator() != null)
                .map(uis.edu.co.appointments.models.Appointment::getOperator)
                .distinct()
                .collect(Collectors.toList());

        for (uis.edu.co.appointments.models.User operator : operators) {
            List<uis.edu.co.appointments.models.Appointment> pending = 
                appointmentRepository.findPendingCompletionByOperator(
                    operator.getId(), LocalDate.now(), LocalTime.now()
                );

            if (!pending.isEmpty()) {
                // Preparar lista de citas para el email
                List<Map<String, String>> appointmentsList = pending.stream()
                    .map(apt -> {
                        Map<String, String> map = new HashMap<>();
                        map.put("title", apt.getTitle());
                        map.put("date", apt.getDate().toString());
                        map.put("time", apt.getStartTime() + " - " + apt.getEndTime());
                        map.put("userName", apt.getUser().getFullName());
                        return map;
                    })
                    .collect(Collectors.toList());

                // Enviar email
                try {
                    emailService.sendCompletionReminderEmail(
                        operator.getEmail(),
                        operator.getFullName(),
                        appointmentsList
                    );
                    logger.info("Recordatorio enviado a operario: {}", operator.getEmail());
                } catch (Exception e) {
                    logger.error("Error enviando recordatorio a {}: {}", 
                               operator.getEmail(), e.getMessage());
                }

                // Crear notificación in-app
                uis.edu.co.appointments.models.Notification notification = 
                    new uis.edu.co.appointments.models.Notification();
                notification.setUser(operator);
                notification.setMessage(String.format(
                    "Tienes %d cita(s) pendiente(s) de completar su registro.",
                    pending.size()
                ));
                notification.setNotificationType(
                    uis.edu.co.appointments.models.NotificationType.COMPLETION_REQUIRED
                );
                notification.setIsRead(false);
                notification.setIsSent(true);
                notificationService.save(notification);
            }
        }

        logger.info("Proceso de recordatorios a operarios finalizado");
    }
     /**
     * Programar notificaciones para una cita nueva (CON VALIDACIÓN DE PREFERENCIAS)
     */
    @Transactional
    public void scheduleAppointmentNotifications(Appointment appointment) {
        User user = appointment.getUser();
        LocalDate appointmentDate = appointment.getDate();
        LocalTime appointmentTime = appointment.getStartTime();

        // 1) Notificación 1 día antes a las 9:00 AM
        if (user.getReminderDayBeforeEnabled() && 
            user.getNotificationTypesEnabled().contains("REMINDER_DAY")) {
            
            LocalDate dayBefore = appointmentDate.minusDays(1);
            LocalDateTime scheduledDayBefore = dayBefore.atTime(9, 0);

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
        }

        // 2) Notificación X horas antes según preferencia
        if (user.getReminderHoursBeforeEnabled() && 
            user.getNotificationTypesEnabled().contains("REMINDER_HOUR")) {
            
            int hoursBefore = user.getReminderHours();
            LocalDateTime appointmentDateTime = appointmentDate.atTime(appointmentTime);
            LocalDateTime scheduledHoursBefore = appointmentDateTime.minusHours(hoursBefore);

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
        }

        logger.info("Notificaciones programadas para cita ID: {}", appointment.getId());
    }
    
    /**
     * Enviar notificaciones pendientes (CON VALIDACIÓN DE PREFERENCIAS)
     */
    @Scheduled(fixedDelayString = "${scheduler.notification.check.interval:600000}")
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
                
                // Verificar preferencias del usuario
                if (!user.getNotificationTypesEnabled().contains(notification.getType())) {
                    logger.info("Notificación {} omitida - tipo deshabilitado por usuario", 
                               notification.getId());
                    notificationService.markAsSent(notification.getId());
                    continue;
                }
                
                // Enviar email solo si está habilitado
                if (user.getEmailNotificationsEnabled()) {
                    String subject = "Recordatorio de cita";
                    String message = notification.getMessage();

                    emailService.sendAppointmentEmail(
                        user.getEmail(),
                        subject,
                        user.getFullName(),
                        appointment.getTitle(),
                        appointment.getDate().toString(),
                        appointment.getStartTime() + " - " + appointment.getEndTime(),
                        message,
                        null,
                        appointment.getOperator() != null ? appointment.getOperator().getFullName() : "",
                        "reminder"
                    );
                }
                
                // La notificación in-app ya está creada, solo marcamos como enviada
                if (user.getInAppNotificationsEnabled()) {
                    notificationService.markAsSent(notification.getId());
                } else {
                    // Si no quiere in-app, eliminamos la notificación
                    notificationService.delete(notification.getId());
                }

                logger.info("Notificación enviada: ID={}, Usuario={}", 
                           notification.getId(), user.getEmail());

            } catch (Exception e) {
                logger.error("Error enviando notificación ID {}: {}", 
                            notification.getId(), e.getMessage());
            }
        }

        logger.info("Finalizó envío de notificaciones programadas");
    }
}