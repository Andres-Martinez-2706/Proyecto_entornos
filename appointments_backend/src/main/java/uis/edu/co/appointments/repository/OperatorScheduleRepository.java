package uis.edu.co.appointments.repository;

import java.time.DayOfWeek;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.OperatorSchedule;

@Repository
public interface OperatorScheduleRepository extends JpaRepository<OperatorSchedule, Long> {
    
    List<OperatorSchedule> findByOperatorIdAndActive(Long operatorId, Boolean active);
    
    @Query("SELECT os FROM OperatorSchedule os WHERE os.operator.id = :operatorId " +
           "AND os.dayOfWeek = :dayOfWeek AND os.active = true")
    List<OperatorSchedule> findByOperatorAndDay(
        @Param("operatorId") Long operatorId,
        @Param("dayOfWeek") DayOfWeek dayOfWeek
    );
    
    @Query("SELECT COUNT(os) > 0 FROM OperatorSchedule os WHERE " +
           "os.operator.id = :operatorId AND os.dayOfWeek = :dayOfWeek AND " +
           "os.active = true AND os.id != :excludeId AND " +
           "((os.startTime < :endTime AND os.endTime > :startTime))")
    boolean hasScheduleConflict(
        @Param("operatorId") Long operatorId,
        @Param("dayOfWeek") DayOfWeek dayOfWeek,
        @Param("startTime") java.time.LocalTime startTime,
        @Param("endTime") java.time.LocalTime endTime,
        @Param("excludeId") Long excludeId
    );
    
    @Query("SELECT os FROM OperatorSchedule os WHERE os.operator.id = :operatorId " +
           "AND os.active = true ORDER BY os.dayOfWeek, os.startTime")
    List<OperatorSchedule> findActiveSchedulesByOperator(@Param("operatorId") Long operatorId);

    // Método sobrecargado sin excludeId (para creaciones nuevas)
    default boolean hasScheduleConflict(Long operatorId, DayOfWeek dayOfWeek,
                                       java.time.LocalTime startTime, 
                                       java.time.LocalTime endTime) {
        return hasScheduleConflict(operatorId, dayOfWeek, startTime, endTime, -1L);
    }
}