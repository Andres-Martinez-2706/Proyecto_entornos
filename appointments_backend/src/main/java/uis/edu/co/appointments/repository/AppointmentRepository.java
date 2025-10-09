package uis.edu.co.appointments.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Appointment;

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
           "(a.status = 'Pendiente' OR a.status = 'Confirmada') AND " +
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
}