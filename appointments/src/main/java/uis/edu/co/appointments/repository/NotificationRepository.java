package uis.edu.co.appointments.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdAndIsRead(Long userId, Boolean isRead);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId " +
           "AND n.isRead = false " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserId(@Param("userId") Long userId);

    long countByUserIdAndIsRead(Long userId, Boolean isRead);

    @Query("SELECT n FROM Notification n WHERE " +
           "n.scheduledFor IS NOT NULL AND " +
           "n.scheduledFor <= :currentTime AND " +
           "n.isSent = false")
    List<Notification> findPendingScheduledNotifications(@Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT COUNT(n) > 0 FROM Notification n WHERE " +
           "n.appointment.id = :appointmentId AND " +
           "n.type = :type")
    boolean existsByAppointmentIdAndType(
        @Param("appointmentId") Long appointmentId,
        @Param("type") String type
    );

    List<Notification> findByAppointmentId(Long appointmentId);

    List<Notification> findByType(String type);

    @Query("SELECT n FROM Notification n WHERE " +
           "n.isRead = true AND " +
           "n.createdAt < :cutoffDate")
    List<Notification> findOldReadNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);

    @Query("SELECT n FROM Notification n WHERE " +
           "n.user.id = :userId AND " +
           "n.type IN ('ADMIN_MODIFICATION', 'ADMIN_CANCELLATION') " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findAdminNotificationsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
}