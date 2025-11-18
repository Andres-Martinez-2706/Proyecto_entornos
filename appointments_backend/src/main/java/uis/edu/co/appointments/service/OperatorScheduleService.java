package uis.edu.co.appointments.service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.OperatorSchedule;
import uis.edu.co.appointments.repository.OperatorScheduleRepository;
import uis.edu.co.appointments.repository.UserRepository;

@Service
public class OperatorScheduleService {

    private static final Logger logger = LoggerFactory.getLogger(OperatorScheduleService.class);

    private final OperatorScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    public OperatorScheduleService(OperatorScheduleRepository scheduleRepository,
                                  UserRepository userRepository) {
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
    }

    /**
     * Crear horario de operario
     */
    @Transactional
    public OperatorSchedule createSchedule(OperatorSchedule schedule) {
        // Validar que el usuario sea operario
        if (!userRepository.isOperator(schedule.getOperator().getId())) {
            throw new IllegalArgumentException("El usuario no es un operario");
        }

        // Validar horarios
        validateScheduleTimes(schedule);

        // Verificar conflictos
        if (hasScheduleConflict(schedule)) {
            throw new IllegalArgumentException(
                "Ya existe un horario que se solapa con este para el operario en ese día"
            );
        }

        OperatorSchedule saved = scheduleRepository.save(schedule);
        logger.info("Horario creado para operario ID: {}, día: {}", 
                   schedule.getOperator().getId(), schedule.getDayOfWeek());
        return saved;
    }

    /**
     * Obtener horarios de un operario
     */
    public List<OperatorSchedule> getOperatorSchedules(Long operatorId) {
        return scheduleRepository.findActiveSchedulesByOperator(operatorId);
    }

    /**
     * Obtener horarios de un día específico
     */
    public List<OperatorSchedule> getSchedulesForDay(Long operatorId, DayOfWeek day) {
        return scheduleRepository.findByOperatorAndDay(operatorId, day);
    }

    /**
     * Actualizar horario
     */
    @Transactional
    public OperatorSchedule updateSchedule(Long scheduleId, OperatorSchedule schedule) {
        Optional<OperatorSchedule> existing = scheduleRepository.findById(scheduleId);
        
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Horario no encontrado");
        }

        schedule.setId(scheduleId);
        schedule.setOperator(existing.get().getOperator()); // Mantener operario original

        validateScheduleTimes(schedule);

        // Verificar conflictos (excluyendo el horario actual)
        if (hasScheduleConflictExcluding(schedule, scheduleId)) {
            throw new IllegalArgumentException(
                "Ya existe un horario que se solapa con este"
            );
        }

        OperatorSchedule updated = scheduleRepository.save(schedule);
        logger.info("Horario actualizado ID: {}", scheduleId);
        return updated;
    }

    /**
     * Eliminar horario (soft delete)
     */
    @Transactional
    public void deleteSchedule(Long scheduleId) {
        Optional<OperatorSchedule> schedule = scheduleRepository.findById(scheduleId);
        
        if (schedule.isEmpty()) {
            throw new IllegalArgumentException("Horario no encontrado");
        }

        OperatorSchedule toDelete = schedule.get();
        toDelete.setActive(false);
        scheduleRepository.save(toDelete);
        
        logger.info("Horario desactivado ID: {}", scheduleId);
    }

    /**
     * Verificar si operario trabaja en un día
     */
    public boolean isOperatorWorkingOn(Long operatorId, DayOfWeek day) {
        List<OperatorSchedule> schedules = scheduleRepository.findByOperatorAndDay(operatorId, day);
        logger.info("    📋 Horarios encontrados para operario {} en {}: {}", 
                operatorId, day, schedules.size());
    schedules.forEach(s -> logger.info("      - {} a {}", s.getStartTime(), s.getEndTime()));
        return !schedules.isEmpty();
    }

    /**
     * Verificar si un horario está dentro de las horas de trabajo del operario
     */
    public boolean isWithinOperatorSchedule(Long operatorId, DayOfWeek day, 
                                           LocalTime startTime, LocalTime endTime) {
        List<OperatorSchedule> schedules = scheduleRepository.findByOperatorAndDay(operatorId, day);
        logger.info("    🔍 Verificando si {} - {} está dentro de algún horario", 
                startTime, endTime);
        
        for (OperatorSchedule schedule : schedules) {
            // Verificar si el rango solicitado está completamente dentro del horario
            if (!startTime.isBefore(schedule.getStartTime()) && 
                !endTime.isAfter(schedule.getEndTime())) {
                return true;
            }
        }
        
        return false;
    }

    // ==================== MÉTODOS PRIVADOS DE VALIDACIÓN ====================

    private void validateScheduleTimes(OperatorSchedule schedule) {
        if (schedule.getStartTime() == null || schedule.getEndTime() == null) {
            throw new IllegalArgumentException("Las horas de inicio y fin son obligatorias");
        }

        if (!schedule.getStartTime().isBefore(schedule.getEndTime())) {
            throw new IllegalArgumentException(
                "La hora de inicio debe ser anterior a la hora de fin"
            );
        }

        if (schedule.getDayOfWeek() == null) {
            throw new IllegalArgumentException("El día de la semana es obligatorio");
        }
    }

    private boolean hasScheduleConflict(OperatorSchedule schedule) {
        return scheduleRepository.hasScheduleConflict(
            schedule.getOperator().getId(),
            schedule.getDayOfWeek(),
            schedule.getStartTime(),
            schedule.getEndTime(),
            0L // Sin excluir ningún ID
        );
    }

    private boolean hasScheduleConflictExcluding(OperatorSchedule schedule, Long excludeId) {
        return scheduleRepository.hasScheduleConflict(
            schedule.getOperator().getId(),
            schedule.getDayOfWeek(),
            schedule.getStartTime(),
            schedule.getEndTime(),
            excludeId
        );
    }
}