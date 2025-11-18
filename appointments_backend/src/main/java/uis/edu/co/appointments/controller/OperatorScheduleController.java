package uis.edu.co.appointments.controller;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import uis.edu.co.appointments.dto.ApiResponse;
import uis.edu.co.appointments.models.OperatorSchedule;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.security.UserDetailsImpl;
import uis.edu.co.appointments.service.OperatorScheduleService;
import uis.edu.co.appointments.service.UserService;

@RestController
@RequestMapping("/api/operator-schedules")
public class OperatorScheduleController {

    private final OperatorScheduleService scheduleService;
    @SuppressWarnings("unused")
    private final UserService userService;

    public OperatorScheduleController(OperatorScheduleService scheduleService,
                                     UserService userService) {
        this.scheduleService = scheduleService;
        this.userService = userService;
    }

    /**
     * Obtener horarios del operario autenticado
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<List<OperatorSchedule>> getMySchedules(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<OperatorSchedule> schedules = scheduleService.getOperatorSchedules(userDetails.getId());
        return ResponseEntity.ok(schedules);
    }

    /**
     * Obtener horarios de un operario específico (admin o el mismo operario)
     */
    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<?> getOperatorSchedules(
            @PathVariable Long operatorId,
            Authentication authentication) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.getRoleName());
        
        // Solo admin o el mismo operario puede ver sus horarios
        if (!isAdmin && !userDetails.getId().equals(operatorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("No autorizado"));
        }

        List<OperatorSchedule> schedules = scheduleService.getOperatorSchedules(operatorId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Crear horario (operario crea su propio horario)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<?> createSchedule(
            @Valid @RequestBody OperatorSchedule schedule,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Asignar el operario autenticado
            User operator = new User();
            operator.setId(userDetails.getId());
            schedule.setOperator(operator);

            OperatorSchedule saved = scheduleService.createSchedule(schedule);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Horario creado exitosamente", saved));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al crear horario: " + e.getMessage()));
        }
    }

    /**
     * Actualizar horario
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<?> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody OperatorSchedule schedule,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Verificar que el horario le pertenece
            OperatorSchedule existing = scheduleService.getOperatorSchedules(userDetails.getId())
                .stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElse(null);
            
            if (existing == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Horario no encontrado o no te pertenece"));
            }

            OperatorSchedule updated = scheduleService.updateSchedule(id, schedule);
            return ResponseEntity.ok(ApiResponse.success("Horario actualizado", updated));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Eliminar horario (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<?> deleteSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Verificar que el horario le pertenece
            OperatorSchedule existing = scheduleService.getOperatorSchedules(userDetails.getId())
                .stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElse(null);
            
            if (existing == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Horario no encontrado o no te pertenece"));
            }

            scheduleService.deleteSchedule(id);
            return ResponseEntity.ok(ApiResponse.success("Horario eliminado"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Verificar si un horario tiene conflictos (útil para validación en frontend)
     */
    @PostMapping("/validate")
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<?> validateSchedule(
            @RequestBody OperatorSchedule schedule,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User operator = new User();
            operator.setId(userDetails.getId());
            schedule.setOperator(operator);

            // Intentar crear (esto hará todas las validaciones)
            scheduleService.createSchedule(schedule);
            
            return ResponseEntity.ok(ApiResponse.success("Horario válido", null));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Verificar disponibilidad de operario en un día
     */
    @GetMapping("/availability/{operatorId}/{dayOfWeek}")
    public ResponseEntity<?> checkAvailability(
            @PathVariable Long operatorId,
            @PathVariable String dayOfWeek) {
        
        try {
            DayOfWeek day = DayOfWeek.valueOf(dayOfWeek.toUpperCase());
            boolean isWorking = scheduleService.isOperatorWorkingOn(operatorId, day);
            
            return ResponseEntity.ok(Map.of(
                "operatorId", operatorId,
                "dayOfWeek", dayOfWeek,
                "isWorking", isWorking
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Día de semana inválido"));
        }
    }
}