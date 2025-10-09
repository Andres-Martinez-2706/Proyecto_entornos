package uis.edu.co.appointments.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.Notification;
import uis.edu.co.appointments.models.NotificationType;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.NotificationRepository;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Obtener todas las notificaciones (solo para admin/debug)
     */
    public List<Notification> findAll() {
        return notificationRepository.findAll();
    }

    /**
     * Obtener notificación por ID
     */
    public Optional<Notification> findById(Long id) {
        return notificationRepository.findById(id);
    }

    /**
     * Obtener notificaciones de un usuario (ordenadas por fecha)
     */
    public List<Notification> findByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Obtener notificaciones no leídas de un usuario
     */
    public List<Notification> findUnreadByUserId(Long userId) {
        return notificationRepository.findUnreadByUserId(userId);
    }

    /**
     * Contar notificaciones no leídas
     */
    public long countUnreadByUserId(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    /**
     * Guardar notificación
     */
    public Notification save(Notification notification) {
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.now());
        }
        return notificationRepository.save(notification);
    }

    /**
     * Eliminar notificación
     */
    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }

    /**
     * Marcar notificación como leída
     */
    @Transactional
    public void markAsRead(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification notification = opt.get();
            notification.setIsRead(true);
            notificationRepository.save(notification);
            logger.debug("Notificación {} marcada como leída", id);
        }
    }

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     */
    @Transactional
    public void markAllAsReadByUserId(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        logger.info("Todas las notificaciones del usuario {} marcadas como leídas", userId);
    }

    /**
     * Crear notificación programada (para recordatorios automáticos)
     */
    public Notification createScheduledNotification(
            User user,
            Appointment appointment,
            String message,
            NotificationType type,
            LocalDateTime scheduledFor
    ) {
        // Verificar si ya existe una notificación de este tipo para esta cita
        if (notificationRepository.existsByAppointmentIdAndType(appointment.getId(), type.name())) {
            logger.warn("Ya existe notificación tipo {} para cita {}", type, appointment.getId());
            return null;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(appointment);
        notification.setMessage(message);
        notification.setNotificationType(type);
        notification.setScheduledFor(scheduledFor);
        notification.setIsSent(false);
        notification.setIsRead(false);

        Notification saved = notificationRepository.save(notification);
        logger.info("Notificación programada creada: tipo={}, para={}, cita={}",
                type, scheduledFor, appointment.getId());
        return saved;
    }

    /**
     * Obtener notificaciones programadas que deben enviarse
     */
    public List<Notification> findPendingScheduledNotifications() {
        return notificationRepository.findPendingScheduledNotifications(LocalDateTime.now());
    }

    /**
     * Marcar notificación como enviada
     */
    @Transactional
    public void markAsSent(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification notification = opt.get();
            notification.setIsSent(true);
            notificationRepository.save(notification);
            logger.debug("Notificación {} marcada como enviada", id);
        }
    }

    /**
     * Obtener notificaciones de admin para un usuario
     */
    public List<Notification> findAdminNotificationsByUserId(Long userId) {
        return notificationRepository.findAdminNotificationsByUserId(userId);
    }

    /**
     * Obtener notificaciones de una cita específica
     */
    public List<Notification> findByAppointmentId(Long appointmentId) {
        return notificationRepository.findByAppointmentId(appointmentId);
    }

    /**
     * Limpiar notificaciones antiguas leídas (tarea de mantenimiento)
     */
    @Transactional
    public int cleanOldReadNotifications(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        List<Notification> oldNotifications = notificationRepository.findOldReadNotifications(cutoffDate);
        
        int count = oldNotifications.size();
        if (count > 0) {
            notificationRepository.deleteAll(oldNotifications);
            logger.info("Eliminadas {} notificaciones antiguas leídas", count);
        }
        return count;
    }

    /**
     * Eliminar notificaciones programadas de una cita (útil al re-programar)
     */
    @Transactional
    public void deleteScheduledNotificationsByAppointmentId(Long appointmentId) {
        List<Notification> notifications = notificationRepository.findByAppointmentId(appointmentId);
        List<Notification> toDelete = notifications.stream()
                .filter(n -> n.getScheduledFor() != null && !n.getIsSent())
                .toList();
        
        if (!toDelete.isEmpty()) {
            notificationRepository.deleteAll(toDelete);
            logger.info("Eliminadas {} notificaciones programadas de cita {}", toDelete.size(), appointmentId);
        }
    }
}