package uis.edu.co.appointments.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.dto.NotificationPreferencesRequest;
import uis.edu.co.appointments.models.Category;
import uis.edu.co.appointments.models.Role;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.AppointmentRepository;
import uis.edu.co.appointments.repository.CategoryRepository;
import uis.edu.co.appointments.repository.RoleRepository;
import uis.edu.co.appointments.repository.UserRepository;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final AppointmentRepository appointmentRepository;

    // Constructor final:
    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       CategoryRepository categoryRepository,
                       AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.appointmentRepository = appointmentRepository;
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

        // CAMBIAR de "usuario" a "USUARIO"
        Role defaultRole = roleRepository.findByName("USUARIO")
                .orElseThrow(() -> new IllegalStateException("Rol 'USUARIO' no encontrado"));

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setRole(defaultRole);

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
        return userRepository.findByRoleName("USUARIO"); // Cambiar de "usuario"
    }

    public List<User> findAllAdmins() {
        return userRepository.findByRoleName("ADMIN"); // Cambiar de "admin"
    }

    /**
     * Obtener usuarios por rol
     */
    public List<User> findByRoleName(String roleName) {
        return userRepository.findByRoleName(roleName);
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
    /**
     * Obtener operarios activos
     */
    public List<User> getActiveOperators() {
        return userRepository.findActiveOperators();
    }

    /**
     * Obtener operarios por categoría
     */
    public List<User> getOperatorsByCategory(Long categoryId) {
        return userRepository.findActiveOperatorsByCategory(categoryId);
    }

    /**
     * Asignar categorías a un operario
     */
    @Transactional
    public void assignCategoriesToOperator(Long operatorId, List<Long> categoryIds) {
        User operator = userRepository.findById(operatorId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Verificar que sea operario
        if (!"OPERARIO".equalsIgnoreCase(operator.getRole().getName())) {
            throw new IllegalArgumentException("El usuario no es un operario");
        }

        // Obtener categorías
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        
        if (categories.size() != categoryIds.size()) {
            throw new IllegalArgumentException("Algunas categorías no existen");
        }

        // Asignar categorías
        operator.setOperatorCategories(categories);
        userRepository.save(operator);
        
        logger.info("Categorías asignadas a operario ID: {}, categorías: {}", 
                   operatorId, categoryIds);
    }

    /**
     * Cambiar estado activo/inactivo de usuario
     */
    @Transactional
    public void updateUserActiveStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        user.setActive(active);
        userRepository.save(user);
        
        logger.info("Estado de usuario ID: {} cambiado a: {}", userId, active);
    }

    /**
     * Actualizar estadísticas de usuario (después de completar cita)
     */
    @Transactional
    public void updateUserStats(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Calcular estadísticas desde las citas
        List<uis.edu.co.appointments.models.Appointment> appointments = 
            user.getAppointments().stream()
                .filter(a -> !a.getDeleted())
                .filter(a -> a.getStatus() == uis.edu.co.appointments.models.AppointmentStatus.COMPLETED 
                          || a.getStatus() == uis.edu.co.appointments.models.AppointmentStatus.FAILED)
                .collect(Collectors.toList());

        int total = appointments.size();
        long attended = appointments.stream()
            .filter(a -> a.getAttendanceStatus() == uis.edu.co.appointments.models.AttendanceStatus.ATTENDED)
            .count();
        long failed = appointments.stream()
            .filter(a -> a.getAttendanceStatus() == uis.edu.co.appointments.models.AttendanceStatus.NOT_ATTENDED)
            .count();

        // Calcular promedio de calificaciones recibidas del operario
        List<Integer> ratings = appointments.stream()
            .map(uis.edu.co.appointments.models.Appointment::getOperatorRating)
            .filter(r -> r != null)
            .collect(Collectors.toList());

        double avgRating = ratings.isEmpty() ? 0.0 : 
            ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);

        // Actualizar user
        user.setTotalAppointments(total);
        user.setAttendedAppointments((int) attended);
        user.setFailedAppointments((int) failed);
        user.setAverageRating(avgRating);
        user.setTotalRatings(ratings.size());

        userRepository.save(user);
        
        logger.info("Estadísticas actualizadas para usuario ID: {}", userId);
    }

    /**
     * Actualizar estadísticas de operario (después de recibir calificación)
     */
    @Transactional
    public void updateOperatorStats(Long operatorId) {
        User operator = userRepository.findById(operatorId)
            .orElseThrow(() -> new IllegalArgumentException("Operario no encontrado"));

        // Calcular desde appointments donde es operario
        List<uis.edu.co.appointments.models.Appointment> appointments = 
            appointmentRepository.findByOperatorIdWithDeletedFilter(operatorId, false).stream()
                .filter(a -> a.getStatus() == uis.edu.co.appointments.models.AppointmentStatus.COMPLETED)
                .collect(Collectors.toList());

        int total = appointments.size();

        // Calcular promedio de calificaciones recibidas de usuarios
        List<Integer> ratings = appointments.stream()
            .map(uis.edu.co.appointments.models.Appointment::getUserRating)
            .filter(r -> r != null)
            .collect(Collectors.toList());

        double avgRating = ratings.isEmpty() ? 0.0 : 
            ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);

        // Actualizar operator
        operator.setTotalAppointments(total);
        operator.setAverageRating(avgRating);
        operator.setTotalRatings(ratings.size());

        userRepository.save(operator);
        
        logger.info("Estadísticas actualizadas para operario ID: {}", operatorId);
    }

    /**
     * Verificar si usuario es operario
     */
    public boolean isOperator(Long userId) {
        return userRepository.isOperator(userId);
    }

    /**
     * Verificar si usuario es admin
     */
    public boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
            .map(user -> user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName()))
            .orElse(false);
    }

    /**
     * Verificar si usuario es usuario regular
     */
    public boolean isUsuario(Long userId) {
        return userRepository.findById(userId)
            .map(user -> user.getRole() != null && "USUARIO".equalsIgnoreCase(user.getRole().getName()))
            .orElse(false);
    }

    /**
     * Cambiar el rol de un usuario
     */
    @Transactional
    public User changeUserRole(Long userId, String roleName) {
        // Validar que el usuario existe
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        // Validar que el rol existe
        Role role = roleRepository.findByName(roleName.toUpperCase())
            .orElseThrow(() -> new IllegalArgumentException(
                "Rol no encontrado: " + roleName + ". Roles válidos: USUARIO, OPERARIO, ADMIN"
            ));
        
        // Guardar el rol anterior para logging
        String previousRole = user.getRole() != null ? user.getRole().getName() : "ninguno";
        
        // Asignar el nuevo rol
        user.setRole(role);
        
        // Si se está convirtiendo en operario, inicializar listas si es necesario
        if ("OPERARIO".equalsIgnoreCase(roleName)) {
            if (user.getOperatorCategories() == null) {
                user.setOperatorCategories(new ArrayList<>());
            }
            if (user.getOperatorSchedules() == null) {
                user.setOperatorSchedules(new ArrayList<>());
            }
        }
        
        User updated = userRepository.save(user);
        
        logger.info("Rol de usuario ID {} cambiado de {} a {}", 
                userId, previousRole, roleName);
        
        return updated;
    }

    /**
     * Crear un nuevo operario
     */
    @Transactional
    public User createOperator(String fullName, String email, String password) {
        // Validar que el email no exista
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }
        
        // Obtener el rol de operario
        Role operatorRole = roleRepository.findByName("OPERARIO")
            .orElseThrow(() -> new IllegalArgumentException(
                "Rol OPERARIO no encontrado en la base de datos"
            ));
        
        // Crear el usuario
        User operator = new User();
        operator.setFullName(fullName);
        operator.setEmail(email);
        operator.setPasswordHash(passwordEncoder.encode(password));
        operator.setRole(operatorRole);
        operator.setActive(true);
        operator.setReminderHours(1);
        operator.setOperatorCategories(new ArrayList<>());
        operator.setOperatorSchedules(new ArrayList<>());
        
        // Inicializar estadísticas
        operator.setTotalAppointments(0);
        operator.setAttendedAppointments(0);
        operator.setFailedAppointments(0);
        operator.setAverageRating(0.0);
        operator.setTotalRatings(0);
        
        User saved = userRepository.save(operator);
        
        logger.info("Operario creado: ID={}, Email={}", saved.getId(), saved.getEmail());
        
        return saved;
    }

    /**
     * Búsqueda avanzada de usuarios con paginación
     */
    public Page<User> searchUsers(String query, String roleName, Boolean active, Pageable pageable) {
        return userRepository.searchUsers(query, roleName, active, pageable);
    }
    /**
     * Actualizar todas las preferencias de notificación del usuario
     */
    @Transactional
    public User updateNotificationPreferences(Long userId, NotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        user.setReminderHours(request.getReminderHours());
        user.setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        user.setInAppNotificationsEnabled(request.getInAppNotificationsEnabled());
        user.setReminderDayBeforeEnabled(request.getReminderDayBeforeEnabled());
        user.setReminderHoursBeforeEnabled(request.getReminderHoursBeforeEnabled());
        
        if (request.getNotificationTypesEnabled() != null) {
            user.setNotificationTypesEnabled(request.getNotificationTypesEnabled());
        }

        User saved = userRepository.save(user);
        logger.info("Preferencias de notificación actualizadas para usuario ID: {}", userId);
        
        return saved;
    }
    /**
     * Contar usuarios por rol
     */
    public Long countByRole(String roleName) {
        return userRepository.countByRoleName(roleName);
    }
    
    /**
     * Contar usuarios activos
     */
    public Long countActiveUsers() {
        return userRepository.countByActive(true);
    }
    /**
     * Actualizar contraseña (solo admin, sin validar contraseña actual)
     */
    @Transactional
    public User updatePasswordAdmin(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        // Validar nueva contraseña
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía");
        }
        
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");
        }
        
        // Actualizar contraseña
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        
        return userRepository.save(user);
    }
}