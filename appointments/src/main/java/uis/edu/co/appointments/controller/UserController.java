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
    @PreAuthorize("hasAuthority('admin')")
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
    @PreAuthorize("hasAuthority('admin')")
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
    @PreAuthorize("hasAuthority('admin')")
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
    @PreAuthorize("hasAuthority('admin')")
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
     * Obtener estadísticas de usuarios (solo admin)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<?> getUserStats() {
        UserService.UserStats stats = userService.getUserStats();
        return ResponseEntity.ok(stats);
    }
}