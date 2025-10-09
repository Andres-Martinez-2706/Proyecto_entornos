package uis.edu.co.appointments.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import uis.edu.co.appointments.dto.ApiResponse;
import uis.edu.co.appointments.models.Notification;
import uis.edu.co.appointments.security.UserDetailsImpl;
import uis.edu.co.appointments.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Obtener notificaciones
     * - Usuario: solo ve las suyas
     * - Admin: ve todas (para debug)
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            Authentication authentication,
            @RequestParam(required = false) Boolean unreadOnly) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
        
        List<Notification> notifications;
        
        if (isAdmin) {
            // Admin ve todas (para debug)
            notifications = notificationService.findAll();
        } else {
            // Usuario ve solo las suyas
            if (unreadOnly != null && unreadOnly) {
                notifications = notificationService.findUnreadByUserId(userDetails.getId());
            } else {
                notifications = notificationService.findByUserId(userDetails.getId());
            }
        }
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Obtener notificaciones del usuario autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<List<Notification>> getMyNotifications(
            Authentication authentication,
            @RequestParam(required = false) Boolean unreadOnly) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        List<Notification> notifications;
        if (unreadOnly != null && unreadOnly) {
            notifications = notificationService.findUnreadByUserId(userDetails.getId());
        } else {
            notifications = notificationService.findByUserId(userDetails.getId());
        }
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Contar notificaciones no leídas del usuario
     */
    @GetMapping("/me/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        long count = notificationService.countUnreadByUserId(userDetails.getId());
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    /**
     * Obtener notificación por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getNotificationById(
            @PathVariable Long id,
            Authentication authentication) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Notification> opt = notificationService.findById(id);
        
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Notificación no encontrada"));
        }

        Notification notification = opt.get();
        boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
        
        // Verificar permisos: admin puede ver todas, usuario solo las suyas
        if (!isAdmin && !notification.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("No autorizado"));
        }

        return ResponseEntity.ok(notification);
    }

    /**
     * Crear notificación (solo admin - para testing o casos especiales)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<?> createNotification(@RequestBody Notification notification) {
        try {
            Notification saved = notificationService.save(notification);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Notificación creada", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al crear notificación: " + e.getMessage()));
        }
    }

    /**
     * Actualizar notificación (solo admin)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<?> updateNotification(
            @PathVariable Long id,
            @RequestBody Notification notification) {
        
        try {
            if (!notificationService.findById(id).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Notificación no encontrada"));
            }
            
            notification.setId(id);
            Notification updated = notificationService.save(notification);
            return ResponseEntity.ok(ApiResponse.success("Notificación actualizada", updated));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Eliminar notificación
     * - Usuario: solo puede eliminar las suyas
     * - Admin: puede eliminar cualquiera
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Notification> opt = notificationService.findById(id);
            
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Notificación no encontrada"));
            }

            Notification notification = opt.get();
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !notification.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }

            notificationService.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Notificación eliminada"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Marcar notificación como leída
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Optional<Notification> opt = notificationService.findById(id);
            
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Notificación no encontrada"));
            }

            Notification notification = opt.get();
            boolean isAdmin = "admin".equalsIgnoreCase(userDetails.getRoleName());
            
            // Verificar permisos
            if (!isAdmin && !notification.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("No autorizado"));
            }

            notificationService.markAsRead(id);
            return ResponseEntity.ok(ApiResponse.success("Notificación marcada como leída"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Marcar todas las notificaciones del usuario como leídas
     */
    @PatchMapping("/me/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            notificationService.markAllAsReadByUserId(userDetails.getId());
            return ResponseEntity.ok(ApiResponse.success("Todas las notificaciones marcadas como leídas"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Obtener notificaciones de admin para el usuario autenticado
     * (modificaciones/cancelaciones realizadas por admin)
     */
    @GetMapping("/me/admin-notifications")
    public ResponseEntity<List<Notification>> getAdminNotifications(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Notification> notifications = notificationService.findAdminNotificationsByUserId(userDetails.getId());
        return ResponseEntity.ok(notifications);
    }

    // Clase interna para respuesta de conteo
    private static class UnreadCountResponse {
        private final long count;

        public UnreadCountResponse(long count) {
            this.count = count;
        }

        public long getCount() {
            return count;
        }
    }
}