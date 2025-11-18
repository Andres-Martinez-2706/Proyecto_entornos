package uis.edu.co.appointments.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uis.edu.co.appointments.dto.ApiResponse;
import uis.edu.co.appointments.dto.CompleteAppointmentRequest;
import uis.edu.co.appointments.dto.DashboardStatsDTO;
import uis.edu.co.appointments.dto.OperatorStats;
import uis.edu.co.appointments.dto.RateOperatorRequest;
import uis.edu.co.appointments.dto.UserAppointmentStats;
import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.AppointmentStatus;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.security.UserDetailsImpl;
import uis.edu.co.appointments.service.AppointmentService;
import uis.edu.co.appointments.service.UserService;
import uis.edu.co.appointments.util.DateRangeHelper;
import uis.edu.co.appointments.util.DateRangeHelper.DateRange;


@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    @SuppressWarnings("unused")
    private final UserService userService;

    public AppointmentController(AppointmentService appointmentService, UserService userService) {
        this.appointmentService = appointmentService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String roleName = userDetails.getRoleName();
        
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            return ResponseEntity.ok(appointmentService.findAll(includeDeleted));
        } else if ("OPERARIO".equalsIgnoreCase(roleName)) {
            return ResponseEntity.ok(appointmentService.findByOperatorId(userDetails.getId(), includeDeleted));
        } else {
            return ResponseEntity.ok(appointmentService.findByUserId(userDetails.getId(), includeDeleted));
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Appointment>> getUpcomingAppointments(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String roleName = userDetails.getRoleName();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName);
        
        List<Appointment> upcoming = appointmentService.getUpcomingAppointments(userDetails.getId(), isAdmin);
        return ResponseEntity.ok(upcoming);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Appointment> opt = appointmentService.findById(id);
        
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Cita no encontrada"));
        }

        Appointment appointment = opt.get();
        String roleName = userDetails.getRoleName();
        
        boolean canView = "ADMIN".equalsIgnoreCase(roleName) ||
                         (appointment.getUser() != null && appointment.getUser().getId().equals(userDetails.getId())) ||
                         (appointment.getOperator() != null && appointment.getOperator().getId().equals(userDetails.getId()));
        
        if (!canView) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("No autorizado para ver esta cita"));
        }

        return ResponseEntity.ok(appointment);
    }

    /**
     * ⚠️ CAMBIO CRÍTICO: Removí el @PreAuthorize
     * La validación ya está en SecurityConfig.java
     */
    @PostMapping
    @SuppressWarnings("CallToPrintStackTrace")
    public ResponseEntity<?> createAppointment(
            @Valid @RequestBody Appointment appointment,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String roleName = userDetails.getRoleName();
            
            // Validación manual de roles (más clara)
            if (!"USUARIO".equalsIgnoreCase(roleName) && !"ADMIN".equalsIgnoreCase(roleName)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No tienes permisos para crear citas"));
            }
            
            // Si no es admin, forzar que la cita sea para el usuario autenticado
            if (!"ADMIN".equalsIgnoreCase(roleName)) {
                User user = new User();
                user.setId(userDetails.getId());
                appointment.setUser(user);
            } else {
                // Admin debe especificar el usuario
                if (appointment.getUser() == null || appointment.getUser().getId() == null) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Debe especificar el usuario para la cita"));
                }
            }
            
            Appointment saved = appointmentService.save(appointment);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Cita creada exitosamente", saved));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // Para debug
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al crear la cita: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody Appointment appointment,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment existingAppt = existing.get();
            String roleName = userDetails.getRoleName();
            
            boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName);
            boolean isOwner = existingAppt.getUser() != null && 
                             existingAppt.getUser().getId().equals(userDetails.getId());
            
            if (!isAdmin && !isOwner) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado para modificar esta cita"));
            }

            if (existingAppt.getStatus() == AppointmentStatus.COMPLETED || 
                existingAppt.getStatus() == AppointmentStatus.FAILED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No se puede modificar una cita completada o fallida"));
            }

            appointment.setId(id);
            appointment.setUser(existingAppt.getUser());
            
            Appointment updated = appointmentService.save(appointment);
            
            return ResponseEntity.ok(ApiResponse.success("Cita actualizada exitosamente", updated));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar la cita: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAppointment(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment existingAppt = existing.get();
            String roleName = userDetails.getRoleName();
            
            boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName);
            boolean isOwner = existingAppt.getUser() != null && 
                             existingAppt.getUser().getId().equals(userDetails.getId());
            
            if (!isAdmin && !isOwner) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado para eliminar esta cita"));
            }

            if (existingAppt.getStatus() == AppointmentStatus.COMPLETED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No se puede eliminar una cita completada"));
            }

            appointmentService.delete(id);
            
            return ResponseEntity.ok(ApiResponse.success("Cita eliminada exitosamente"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar la cita: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<?> completeAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CompleteAppointmentRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment appointment = existing.get();
            
            if (appointment.getOperator() == null || 
                !appointment.getOperator().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Esta cita no está asignada a ti"));
            }

            Appointment completed = appointmentService.completeAppointment(id, request);
            
            return ResponseEntity.ok(
                ApiResponse.success("Cita completada exitosamente", completed)
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/rate-operator")
    @PreAuthorize("hasAuthority('USUARIO')")
    public ResponseEntity<?> rateOperator(
            @PathVariable Long id,
            @Valid @RequestBody RateOperatorRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment appointment = existing.get();
            
            if (appointment.getUser() == null || 
                !appointment.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }

            Appointment rated = appointmentService.rateOperator(
                id, request.getRating(), request.getObservation()
            );
            
            return ResponseEntity.ok(
                ApiResponse.success("Operario calificado exitosamente", rated)
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/pending-completion")
    @PreAuthorize("hasAuthority('OPERARIO')")
    public ResponseEntity<List<Appointment>> getPendingCompletion(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Appointment> pending = appointmentService.getPendingCompletionAppointments(
            userDetails.getId()
        );
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/available-operators")
    public ResponseEntity<?> getAvailableOperators(
            @RequestParam Long categoryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam Integer durationMinutes) {
        
        try {
            List<User> operators = appointmentService.findAllAvailableOperators(
                categoryId, date, startTime, durationMinutes
            );
            
            if (operators.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            List<Map<String, Object>> operatorsList = operators.stream()
                .map(operator -> {
                    Map<String, Object> operatorInfo = new HashMap<>();
                    operatorInfo.put("id", operator.getId());
                    operatorInfo.put("fullName", operator.getFullName());
                    operatorInfo.put("email", operator.getEmail());
                    operatorInfo.put("averageRating", operator.getAverageRating());
                    return operatorInfo;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(operatorsList);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<?> getOperatorAppointments(
            @PathVariable Long operatorId,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            Authentication authentication) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String roleName = userDetails.getRoleName();
        
        if (!"ADMIN".equalsIgnoreCase(roleName) && !userDetails.getId().equals(operatorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("No autorizado"));
        }
        
        List<Appointment> appointments = appointmentService.findByOperatorId(
            operatorId, includeDeleted
        );
        
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/operator-stats/{operatorId}")
    @PreAuthorize("hasAnyAuthority('OPERARIO', 'ADMIN')")
    public ResponseEntity<?> getOperatorStats(
            @PathVariable Long operatorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String roleName = userDetails.getRoleName();
            
            if (!"ADMIN".equalsIgnoreCase(roleName) && !userDetails.getId().equals(operatorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }
            
            OperatorStats stats = appointmentService.getOperatorStats(
                operatorId, startDate, endDate
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/user-stats/{userId}")
    public ResponseEntity<?> getUserStats(
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String roleName = userDetails.getRoleName();
            
            boolean canView = "ADMIN".equalsIgnoreCase(roleName) ||
                             "OPERARIO".equalsIgnoreCase(roleName) ||
                             userDetails.getId().equals(userId);
            
            if (!canView) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }
            
            UserAppointmentStats stats = appointmentService.getUserAppointmentStats(
                userId, startDate, endDate
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Appointment>> searchAppointments(
        Authentication authentication,
        @RequestParam(required = false) String query,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) Long operatorId,
        @RequestParam(required = false) AppointmentStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "date,desc") String[] sort
    ) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String roleName = userDetails.getRoleName();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(
            sort[1].equals("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
            sort[0]
        ));
        
        Page<Appointment> results = appointmentService.searchAppointments(
            userDetails.getId(), 
            roleName, 
            query, 
            categoryId, 
            operatorId, 
            status, 
            startDate, 
            endDate, 
            pageable
        );
        
        return ResponseEntity.ok(results);
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats(
            Authentication authentication,
            @RequestParam(defaultValue = "30d") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate customStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate customEnd
    ) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            DateRange range = DateRangeHelper.getRange(period, customStart, customEnd);
            
            DashboardStatsDTO stats = appointmentService.getDashboardStats(
                userDetails.getId(),
                userDetails.getRoleName(),
                range.getStart(),
                range.getEnd()
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }
    /**
     * Cancelar cita con observación (operario o admin)
     * POST /api/appointments/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('OPERARIO', 'ADMIN')")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment appointment = existing.get();
            String roleName = userDetails.getRoleName();
            
            // Verificar permisos
            boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName);
            boolean isAssignedOperator = appointment.getOperator() != null && 
                                        appointment.getOperator().getId().equals(userDetails.getId());
            
            if (!isAdmin && !isAssignedOperator) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado para cancelar esta cita"));
            }

            // Verificar que esté programada
            if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Solo se pueden cancelar citas programadas"));
            }

            // Obtener observación
            String observation = request.get("observation");
            if (observation == null || observation.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("La observación es obligatoria"));
            }

            // Cancelar la cita
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointment.setOperatorObservation(observation);
            appointment.setDeleted(true);
            appointment.setDeletedAt(LocalDateTime.now());
            
            Appointment cancelled = appointmentService.save(appointment);
            
            return ResponseEntity.ok(
                ApiResponse.success("Cita cancelada exitosamente", cancelled)
            );
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al cancelar la cita: " + e.getMessage()));
        }
    }
}