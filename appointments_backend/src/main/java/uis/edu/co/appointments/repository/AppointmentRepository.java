package uis.edu.co.appointments.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // Métodos existentes
    List<Appointment> findByUserIdAndDate(Long userId, LocalDate date);
    List<Appointment> findByUserId(Long userId);

    @Query("SELECT a FROM Appointment a WHERE a.user.id = :userId AND (:showDeleted = true OR a.deleted = false)")
    List<Appointment> findByUserIdWithDeletedFilter(@Param("userId") Long userId, @Param("showDeleted") boolean showDeleted);

    @Query("SELECT a FROM Appointment a WHERE :showDeleted = true OR a.deleted = false")
    List<Appointment> findAllWithDeletedFilter(@Param("showDeleted") boolean showDeleted);

    @Query("SELECT a FROM Appointment a WHERE a.user.id = :userId " +
           "AND a.date BETWEEN :startDate AND :endDate " +
           "AND a.deleted = false " +
           "ORDER BY a.date, a.startTime")
    List<Appointment> findUpcomingByUserId(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT a FROM Appointment a WHERE a.date BETWEEN :startDate AND :endDate " +
           "AND a.deleted = false " +
           "ORDER BY a.date, a.startTime")
    List<Appointment> findUpcomingAppointments(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );


    @Query("SELECT a FROM Appointment a WHERE " +
            "a.deleted = false AND " +
            "(a.status = 'SCHEDULED' OR a.status = 'IN_PROGRESS') AND " +
            "(a.date < :currentDate OR " +
            "(a.date = :currentDate AND a.endTime < :currentTime))")
    List<Appointment> findAppointmentsToComplete(
        @Param("currentDate") LocalDate currentDate,
        @Param("currentTime") LocalTime currentTime
    );


    @Query("SELECT a FROM Appointment a WHERE a.user.id = :userId " +
           "AND a.date = :date " +
           "AND a.deleted = false")
    List<Appointment> findActiveByUserIdAndDate(
        @Param("userId") Long userId,
        @Param("date") LocalDate date
    );


    @Query("SELECT a FROM Appointment a WHERE " +
           "a.deleted = false AND " +
           "a.status IN ('Pendiente', 'Confirmada') AND " +
           "a.date = :targetDate")
    List<Appointment> findAppointmentsForDate(@Param("targetDate") LocalDate targetDate);


    @Query("SELECT COUNT(a) FROM Appointment a WHERE " +
           "a.user.id = :userId AND " +
           "a.deleted = false AND " +
           "a.date BETWEEN :startDate AND :endDate")
    long countActiveAppointmentsByUserAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // Citas por operario
    List<Appointment> findByOperatorIdAndDeleted(Long operatorId, Boolean deleted);
    
    @Query("SELECT a FROM Appointment a WHERE a.operator.id = :operatorId " +
           "AND (:showDeleted = true OR a.deleted = false)")
    List<Appointment> findByOperatorIdWithDeletedFilter(
        @Param("operatorId") Long operatorId, 
        @Param("showDeleted") boolean showDeleted
    );
    
    // Citas pendientes de completar por operario
    @Query("SELECT a FROM Appointment a WHERE a.operator.id = :operatorId " +
        "AND (a.status = 'SCHEDULED' OR a.status = 'IN_PROGRESS') " +
        "AND (a.date < :currentDate OR " +
        "(a.date = :currentDate AND a.endTime <= :currentTime)) " +
        "AND a.completedByOperator = false " +
        "AND a.deleted = false " +
        "ORDER BY a.date DESC, a.endTime DESC")
    List<Appointment> findPendingCompletionByOperator(
        @Param("operatorId") Long operatorId,
        @Param("currentDate") LocalDate currentDate,
        @Param("currentTime") LocalTime currentTime
    );
    
    // Verificar disponibilidad de operario
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.operator.id = :operatorId " +
           "AND a.date = :date AND a.deleted = false " +
           "AND a.status NOT IN ('CANCELLED', 'FAILED') " +
           "AND ((a.startTime < :endTime AND a.endTime > :startTime))")
    long countOverlappingAppointments(
        @Param("operatorId") Long operatorId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
    
    // Estadísticas - citas completadas por operario
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.operator.id = :operatorId " +
           "AND a.status = 'COMPLETED' AND a.date BETWEEN :startDate AND :endDate")
    long countCompletedByOperator(
        @Param("operatorId") Long operatorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Estadísticas - citas fallidas por usuario
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.user.id = :userId " +
           "AND a.attendanceStatus = 'NOT_ATTENDED' " +
           "AND a.date BETWEEN :startDate AND :endDate")
    long countFailedByUser(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Estadísticas - total de citas por operario
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.operator.id = :operatorId " +
           "AND a.status = 'COMPLETED' AND a.deleted = false " +
           "AND a.date BETWEEN :startDate AND :endDate")
    long countTotalByOperator(
        @Param("operatorId") Long operatorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Promedio de calificaciones de operario
    @Query("SELECT AVG(a.userRating) FROM Appointment a WHERE a.operator.id = :operatorId " +
           "AND a.userRating IS NOT NULL " +
           "AND a.date BETWEEN :startDate AND :endDate")
    Double getAverageOperatorRating(
        @Param("operatorId") Long operatorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Promedio de calificaciones de usuario
    @Query("SELECT AVG(a.operatorRating) FROM Appointment a WHERE a.user.id = :userId " +
           "AND a.operatorRating IS NOT NULL " +
           "AND a.date BETWEEN :startDate AND :endDate")
    Double getAverageUserRating(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT a FROM Appointment a WHERE " +
        "(:userId IS NULL OR " +
        " (CASE WHEN :roleName = 'ADMIN' THEN true " +
        "       WHEN :roleName = 'OPERARIO' THEN a.operator.id = :userId " +
        "       ELSE a.user.id = :userId END)) " +
        "AND a.deleted = false " +
        "AND (:query IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
        "     OR LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
        "AND (:categoryId IS NULL OR a.category.id = :categoryId) " +
        "AND (:operatorId IS NULL OR a.operator.id = :operatorId) " +
        "AND (:status IS NULL OR a.status = :status) " +
        "AND (:startDate IS NULL OR a.date >= :startDate) " +
        "AND (:endDate IS NULL OR a.date <= :endDate)")
    Page<Appointment> searchAppointments(
        @Param("userId") Long userId,
        @Param("roleName") String roleName,
        @Param("query") String query,
        @Param("categoryId") Long categoryId,
        @Param("operatorId") Long operatorId,
        @Param("status") AppointmentStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
}