package uis.edu.co.appointments.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Role;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.RoleRepository;
import uis.edu.co.appointments.repository.UserRepository;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Método general de guardado (no toca el hash)
     * Útil para admin o actualizaciones controladas
     */
    public User save(User user) {
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Registro público: valida email, asigna rol 'usuario' y hashea contraseña
     */
    @Transactional
    public User register(User user) {
        if (user.getEmail() == null || user.getPasswordHash() == null) {
            throw new IllegalArgumentException("Email y contraseña son obligatorios");
        }

        if (existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }

        // Buscar rol por nombre (debe existir en la tabla roles)
        Role defaultRole = roleRepository.findByName("usuario")
                .orElseThrow(() -> new IllegalStateException("Rol por defecto 'usuario' no encontrado. Ejecuta seed de roles."));

        // Hashear la contraseña (user.passwordHash contiene la contraseña en texto plano al registrar)
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setRole(defaultRole);

        // Establecer valor por defecto de reminderHours si no viene
        if (user.getReminderHours() == null) {
            user.setReminderHours(1);
        }

        User saved = userRepository.save(user);
        logger.info("Usuario registrado: {}", saved.getEmail());
        return saved;
    }

    /**
     * Actualizar preferencia de notificación del usuario
     */
    @Transactional
    public User updateNotificationPreference(Long userId, Integer reminderHours) {
        if (reminderHours == null || reminderHours < 1 || reminderHours > 6) {
            throw new IllegalArgumentException("reminderHours debe estar entre 1 y 6");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + userId));

        user.setReminderHours(reminderHours);
        User updated = userRepository.save(user);
        
        logger.info("Preferencia de notificación actualizada para usuario {}: {} horas antes",
                   user.getEmail(), reminderHours);
        return updated;
    }

    /**
     * Actualizar email del usuario
     */
    @Transactional
    public User updateEmail(Long userId, String newEmail) {
        if (newEmail == null || newEmail.isBlank()) {
            throw new IllegalArgumentException("El nuevo email no puede estar vacío");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + userId));

        // Verificar que el nuevo email no esté en uso por otro usuario
        if (userRepository.existsByEmailAndNotUserId(newEmail, userId)) {
            throw new IllegalArgumentException("El email ya está en uso por otro usuario");
        }

        String oldEmail = user.getEmail();
        user.setEmail(newEmail);
        User updated = userRepository.save(user);
        
        logger.info("Email actualizado para usuario: {} -> {}", oldEmail, newEmail);
        return updated;
    }

    /**
     * Actualizar contraseña del usuario
     */
    @Transactional
    public User updatePassword(Long userId, String currentPassword, String newPassword) {
        if (currentPassword == null || newPassword == null) {
            throw new IllegalArgumentException("Contraseña actual y nueva son obligatorias");
        }

        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 6 caracteres");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con id: " + userId));

        // Verificar que la contraseña actual sea correcta
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta");
        }

        // No permitir que la nueva sea igual a la actual
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser diferente a la actual");
        }

        // Hashear y guardar nueva contraseña
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        User updated = userRepository.save(user);
        
        logger.info("Contraseña actualizada para usuario: {}", user.getEmail());
        return updated;
    }

    /**
     * Obtener usuarios regulares (no admins)
     */
    public List<User> findAllRegularUsers() {
        return userRepository.findAllRegularUsers();
    }

    /**
     * Obtener administradores
     */
    public List<User> findAllAdmins() {
        return userRepository.findAllAdmins();
    }

    /**
     * Obtener usuarios por rol
     */
    public List<User> findByRoleName(String roleName) {
        return userRepository.findByRoleName(roleName);
    }

    /**
     * Verificar si un usuario es administrador
     */
    public boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() != null && "admin".equalsIgnoreCase(user.getRole().getName()))
                .orElse(false);
    }

    /**
     * Obtener estadísticas de usuarios
     */
    public UserStats getUserStats() {
        long totalUsers = userRepository.count();
        long regularUsers = userRepository.countByRoleName("usuario");
        long admins = userRepository.countByRoleName("admin");
        
        return new UserStats(totalUsers, regularUsers, admins);
    }

    // Clase interna para estadísticas
    public static class UserStats {
        private final long totalUsers;
        private final long regularUsers;
        private final long admins;

        public UserStats(long totalUsers, long regularUsers, long admins) {
            this.totalUsers = totalUsers;
            this.regularUsers = regularUsers;
            this.admins = admins;
        }

        public long getTotalUsers() { return totalUsers; }
        public long getRegularUsers() { return regularUsers; }
        public long getAdmins() { return admins; }
    }
}