package uis.edu.co.appointments.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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
}