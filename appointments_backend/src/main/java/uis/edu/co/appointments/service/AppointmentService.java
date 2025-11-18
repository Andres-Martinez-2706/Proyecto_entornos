package uis.edu.co.appointments.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.dto.CompleteAppointmentRequest;
import uis.edu.co.appointments.dto.DashboardStatsDTO;
import uis.edu.co.appointments.dto.OperatorStats;
import uis.edu.co.appointments.dto.UserAppointmentStats;
import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.models.AppointmentStatus;
import uis.edu.co.appointments.models.AttendanceStatus;
import uis.edu.co.appointments.models.Notification;
import uis.edu.co.appointments.models.NotificationType;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.AppointmentRepository;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final NotificationSchedulerService schedulerService;
    private final EmailService emailService;
    private final UserService userService;
    private final OperatorScheduleService operatorScheduleService;

    // Modificar el constructor para incluir:
    public AppointmentService(AppointmentRepository appointmentRepository,
                              NotificationService notificationService,
                              @Lazy NotificationSchedulerService schedulerService,
                              EmailService emailService,
                              UserService userService,
                              OperatorScheduleService operatorScheduleService) { // NUEVO
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.schedulerService = schedulerService;
        this.emailService = emailService;
        this.userService = userService;
        this.operatorScheduleService = operatorScheduleService; // NUEVO
    }

    /**
     * Obtener todas las citas (con filtro de eliminadas)
     */
    public List<Appointment> findAll(boolean includeDeleted) {
        return appointmentRepository.findAllWithDeletedFilter(includeDeleted);
    }

    public List<Appointment> findAll() {
        return findAll(true); // Por defecto incluye eliminadas
    }

    public Optional<Appointment> findById(Long id) {
        return appointmentRepository.findById(id);
    }

    /**
     * Obtener citas de un usuario (con filtro de eliminadas)
     */
    public List<Appointment> findByUserId(Long userId, boolean includeDeleted) {
        return appointmentRepository.findByUserIdWithDeletedFilter(userId, includeDeleted);
    }

    public List<Appointment> findByUserId(Long userId) {
        return findByUserId(userId, true); // Por defecto incluye eliminadas
    }

    /**
     * Obtener citas próximas (próximos 7 días)
     */
    public List<Appointment> getUpcomingAppointments(Long userId, boolean isAdmin) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(7);

        if (isAdmin) {
            return appointmentRepository.findUpcomingAppointments(today, endDate);
        } else {
            return appointmentRepository.findUpcomingByUserId(userId, today, endDate);
        }
    }

    /**
     * Guardar o actualizar cita (usuario normal)
     * Crea notificaciones programadas automáticamente
     */
    @Transactional
    public Appointment save(Appointment appointment) {
        boolean isNew = (appointment.getId() == null);

        // 1) Validar usuario
        if (appointment.getUser() == null || appointment.getUser().getId() == null) {
            throw new IllegalArgumentException("La cita debe incluir el usuario (user.id).");
        }
        Long userId = appointment.getUser().getId();
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        appointment.setUser(user);

        // 2) Validar y asignar operario si no viene
        if (appointment.getOperator() == null || appointment.getOperator().getId() == null) {
            // Buscar operario disponible automáticamente
            if (appointment.getCategory() == null || appointment.getCategory().getId() == null) {
                throw new IllegalArgumentException("Debe especificar una categoría o un operario");
            }
            
            User availableOperator = findAvailableOperator(
                appointment.getCategory().getId(),
                appointment.getDate(),
                appointment.getStartTime(),
                appointment.getDurationMinutes()
            );
            
            if (availableOperator == null) {
                throw new IllegalArgumentException(
                    "No hay operarios disponibles para esa fecha y hora"
                );
            }
            
            appointment.setOperator(availableOperator);
        } else {
            // Validar operario proporcionado
            Long operatorId = appointment.getOperator().getId();
            User operator = userService.findById(operatorId)
                    .orElseThrow(() -> new IllegalArgumentException("Operario no encontrado"));
            appointment.setOperator(operator);
        }

        // 3) Validaciones completas
        validateAppointment(appointment);

        // 4) Calcular duración si viene startTime y endTime
        if (appointment.getDurationMinutes() == null || appointment.getDurationMinutes() == 0) {
            long minutes = java.time.Duration.between(
                appointment.getStartTime(), 
                appointment.getEndTime()
            ).toMinutes();
            appointment.setDurationMinutes((int) minutes);
        }

        // 5) Establecer estado inicial
        if (isNew) {
            appointment.setStatus(AppointmentStatus.SCHEDULED);
            appointment.setAttendanceStatus(AttendanceStatus.PENDING);
        }

        appointment.setUpdatedAt(LocalDateTime.now());
        appointment.setDeleted(false);

        // 6) Guardar
        Appointment saved = appointmentRepository.save(appointment);

        // 7) Programar notificaciones
        if (isNew) {
            schedulerService.scheduleAppointmentNotifications(saved);
            
            // Notificar al operario sobre la asignación
            notifyOperatorAssignment(saved);
            
            logger.info("Cita creada ID: {}, Operario: {}", 
                       saved.getId(), saved.getOperator().getId());
        } else {
            schedulerService.rescheduleAppointmentNotifications(saved);
            logger.info("Cita actualizada ID: {}", saved.getId());
        }

        // 8) Notificación y email al usuario
        String action = isNew ? "creada" : "modificada";
        String subject = "Cita " + action;
        String text = String.format(
            "Tu cita '%s' ha sido %s para el %s de %s a %s.\n" +
            "Operario asignado: %s",
            saved.getTitle(), action,
            saved.getDate(),
            saved.getStartTime(),
            saved.getEndTime(),
            saved.getOperator().getFullName()
        );

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(saved);
        notification.setMessage(text);
        notification.setNotificationType(NotificationType.SYSTEM);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Email al usuario
        try {
           String emailType = isNew ? "created" : "modified";
            emailService.sendAppointmentEmail(
                user.getEmail(),
                subject,
                user.getFullName(),
                saved.getTitle(),
                saved.getDate().toString(),
                saved.getStartTime() + " - " + saved.getEndTime(),
                text,
                null, // observacion
                saved.getOperator().getFullName(), // operatorName
                emailType
            );
        } catch (Exception e) {
            logger.warn("No se pudo enviar email a {}: {}", user.getEmail(), e.getMessage());
        }

        return saved;
    }
    
    /**
     * Eliminar cita (soft-delete)
     */
    @Transactional
    public void delete(Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Cita no encontrada");
        }
        Appointment appt = opt.get();
        User user = appt.getUser();
        User operator = appt.getOperator();

        // Soft delete
        appt.setDeleted(true);
        appt.setDeletedAt(LocalDateTime.now());
        appt.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);

        // Notificar al usuario
        String subject = "Cita cancelada";
        String text = String.format("Tu cita '%s' para el %s ha sido cancelada.",
                appt.getTitle(), appt.getDate());

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setAppointment(appt);
        notification.setMessage(text);
        notification.setNotificationType(NotificationType.SYSTEM);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Notificar al operario
        if (operator != null) {
            Notification operatorNotif = new Notification();
            operatorNotif.setUser(operator);
            operatorNotif.setAppointment(appt);
            operatorNotif.setMessage(String.format(
                "La cita '%s' del %s ha sido cancelada por el usuario.",
                appt.getTitle(), appt.getDate()
            ));
            operatorNotif.setNotificationType(NotificationType.SYSTEM);
            operatorNotif.setIsRead(false);
            operatorNotif.setIsSent(true);
            notificationService.save(operatorNotif);
        }

        // Emails
        try {
            // Email al usuario
            emailService.sendAppointmentEmail(
                user.getEmail(), 
                subject, 
                user.getFullName(),
                appt.getTitle(), 
                appt.getDate().toString(),
                appt.getStartTime() + " - " + appt.getEndTime(),
                text, 
                null, // observacion
                operator != null ? operator.getFullName() : null, // operatorName
                "cancelled"
            );
            
            // Email al operario
            if (operator != null) {
                emailService.sendAppointmentEmail(
                    operator.getEmail(), 
                    "Cita cancelada", 
                    operator.getFullName(),
                    appt.getTitle(), 
                    appt.getDate().toString(),
                    appt.getStartTime() + " - " + appt.getEndTime(),
                    "El usuario " + user.getFullName() + " ha cancelado esta cita.", 
                    null, // observacion
                    null, // no necesita operatorName en este contexto
                    "cancelled"
                );
            }
        } catch (Exception e) {
            logger.warn("Error enviando emails de cancelación: {}", e.getMessage());
        }

        logger.info("Cita ID {} cancelada", id);
    }

    /**
     * Marcar cita como completada/terminada
     */
    @Transactional
    public void markAsCompleted(Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Cita no encontrada con id: " + id);
        }
        Appointment appt = opt.get();
        appt.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appt);
        logger.info("Cita ID {} marcada como terminada", id);
    }

    /**
     * Método programado: Auto-completar citas pasadas
     * Se ejecuta periódicamente desde un @Scheduled
     */
    @Transactional
    public void autoCompleteAppointments() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Appointment> toComplete = appointmentRepository.findAppointmentsToComplete(today, now);

        for (Appointment appt : toComplete) {
            appt.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(appt);
            logger.info("Auto-completada cita ID: {}", appt.getId());
        }

        if (!toComplete.isEmpty()) {
            logger.info("Total de citas auto-completadas: {}", toComplete.size());
        }
    }

    // --- Validaciones ---
    private void validateAppointment(Appointment newAppointment) {
        LocalTime start = newAppointment.getStartTime();
        LocalTime end = newAppointment.getEndTime();

        if (start == null || end == null) {
            throw new IllegalArgumentException("startTime y endTime son obligatorios");
        }

        // Validar duración mínima
        if (end.isBefore(start.plusMinutes(5))) {
            throw new IllegalArgumentException("La cita debe durar al menos 5 minutos");
        }

        // Validar operario
        if (newAppointment.getOperator() == null || newAppointment.getOperator().getId() == null) {
            throw new IllegalArgumentException("La cita debe tener un operario asignado");
        }

        Long operatorId = newAppointment.getOperator().getId();
        LocalDate date = newAppointment.getDate();
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        // Validar que el operario trabaje ese día
        if (!operatorScheduleService.isOperatorWorkingOn(operatorId, dayOfWeek)) {
            throw new IllegalArgumentException(
                "El operario no trabaja los " + dayOfWeek.toString()
            );
        }

        // Validar que esté dentro del horario laboral
        if (!operatorScheduleService.isWithinOperatorSchedule(operatorId, dayOfWeek, start, end)) {
            throw new IllegalArgumentException(
                "El horario solicitado está fuera del horario de trabajo del operario"
            );
        }

        // Validar categoría y duración
        if (newAppointment.getCategory() != null && newAppointment.getCategory().getId() != null) {
            // Validar que el operario maneje esa categoría
            User operator = userService.findById(operatorId)
                .orElseThrow(() -> new IllegalArgumentException("Operario no encontrado"));
            
            boolean handlesCategory = operator.getOperatorCategories().stream()
                .anyMatch(cat -> cat.getId().equals(newAppointment.getCategory().getId()));
            
            if (!handlesCategory) {
                throw new IllegalArgumentException(
                    "El operario no atiende esta categoría"
                );
            }

            // Validar duración permitida
            // (Implementar si usas allowed_durations)
        }

        // Validar solapamientos
        if (!isOperatorAvailable(operatorId, date, start, end)) {
            // Si es una edición, excluir la cita actual
            if (newAppointment.getId() != null) {
                List<Appointment> overlapping = appointmentRepository
                    .findByOperatorIdWithDeletedFilter(operatorId, false)
                    .stream()
                    .filter(a -> !a.getId().equals(newAppointment.getId()))
                    .filter(a -> a.getDate().equals(date))
                    .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                    .filter(a -> a.getStatus() != AppointmentStatus.FAILED)
                    .filter(a -> start.isBefore(a.getEndTime()) && end.isAfter(a.getStartTime()))
                    .collect(Collectors.toList());
                
                if (!overlapping.isEmpty()) {
                    throw new IllegalArgumentException(
                        "Conflicto: el operario ya tiene una cita en ese horario"
                    );
                }
            } else {
                throw new IllegalArgumentException(
                    "Conflicto: el operario ya tiene una cita en ese horario"
                );
            }
        }
    }

    /**
     * Buscar operario disponible automáticamente
     */
    public User findAvailableOperator(Long categoryId, LocalDate date, 
                                 LocalTime startTime, int durationMinutes) {
        // LOG 1: Parámetros recibidos
        logger.info("🔍 === BUSCANDO OPERARIO DISPONIBLE ===");
        logger.info("📋 CategoryId: {}", categoryId);
        logger.info("📅 Date: {} ({})", date, date.getDayOfWeek());
        logger.info("⏰ StartTime: {}", startTime);
        logger.info("⏱️ Duration: {} minutos", durationMinutes);
        
        // Obtener operarios que manejan esta categoría
        List<User> operators = userService.getOperatorsByCategory(categoryId);
        
        // LOG 2: Operarios encontrados para la categoría
        logger.info("👥 Operarios que manejan la categoría: {}", operators.size());
        operators.forEach(op -> logger.info("  - Operario: {} (ID: {})", op.getFullName(), op.getId()));
        
        if (operators.isEmpty()) {
            logger.warn("❌ No hay operarios que atiendan esta categoría");
            throw new IllegalArgumentException("No hay operarios que atiendan esta categoría");
        }

        LocalTime endTime = startTime.plusMinutes(durationMinutes);
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        
        logger.info("🕐 EndTime calculado: {}", endTime);
        logger.info("📆 DayOfWeek: {}", dayOfWeek);

        // Buscar el primer operario disponible
        for (User operator : operators) {
            logger.info("🔎 Evaluando operario: {} (ID: {})", operator.getFullName(), operator.getId());
            
            // Verificar que trabaje ese día
            boolean worksOnDay = operatorScheduleService.isOperatorWorkingOn(operator.getId(), dayOfWeek);
            logger.info("  ✓ ¿Trabaja el {}? {}", dayOfWeek, worksOnDay);
            
            if (!worksOnDay) {
                logger.info("  ❌ Descartado: No trabaja este día");
                continue;
            }

            // Verificar que el horario esté dentro de su jornada laboral
            boolean withinSchedule = operatorScheduleService.isWithinOperatorSchedule(
                    operator.getId(), dayOfWeek, startTime, endTime);
            logger.info("  ✓ ¿Horario {} - {} dentro de jornada? {}", startTime, endTime, withinSchedule);
            
            if (!withinSchedule) {
                logger.info("  ❌ Descartado: Horario fuera de jornada laboral");
                continue;
            }

            // Verificar disponibilidad (sin solapamientos)
            boolean isAvailable = isOperatorAvailable(operator.getId(), date, startTime, endTime);
            logger.info("  ✓ ¿Disponible (sin solapamientos)? {}", isAvailable);
            
            if (isAvailable) {
                logger.info("✅ OPERARIO ENCONTRADO: {} (ID: {})", operator.getFullName(), operator.getId());
                return operator;
            } else {
                logger.info("  ❌ Descartado: Tiene solapamiento de citas");
            }
        }

        logger.warn("❌ No se encontró ningún operario disponible");
        return null; // No hay operarios disponibles
    }
    /**
     * Buscar TODOS los operarios disponibles (para el frontend)
     */
    public List<User> findAllAvailableOperators(Long categoryId, LocalDate date, 
                                            LocalTime startTime, int durationMinutes) {
        logger.info("🔍 === BUSCANDO TODOS LOS OPERARIOS DISPONIBLES ===");
        logger.info("📋 CategoryId: {}", categoryId);
        logger.info("📅 Date: {} ({})", date, date.getDayOfWeek());
        logger.info("⏰ StartTime: {}", startTime);
        logger.info("⏱️ Duration: {} minutos", durationMinutes);
        
        List<User> operators = userService.getOperatorsByCategory(categoryId);
        logger.info("👥 Operarios que manejan la categoría: {}", operators.size());
        
        if (operators.isEmpty()) {
            return new ArrayList<>();
        }

        LocalTime endTime = startTime.plusMinutes(durationMinutes);
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        
        List<User> availableOperators = new ArrayList<>();
        
        for (User operator : operators) {
            logger.info("🔎 Evaluando operario: {} (ID: {})", operator.getFullName(), operator.getId());
            
            if (!operatorScheduleService.isOperatorWorkingOn(operator.getId(), dayOfWeek)) {
                logger.info("  ❌ Descartado: No trabaja este día");
                continue;
            }

            if (!operatorScheduleService.isWithinOperatorSchedule(
                    operator.getId(), dayOfWeek, startTime, endTime)) {
                logger.info("  ❌ Descartado: Horario fuera de jornada");
                continue;
            }

            if (isOperatorAvailable(operator.getId(), date, startTime, endTime)) {
                logger.info("✅ OPERARIO DISPONIBLE: {} (ID: {})", operator.getFullName(), operator.getId());
                availableOperators.add(operator);
            } else {
                logger.info("  ❌ Descartado: Tiene solapamiento");
            }
        }

        logger.info("📊 Total operarios disponibles: {}", availableOperators.size());
        return availableOperators;
    }

    /**
     * Verificar disponibilidad de operario
     */
    public boolean isOperatorAvailable(Long operatorId, LocalDate date,
                                      LocalTime startTime, LocalTime endTime) {
        long overlapping = appointmentRepository.countOverlappingAppointments(
            operatorId, date, startTime, endTime
        );
        return overlapping == 0;
    }

    /**
     * Completar cita (operario)
     */
    @Transactional
    public Appointment completeAppointment(Long appointmentId, 
                                          CompleteAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));

        // Validar que esté programada
        // Validar que esté programada o en progreso
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED 
            && appointment.getStatus() != AppointmentStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Solo se pueden completar citas programadas o en progreso");
        }

        // Establecer asistencia
        appointment.setAttendanceStatus(
            request.getAttended() ? AttendanceStatus.ATTENDED : AttendanceStatus.NOT_ATTENDED
        );
        
        appointment.setOperatorObservation(request.getOperatorObservation());
        appointment.setOperatorRating(request.getOperatorRating());
        appointment.setCompletedByOperator(true);
        appointment.setCompletedAt(LocalDateTime.now());
        
        // Cambiar estado según asistencia
        appointment.setStatus(
            request.getAttended() ? AppointmentStatus.COMPLETED : AppointmentStatus.FAILED
        );

        Appointment saved = appointmentRepository.save(appointment);

        // Actualizar estadísticas del usuario
        userService.updateUserStats(appointment.getUser().getId());

        // Notificar al usuario
        String message = request.getAttended() 
            ? String.format("Tu cita '%s' ha sido completada.\nObservación: %s", 
                           saved.getTitle(), request.getOperatorObservation())
            : String.format("Se ha registrado tu inasistencia a la cita '%s'.\nObservación: %s",
                           saved.getTitle(), request.getOperatorObservation());

        Notification notification = new Notification();
        notification.setUser(saved.getUser());
        notification.setAppointment(saved);
        notification.setMessage(message);
        notification.setNotificationType(NotificationType.SYSTEM);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        logger.info("Cita completada ID: {}, Asistencia: {}", 
                   appointmentId, request.getAttended());

        return saved;
    }

    /**
     * Calificar operario (usuario)
     */
    @Transactional
    public Appointment rateOperator(Long appointmentId, Integer rating, 
                                   String observation) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));

        // Validar que esté completada
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Solo se pueden calificar citas completadas");
        }

        // Validar que haya asistido
        if (appointment.getAttendanceStatus() != AttendanceStatus.ATTENDED) {
            throw new IllegalArgumentException("Solo puedes calificar si asististe a la cita");
        }

        appointment.setUserRating(rating);
        appointment.setUserObservation(observation);

        Appointment saved = appointmentRepository.save(appointment);

        // Actualizar estadísticas del operario
        userService.updateOperatorStats(appointment.getOperator().getId());

        // Notificar al operario
        Notification notification = new Notification();
        notification.setUser(saved.getOperator());
        notification.setAppointment(saved);
        notification.setMessage(String.format(
            "Has recibido una calificación de %d estrellas por tu atención en la cita '%s'",
            rating, saved.getTitle()
        ));
        notification.setNotificationType(NotificationType.RATING_RECEIVED);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Enviar email al operario sobre la calificación
        try {
            emailService.sendRatingReceivedEmail(
                saved.getOperator().getEmail(),
                saved.getOperator().getFullName(),
                rating,
                saved.getTitle(),
                saved.getDate().toString(),
                saved.getUser().getFullName(),
                observation
            );
        } catch (Exception e) {
            logger.warn("Error enviando email de calificación al operario: {}", e.getMessage());
        }

        logger.info("Operario calificado en cita ID: {}, Rating: {}", appointmentId, rating);

        return saved;
    }

    /**
     * Obtener citas pendientes de completar
     */
    public List<Appointment> getPendingCompletionAppointments(Long operatorId) {
        return appointmentRepository.findPendingCompletionByOperator(
            operatorId, LocalDate.now(), LocalTime.now()
        );
    }

    /**
     * Obtener citas por operario
     */
    public List<Appointment> findByOperatorId(Long operatorId, boolean includeDeleted) {
        return appointmentRepository.findByOperatorIdWithDeletedFilter(operatorId, includeDeleted);
    }

    /**
     * Estadísticas de operario
     */
    public OperatorStats getOperatorStats(Long operatorId, LocalDate startDate, LocalDate endDate) {
        // Si no vienen fechas, usar últimos 30 días
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        long total = appointmentRepository.countTotalByOperator(operatorId, startDate, endDate);
        long completed = appointmentRepository.countCompletedByOperator(operatorId, startDate, endDate);
        
        LocalDate sd = (startDate == null) ? LocalDate.now().minusDays(30) : startDate;
        LocalDate ed = (endDate == null) ? LocalDate.now() : endDate;
        // Calcular fallidas (citas donde el usuario no asistió)
        long failed = appointmentRepository.findByOperatorIdWithDeletedFilter(operatorId, false)
            .stream()
            .filter(a -> a.getAttendanceStatus() == AttendanceStatus.NOT_ATTENDED)
            .filter(a -> !a.getDate().isBefore(sd) && !a.getDate().isAfter(ed))
            .count();

        Double avgRating = appointmentRepository.getAverageOperatorRating(operatorId, startDate, endDate);
        double userFailureRate = total > 0 ? (double) failed / total * 100 : 0.0;

        return new OperatorStats(
            total,
            completed,
            failed,
            avgRating != null ? avgRating : 0.0,
            userFailureRate
        );
    }

    /**
     * Estadísticas de usuario
     */
    public UserAppointmentStats getUserAppointmentStats(Long userId, 
                                                       LocalDate startDate, 
                                                       LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDate sd = (startDate == null) ? LocalDate.now().minusDays(30) : startDate;
        LocalDate ed = (endDate == null) ? LocalDate.now() : endDate;

        List<Appointment> appointments = appointmentRepository.findByUserIdWithDeletedFilter(userId, false)
            .stream()
            .filter(a -> !a.getDate().isBefore(sd) && !a.getDate().isAfter(ed))
            .collect(Collectors.toList());

        long total = appointments.size();
        long attended = appointments.stream()
            .filter(a -> a.getAttendanceStatus() == AttendanceStatus.ATTENDED)
            .count();
        long failed = appointmentRepository.countFailedByUser(userId, startDate, endDate);
        
        double failureRate = total > 0 ? (double) failed / total * 100 : 0.0;
        
        Double avgRating = appointmentRepository.getAverageUserRating(userId, startDate, endDate);

        return new UserAppointmentStats(
            total,
            attended,
            failed,
            failureRate,
            avgRating != null ? avgRating : 0.0
        );
    }

    /**
     * Notificar asignación de operario
     */
    private void notifyOperatorAssignment(Appointment appointment) {
        User operator = appointment.getOperator();
        
        String message = String.format(
            "Se te ha asignado una nueva cita:\n" +
            "Título: %s\n" +
            "Fecha: %s\n" +
            "Hora: %s - %s\n" +
            "Usuario: %s",
            appointment.getTitle(),
            appointment.getDate(),
            appointment.getStartTime(),
            appointment.getEndTime(),
            appointment.getUser().getFullName()
        );

        Notification notification = new Notification();
        notification.setUser(operator);
        notification.setAppointment(appointment);
        notification.setMessage(message);
        notification.setNotificationType(NotificationType.OPERATOR_ASSIGNED);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notificationService.save(notification);

        // Email al operario
        try {
            emailService.sendOperatorAssignmentEmail(
                operator.getEmail(),
                operator.getFullName(),
                appointment.getTitle(),
                appointment.getUser().getFullName(),
                appointment.getDate().toString(),
                appointment.getStartTime() + " - " + appointment.getEndTime(),
                appointment.getCategory() != null ? appointment.getCategory().getName() : null,
                appointment.getDescription()
            );
        } catch (Exception e) {
            logger.warn("No se pudo enviar email al operario: {}", e.getMessage());
        }
    }
    /**
     * Búsqueda avanzada de citas con paginación
     */
    public Page<Appointment> searchAppointments(
            Long userId,
            String roleName,
            String query,
            Long categoryId,
            Long operatorId,
            AppointmentStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return appointmentRepository.searchAppointments(
            userId,
            roleName,
            query,
            categoryId,
            operatorId,
            status,
            startDate,
            endDate,
            pageable
        );
    }
    /**
     * Obtener estadísticas del dashboard con filtros de tiempo
     */
    public DashboardStatsDTO getDashboardStats(Long userId, String roleName, 
                                            LocalDate startDate, LocalDate endDate) {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        
        // Obtener citas según el rol
        List<Appointment> appointments;
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            appointments = appointmentRepository.findAll().stream()
                .filter(a -> !a.getDeleted())
                .filter(a -> !a.getDate().isBefore(startDate) && !a.getDate().isAfter(endDate))
                .collect(Collectors.toList());
        } else if ("OPERARIO".equalsIgnoreCase(roleName)) {
            appointments = appointmentRepository.findByOperatorIdWithDeletedFilter(userId, false)
                .stream()
                .filter(a -> !a.getDate().isBefore(startDate) && !a.getDate().isAfter(endDate))
                .collect(Collectors.toList());
        } else {
            appointments = appointmentRepository.findByUserIdWithDeletedFilter(userId, false)
                .stream()
                .filter(a -> !a.getDate().isBefore(startDate) && !a.getDate().isAfter(endDate))
                .collect(Collectors.toList());
        }
        
        // Estadísticas básicas
        stats.setTotalAppointments((long) appointments.size());
        
        stats.setScheduledAppointments(
            appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .count()
        );
        
        stats.setCompletedAppointments(
            appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count()
        );
        
        stats.setCancelledAppointments(
            appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                .count()
        );
        
        stats.setFailedAppointments(
            appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.FAILED)
                .count()
        );
        
        // Tasas
        if (stats.getTotalAppointments() > 0) {
            stats.setCompletionRate(
                (double) stats.getCompletedAppointments() / stats.getTotalAppointments() * 100
            );
            
            long attended = appointments.stream()
                .filter(a -> a.getAttendanceStatus() == AttendanceStatus.ATTENDED)
                .count();
            stats.setAttendanceRate(
                (double) attended / stats.getTotalAppointments() * 100
            );
        } else {
            stats.setCompletionRate(0.0);
            stats.setAttendanceRate(0.0);
        }
        
        // Calificación promedio
        Double avgRating = appointments.stream()
            .filter(a -> {
                if ("OPERARIO".equalsIgnoreCase(roleName)) {
                    return a.getUserRating() != null;
                } else {
                    return a.getOperatorRating() != null;
                }
            })
            .mapToInt(a -> {
                if ("OPERARIO".equalsIgnoreCase(roleName)) {
                    return a.getUserRating();
                } else {
                    return a.getOperatorRating() != null ? a.getOperatorRating() : 0;
                }
            })
            .average()
            .orElse(0.0);
        stats.setAverageRating(avgRating);
        
        // Estadísticas de admin
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            stats.setTotalUsers(userService.countByRole("USUARIO"));
            stats.setTotalOperators(userService.countByRole("OPERARIO"));
            stats.setActiveUsers(userService.countActiveUsers());
        }
        
        // Distribución por categoría
        Map<String, Long> byCategory = appointments.stream()
            .filter(a -> a.getCategory() != null)
            .collect(Collectors.groupingBy(
                a -> a.getCategory().getName(),
                Collectors.counting()
            ));
        stats.setAppointmentsByCategory(byCategory);
        
        // Distribución por operario (top 5)
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            Map<String, Long> byOperator = appointments.stream()
                .filter(a -> a.getOperator() != null)
                .collect(Collectors.groupingBy(
                    a -> a.getOperator().getFullName(),
                    Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    Map.Entry::getValue,
                    (e1, e2) -> e1,
                    LinkedHashMap::new
                ));
            stats.setAppointmentsByOperator(byOperator);
        }
        
        // Tendencia de últimos 7 días
        Map<String, Long> byDay = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long count = appointments.stream()
                .filter(a -> a.getDate().equals(date))
                .count();
            byDay.put(date.toString(), count);
        }
        stats.setAppointmentsByDay(byDay);
        
        return stats;
    }
}