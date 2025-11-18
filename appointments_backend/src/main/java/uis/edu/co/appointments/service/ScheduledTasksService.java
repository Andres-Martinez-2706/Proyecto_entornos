package uis.edu.co.appointments.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import uis.edu.co.appointments.models.AppointmentStatus;

/**
 * Servicio para tareas programadas del sistema
 */
@Service
public class ScheduledTasksService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledTasksService.class);

    private final AppointmentService appointmentService;

    public ScheduledTasksService(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    /**
     * Tarea programada: Auto-completar citas pasadas cada hora
     * Se ejecuta a los 5 minutos de cada hora
     */
    @Scheduled(cron = "0 5 * * * *") // A los 5 minutos de cada hora
    public void autoCompleteExpiredAppointments() {
        logger.info("Iniciando auto-completado de citas pasadas...");
        
        try {
            appointmentService.autoCompleteAppointments();
            logger.info("Auto-completado de citas finalizado exitosamente");
        } catch (Exception e) {
            logger.error("Error en auto-completado de citas: {}", e.getMessage(), e);
        }
    }

    /**
     * Tarea de prueba/salud del sistema (opcional)
     * Se ejecuta cada 30 minutos
     */
    @Scheduled(fixedRate = 1800000) // 30 minutos
    public void healthCheck() {
        logger.debug("Health check: Tareas programadas activas");
    }
    /**
     * Tarea programada: Marcar citas como "en progreso" cuando llega su hora
     * Se ejecuta cada 5 minutos
     */
    @Scheduled(fixedRate = 300000) // 5 minutos
    public void markAppointmentsInProgress() {
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalTime now = java.time.LocalTime.now();
            
            // Obtener todas las citas programadas para hoy
            List<uis.edu.co.appointments.models.Appointment> appointments = 
                appointmentService.findAll(false).stream()
                    .filter(a -> a.getDate().equals(today))
                    .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                    .filter(a -> !a.getStartTime().isAfter(now) && !a.getEndTime().isBefore(now))
                    .collect(java.util.stream.Collectors.toList());
            
            for (uis.edu.co.appointments.models.Appointment appointment : appointments) {
                appointment.setStatus(AppointmentStatus.IN_PROGRESS);
                appointmentService.save(appointment);
                logger.debug("Cita ID {} marcada como EN PROGRESO", appointment.getId());
            }
            
            if (!appointments.isEmpty()) {
                logger.info("{} cita(s) marcada(s) como en progreso", appointments.size());
            }
        } catch (Exception e) {
            logger.error("Error al marcar citas en progreso: {}", e.getMessage());
        }
    }
}