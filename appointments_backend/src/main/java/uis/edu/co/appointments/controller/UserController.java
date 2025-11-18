package uis.edu.co.appointments.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import static org.springframework.http.ResponseEntity.ok;
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
import uis.edu.co.appointments.dto.AssignCategoriesRequest;
import uis.edu.co.appointments.dto.CreateOperatorRequest;
import uis.edu.co.appointments.dto.NotificationPreferencesRequest;
import uis.edu.co.appointments.dto.UpdateEmailRequest;
import uis.edu.co.appointments.dto.UpdateNotificationPreferenceRequest;
import uis.edu.co.appointments.dto.UpdatePasswordRequest;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.security.UserDetailsImpl;
import uis.edu.co.appointments.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Obtener todos los usuarios (solo admin)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    /**
     * Obtener usuario por ID
     * - Admin: puede ver cualquier usuario
     * - Usuario: solo puede ver su propio perfil
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
        
        // Verificar permisos
        if (!isAdmin && !userDetails.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("No autorizado"));
        }
        
        Optional<User> user = userService.findById(id);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Usuario no encontrado"));
        }
        
        return ResponseEntity.ok(user.get());
    }

    /**
     * Obtener perfil del usuario autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> user = userService.findById(userDetails.getId());
        
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Usuario no encontrado"));
        }
        
        return ResponseEntity.ok(user.get());
    }

    /**
     * Crear usuario (solo admin)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody User user) {
        try {
            User saved = userService.save(user);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Usuario creado", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al crear usuario: " + e.getMessage()));
        }
    }

    /**
     * Actualizar usuario (solo admin)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        try {
            if (!userService.findById(id).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Usuario no encontrado"));
            }
            
            user.setId(id);
            User updated = userService.save(user);
            return ResponseEntity.ok(ApiResponse.success("Usuario actualizado", updated));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al actualizar usuario: " + e.getMessage()));
        }
    }

    /**
     * Eliminar usuario (solo admin)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            if (!userService.findById(id).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Usuario no encontrado"));
            }
            
            userService.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Usuario eliminado"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar usuario: " + e.getMessage()));
        }
    }

    /**
     * Actualizar preferencia de notificación (horas antes)
     * - Usuario: solo puede actualizar la suya
     * - Admin: puede actualizar cualquiera
     */
    @PatchMapping("/{id}/notification-preference")
    public ResponseEntity<?> updateNotificationPreference(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNotificationPreferenceRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !userDetails.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }
            
            User updated = userService.updateNotificationPreference(id, request.getReminderHours());
            return ResponseEntity.ok(ApiResponse.success("Preferencia actualizada", updated));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Actualizar email
     * - Usuario: solo puede actualizar el suyo
     * - Admin: puede actualizar cualquiera
     */
    @PatchMapping("/{id}/email")
    public ResponseEntity<?> updateEmail(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmailRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !userDetails.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }
            
            User updated = userService.updateEmail(id, request.getNewEmail());
            return ResponseEntity.ok(ApiResponse.success("Email actualizado", updated));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Actualizar contraseña
     * - Solo el propio usuario puede cambiar su contraseña (ni siquiera admin)
     */
    @PatchMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePasswordRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Solo el propio usuario puede cambiar su contraseña
            if (!userDetails.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Solo puedes cambiar tu propia contraseña"));
            }
            
            @SuppressWarnings("unused")
            User updated = userService.updatePassword(
                    id,
                    request.getCurrentPassword(),
                    request.getNewPassword()
            );
            
            return ResponseEntity.ok(ApiResponse.success("Contraseña actualizada exitosamente"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas de usuario (solo admin)
     */
    @GetMapping("/stats/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getAdminUserStats() {
        UserService.UserStats stats = userService.getUserStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Listar operarios activos
     */
    @GetMapping("/operators")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'USUARIO', 'OPERARIO')")
    public ResponseEntity<List<User>> getOperators() {
        List<User> operators = userService.getActiveOperators();
        return ResponseEntity.ok(operators);
    }

    /**
     * Obtener operarios por categoría
     */
    @GetMapping("/operators/by-category/{categoryId}")
    public ResponseEntity<List<User>> getOperatorsByCategory(@PathVariable Long categoryId) {
        List<User> operators = userService.getOperatorsByCategory(categoryId);
        return ResponseEntity.ok(operators);
    }

    /**
     * Asignar categorías a operario (admin)
     */
    @PatchMapping("/{operatorId}/categories")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'OPERARIO')")
    public ResponseEntity<?> assignCategories(
            @PathVariable Long operatorId,
            @Valid @RequestBody AssignCategoriesRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String roleName = userDetails.getRoleName();
            
            // ✅ Si es operario, solo puede modificar sus propias categorías
            if ("OPERARIO".equalsIgnoreCase(roleName) && !userDetails.getId().equals(operatorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Solo puedes modificar tus propias categorías"));
            }
            
            userService.assignCategoriesToOperator(operatorId, request.getCategoryIds());
            
            return ResponseEntity.ok(
                ApiResponse.success("Categorías asignadas exitosamente")
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Cambiar estado activo/inactivo de usuario
     */
    @PatchMapping("/{userId}/active-status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateActiveStatus(
            @PathVariable Long userId,
            @RequestParam Boolean active) {
        
        try {
            userService.updateUserActiveStatus(userId, active);
            
            String message = active ? "Usuario activado" : "Usuario desactivado";
            return ResponseEntity.ok(ApiResponse.success(message));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas básicas de usuario (para vista de perfil)
     */
    @GetMapping("/{userId}/stats")
    public ResponseEntity<?> getUserBasicStats(
            @PathVariable Long userId,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String roleName = userDetails.getRoleName();
            
            // Solo admin, operarios, o el mismo usuario pueden ver stats
            boolean canView = "ADMIN".equalsIgnoreCase(roleName) ||
                             "OPERARIO".equalsIgnoreCase(roleName) ||
                             userDetails.getId().equals(userId);
            
            if (!canView) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }
            
            User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalAppointments", user.getTotalAppointments());
            stats.put("attendedAppointments", user.getAttendedAppointments());
            stats.put("failedAppointments", user.getFailedAppointments());
            stats.put("averageRating", user.getAverageRating());
            stats.put("totalRatings", user.getTotalRatings());
            
            double failureRate = user.getTotalAppointments() > 0 
                ? (double) user.getFailedAppointments() / user.getTotalAppointments() * 100 
                : 0.0;
            stats.put("failureRate", failureRate);
            
            return ResponseEntity.ok(stats);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
    * Cambiar rol de un usuario (solo admin)
    * POST /api/users/{userId}/change-role
    */
    @PatchMapping("/{userId}/change-role")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> changeUserRole(
            @PathVariable Long userId,
            @RequestParam String roleName) {
        
        try {
            User updatedUser = userService.changeUserRole(userId, roleName);
            
            return ResponseEntity.ok(
                ApiResponse.success(
                    "Rol actualizado exitosamente a: " + roleName,
                    updatedUser
                )
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Crear usuario operario (solo admin)
     * POST /api/users/create-operator
     */
    @PostMapping("/create-operator")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createOperator(@Valid @RequestBody CreateOperatorRequest request) {
        try {
            // Validar que el email no exista
            if (userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("El correo ya está registrado"));
            }
            
            // Crear el operario
            User operator = userService.createOperator(
                request.getFullName(),
                request.getEmail(),
                request.getPassword()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                        "Operario creado exitosamente",
                        operator
                    ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al crear operario: " + e.getMessage()));
        }
    }
     /**
     * Búsqueda avanzada de usuarios con paginación (solo ADMIN)
     * 
     * @param query - Búsqueda en nombre completo o email
     * @param roleName - Filtrar por rol (ADMIN, OPERARIO, USUARIO)
     * @param active - Filtrar por estado activo/inactivo
     * @param page - Número de página (0-indexed)
     * @param size - Tamaño de página
     * @param sort - Campo y dirección de ordenamiento (ej: "fullName,asc")
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<User>> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName,asc") String[] sort
    ) {
        // Crear ordenamiento
        Sort.Direction direction = sort.length > 1 && sort[1].equalsIgnoreCase("desc") 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort[0]));
        
        Page<User> results = userService.searchUsers(query, roleName, active, pageable);
        
        return ok(results);
    }
    /**
     * Actualizar preferencias completas de notificación
     * - Usuario: solo puede actualizar las suyas
     * - Admin: puede actualizar cualquiera
     */
    @PatchMapping("/{userId}/notification-preferences")
    public ResponseEntity<?> updateNotificationPreferences(
            @PathVariable Long userId,
            @Valid @RequestBody NotificationPreferencesRequest request,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !userDetails.getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }
            
            User updated = userService.updateNotificationPreferences(userId, request);
            return ResponseEntity.ok(
                ApiResponse.success("Preferencias de notificación actualizadas", updated)
            );
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }
}