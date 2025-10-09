package uis.edu.co.appointments.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import uis.edu.co.appointments.dto.ApiResponse;
import uis.edu.co.appointments.dto.DeleteAppointmentByAdminRequest;
import uis.edu.co.appointments.dto.UpdateAppointmentByAdminRequest;
import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.security.UserDetailsImpl;
import uis.edu.co.appointments.service.AppointmentService;
import uis.edu.co.appointments.service.UserService;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserService userService;

    public AppointmentController(AppointmentService appointmentService, UserService userService) {
        this.appointmentService = appointmentService;
        this.userService = userService;
    }

    /**
     * Obtener todas las citas
     * - Admin: ve todas (incluidas eliminadas si se especifica)
     * - Usuario: solo ve las suyas (incluidas eliminadas si se especifica)
     */
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments(
            Authentication authentication,
            @RequestParam(defaultValue = "true") boolean includeDeleted) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        if ("admin".equalsIgnoreCase(userDetails.getRoleName())) {
            return ResponseEntity.ok(appointmentService.findAll(includeDeleted));
        } else {
            return ResponseEntity.ok(appointmentService.findByUserId(userDetails.getId(), includeDeleted));
        }
    }

    /**
     * Obtener citas próximas (próximos 7 días)
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<Appointment>> getUpcomingAppointments(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
        
        List<Appointment> upcoming = appointmentService.getUpcomingAppointments(userDetails.getId(), isAdmin);
        return ResponseEntity.ok(upcoming);
    }

    /**
     * Obtener cita por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Appointment> opt = appointmentService.findById(id);
        
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Cita no encontrada"));
        }

        Appointment appointment = opt.get();
        
        // Verificar permisos: admin puede ver todas, usuario solo las suyas
        if (!"admin".equalsIgnoreCase(userDetails.getRoleName()) 
                && !appointment.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("No autorizado para ver esta cita"));
        }

        return ResponseEntity.ok(appointment);
    }

    /**
     * Crear nueva cita (usuario normal)
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('usuario', 'admin')")
    public ResponseEntity<?> createAppointment(
            @Valid @RequestBody Appointment appointment,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Si no es admin, forzar a que la cita sea para el usuario autenticado
            if (!"admin".equalsIgnoreCase(userDetails.getRoleName())) {
                User user = new User();
                user.setId(userDetails.getId());
                appointment.setUser(user);
            }
            
            Appointment saved = appointmentService.save(appointment);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Cita creada exitosamente", saved));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al crear la cita: " + e.getMessage()));
        }
    }

    /**
     * Actualizar cita
     * - Usuario normal: actualiza sus propias citas
     * - Admin: puede actualizar cualquier cita (si viene adminObservation, usa método especial)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody Appointment appointment,
            @RequestParam(required = false) String adminObservation,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment existingAppt = existing.get();
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !existingAppt.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado para modificar esta cita"));
            }

            appointment.setId(id);
            
            // Si es admin y viene observación, usar método especial
            Appointment updated;
            if (isAdmin && adminObservation != null && !adminObservation.isBlank()) {
                User admin = userService.findById(userDetails.getId()).orElseThrow();
                updated = appointmentService.saveByAdmin(appointment, adminObservation, admin);
            } else {
                updated = appointmentService.save(appointment);
            }
            
            return ResponseEntity.ok(ApiResponse.success("Cita actualizada exitosamente", updated));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar la cita: " + e.getMessage()));
        }
    }

    /**
     * Actualizar cita por admin con observación (endpoint alternativo más explícito)
     */
    @PutMapping("/{id}/admin")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<?> updateAppointmentByAdmin(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentByAdminRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User admin = userService.findById(userDetails.getId()).orElseThrow();
            
            request.getAppointment().setId(id);
            Appointment updated = appointmentService.saveByAdmin(
                    request.getAppointment(),
                    request.getAdminObservation(),
                    admin
            );
            
            return ResponseEntity.ok(ApiResponse.success("Cita modificada por admin", updated));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Eliminar cita (soft-delete)
     * - Usuario: puede eliminar sus propias citas
     * - Admin: puede eliminar cualquier cita (si viene adminObservation, usa método especial)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String adminObservation,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Appointment> existing = appointmentService.findById(id);
            
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cita no encontrada"));
            }

            Appointment existingAppt = existing.get();
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !existingAppt.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado para eliminar esta cita"));
            }

            // Si es admin y viene observación, usar método especial
            if (isAdmin && adminObservation != null && !adminObservation.isBlank()) {
                User admin = userService.findById(userDetails.getId()).orElseThrow();
                appointmentService.deleteByAdmin(id, adminObservation, admin);
            } else {
                appointmentService.delete(id);
            }
            
            return ResponseEntity.ok(ApiResponse.success("Cita eliminada exitosamente"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar la cita: " + e.getMessage()));
        }
    }

    /**
     * Eliminar cita por admin con observación (endpoint alternativo más explícito)
     */
    @DeleteMapping("/{id}/admin")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<?> deleteAppointmentByAdmin(
            @PathVariable Long id,
            @Valid @RequestBody DeleteAppointmentByAdminRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User admin = userService.findById(userDetails.getId()).orElseThrow();
            
            appointmentService.deleteByAdmin(id, request.getAdminObservation(), admin);
            
            return ResponseEntity.ok(ApiResponse.success("Cita cancelada por admin"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Marcar cita como completada/terminada
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> markAsCompleted(
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
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Solo el dueño o admin puede marcar como completada
            if (!isAdmin && !existingAppt.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }

            appointmentService.markAsCompleted(id);
            
            return ResponseEntity.ok(ApiResponse.success("Cita marcada como terminada"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }
}