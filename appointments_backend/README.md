# 📘 Backend - Sistema de Gestión de Citas

API REST desarrollada con **Spring Boot 3.5.6** para la gestión integral de citas con autenticación JWT, sistema de notificaciones automatizado, emails con plantillas HTML y gestión de horarios de operarios.

---

## 🏗️ Arquitectura del Sistema

```
appointments_backend/
├── src/main/java/uis/edu/co/appointments/
│   ├── controller/              # Endpoints REST
│   │   ├── AuthController.java
│   │   ├── UserController.java
│   │   ├── AppointmentController.java
│   │   ├── NotificationController.java
│   │   ├── CategoryController.java
│   │   ├── OperatorScheduleController.java
│   │   └── RoleController.java
│   │
│   ├── models/                  # Entidades JPA
│   │   ├── User.java
│   │   ├── Role.java
│   │   ├── Appointment.java
│   │   ├── AppointmentStatus.java
│   │   ├── AttendanceStatus.java
│   │   ├── Category.java
│   │   ├── Notification.java
│   │   ├── NotificationType.java
│   │   └── OperatorSchedule.java
│   │
│   ├── repository/              # Acceso a datos (JPA)
│   │   ├── UserRepository.java
│   │   ├── RoleRepository.java
│   │   ├── AppointmentRepository.java
│   │   ├── CategoryRepository.java
│   │   ├── NotificationRepository.java
│   │   └── OperatorScheduleRepository.java
│   │
│   ├── service/                 # Lógica de negocio
│   │   ├── UserService.java
│   │   ├── AppointmentService.java
│   │   ├── NotificationService.java
│   │   ├── NotificationSchedulerService.java
│   │   ├── ScheduledTasksService.java
│   │   ├── EmailService.java
│   │   ├── CategoryService.java
│   │   ├── OperatorScheduleService.java
│   │   └── RoleService.java
│   │
│   ├── security/                # Seguridad JWT
│   │   ├── SecurityConfig.java
│   │   ├── JwtUtils.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── CustomUserDetailsService.java
│   │   └── UserDetailsImpl.java
│   │
│   ├── dto/                     # Data Transfer Objects
│   │   ├── ApiResponse.java
│   │   ├── CompleteAppointmentRequest.java
│   │   ├── RateOperatorRequest.java
│   │   ├── AssignCategoriesRequest.java
│   │   ├── UpdateDurationsRequest.java
│   │   ├── NotificationPreferencesRequest.java
│   │   ├── CreateOperatorRequest.java
│   │   ├── DashboardStatsDTO.java
│   │   ├── OperatorStats.java
│   │   └── UserAppointmentStats.java
│   │
│   ├── util/                    # Utilidades
│   │   └── DateRangeHelper.java
│   │
│   └── AppointmentsApplication.java
│
└── src/main/resources/
    ├── application.properties
    └── templates/               # Plantillas Thymeleaf
        ├── appointment-notification.html
        ├── completion-reminder.html
        ├── operator-assignment.html
        └── rating-received.html
```

---

## 🗄️ Modelo de Datos Completo

### Diagrama de Relaciones

```
roles ──< users ──< appointments ──< notifications
                │        │
                │        └──> categories
                │
                ├──< operator_schedules
                └──< operator_categories >── categories
```

### 📋 Tabla `users`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Long | PK, auto-increment |
| full_name | String(150) | Nombre completo |
| email | String(100) | Único, índice |
| password_hash | String | Hash BCrypt |
| role_id | Long | FK → roles.id |
| reminder_hours | Integer | 1-6 horas (default: 1) |
| email_notifications_enabled | Boolean | Notificaciones por email |
| in_app_notifications_enabled | Boolean | Notificaciones in-app |
| reminder_day_before_enabled | Boolean | Recordatorio 1 día antes |
| reminder_hours_before_enabled | Boolean | Recordatorio X horas antes |
| notification_types_enabled | JSONB | Tipos de notificaciones |
| total_appointments | Integer | Contador de citas |
| attended_appointments | Integer | Citas atendidas |
| failed_appointments | Integer | Inasistencias |
| average_rating | Double | Calificación promedio |
| total_ratings | Integer | Total de calificaciones |
| active | Boolean | Estado activo/inactivo |
| created_at | Timestamp | Fecha de registro |

### 📅 Tabla `appointments`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Long | PK, auto-increment |
| user_id | Long | FK → users.id |
| operator_id | Long | FK → users.id (operario) |
| category_id | Long | FK → categories.id |
| title | String(200) | Título de la cita |
| description | Text | Descripción opcional |
| date | Date | Fecha de la cita |
| start_time | Time | Hora de inicio |
| end_time | Time | Hora de fin |
| duration_minutes | Integer | Duración en minutos |
| status | Enum | SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED/FAILED |
| attendance_status | Enum | PENDING/ATTENDED/NOT_ATTENDED |
| operator_observation | Text | Observación del operario |
| operator_rating | Integer | Calificación al usuario (1-5) |
| user_observation | Text | Observación del usuario |
| user_rating | Integer | Calificación al operario (1-5) |
| completed_by_operator | Boolean | Completada por operario |
| completed_at | Timestamp | Fecha de completado |
| admin_observation | Text | Observación del admin |
| deleted | Boolean | Soft-delete flag |
| deleted_at | Timestamp | Fecha de eliminación |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

### 🏷️ Tabla `categories`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Long | PK, auto-increment |
| name | String(100) | Único, índice |
| description | Text | Descripción opcional |
| allowed_durations | JSONB | Lista de duraciones permitidas (minutos) |

### 🔔 Tabla `notifications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Long | PK, auto-increment |
| user_id | Long | FK → users.id |
| appointment_id | Long | FK → appointments.id (nullable) |
| message | Text | Contenido |
| type | String(50) | Tipo de notificación |
| is_read | Boolean | Estado de lectura |
| is_sent | Boolean | Enviada por email |
| scheduled_for | Timestamp | Fecha programada de envío |
| metadata | Text | Información adicional (JSON) |
| created_at | Timestamp | Fecha de creación |

### ⏰ Tabla `operator_schedules`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Long | PK, auto-increment |
| operator_id | Long | FK → users.id |
| day_of_week | Enum | MONDAY-SUNDAY |
| start_time | Time | Hora de inicio |
| end_time | Time | Hora de fin |
| active | Boolean | Estado activo |
| created_at | Timestamp | Fecha de creación |

### 👥 Tabla `operator_categories` (Relación Many-to-Many)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| operator_id | Long | FK → users.id |
| category_id | Long | FK → categories.id |

---

## 🔌 API Endpoints Detallados

### 🔐 Autenticación (`/auth`)

#### POST `/auth/login`
Iniciar sesión con JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "email": "user@example.com",
  "fullName": "Juan Pérez",
  "role": "USUARIO"
}
```

**Errores:**
- `401 Unauthorized` - Credenciales inválidas

---

#### POST `/auth/register`
Registrar nuevo usuario (rol USUARIO por defecto).

**Request Body:**
```json
{
  "fullName": "Juan Pérez",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Juan Pérez"
  }
}
```

---

### 👤 Usuarios (`/api/users`)

**Autenticación requerida en todos los endpoints**

#### GET `/api/users/me`
Obtener perfil del usuario autenticado.

**Response 200:**
```json
{
  "id": 1,
  "fullName": "Juan Pérez",
  "email": "user@example.com",
  "role": {
    "id": 3,
    "name": "USUARIO"
  },
  "reminderHours": 1,
  "emailNotificationsEnabled": true,
  "inAppNotificationsEnabled": true,
  "reminderDayBeforeEnabled": true,
  "reminderHoursBeforeEnabled": true,
  "totalAppointments": 10,
  "attendedAppointments": 8,
  "failedAppointments": 2,
  "averageRating": 4.5,
  "active": true,
  "createdAt": "2025-01-15T10:00:00"
}
```

---

#### GET `/api/users` 🔒 ADMIN
Listar todos los usuarios.

**Response 200:**
```json
[
  {
    "id": 1,
    "fullName": "Juan Pérez",
    "email": "user@example.com",
    "role": { "id": 3, "name": "USUARIO" },
    "active": true
  }
]
```

---

#### GET `/api/users/search` 🔒 ADMIN
Búsqueda avanzada con paginación.

**Query Params:**
- `query` - Búsqueda en nombre o email
- `roleName` - Filtrar por rol (ADMIN/OPERARIO/USUARIO)
- `active` - Filtrar por estado (true/false)
- `page` - Número de página (0-indexed, default: 0)
- `size` - Tamaño de página (default: 10)
- `sort` - Campo y dirección (ej: "fullName,asc")

**Response 200:**
```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalPages": 5,
  "totalElements": 50
}
```

---

#### POST `/api/users/create-operator` 🔒 ADMIN
Crear usuario operario.

**Request Body:**
```json
{
  "fullName": "María López",
  "email": "maria@example.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Operario creado exitosamente",
  "data": { ... }
}
```

---

#### PATCH `/api/users/{id}/categories` 🔒 ADMIN
Asignar categorías a operario.

**Request Body:**
```json
{
  "categoryIds": [1, 2, 3]
}
```

---

#### PATCH `/api/users/{id}/active-status` 🔒 ADMIN
Activar/desactivar usuario.

**Query Params:**
- `active` - true/false

---

#### PATCH `/api/users/{id}/change-role` 🔒 ADMIN
Cambiar rol de usuario.

**Query Params:**
- `roleName` - ADMIN/OPERARIO/USUARIO

---

#### PATCH `/api/users/{id}/notification-preferences`
Actualizar preferencias de notificaciones.

**Request Body:**
```json
{
  "reminderHours": 2,
  "emailNotificationsEnabled": true,
  "inAppNotificationsEnabled": true,
  "reminderDayBeforeEnabled": true,
  "reminderHoursBeforeEnabled": true,
  "notificationTypesEnabled": [
    "SYSTEM",
    "REMINDER_DAY",
    "REMINDER_HOUR"
  ]
}
```

---

#### GET `/api/users/operators`
Listar operarios activos (todos los roles autenticados).

**Response 200:**
```json
[
  {
    "id": 2,
    "fullName": "María López",
    "email": "maria@example.com",
    "averageRating": 4.8,
    "totalAppointments": 50
  }
]
```

---

#### GET `/api/users/operators/by-category/{categoryId}`
Obtener operarios por categoría.

---

### 📅 Citas (`/api/appointments`)

#### GET `/api/appointments`
Listar citas según rol:
- **ADMIN**: Todas las citas
- **OPERARIO**: Citas asignadas al operario
- **USUARIO**: Solo citas propias

**Query Params:**
- `includeDeleted` - Incluir eliminadas (default: false)

**Response 200:**
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "fullName": "Juan Pérez",
      "email": "user@example.com"
    },
    "operator": {
      "id": 2,
      "fullName": "María López",
      "email": "maria@example.com",
      "averageRating": 4.8
    },
    "category": {
      "id": 1,
      "name": "Consulta Médica"
    },
    "title": "Chequeo anual",
    "description": "Control de rutina",
    "date": "2025-02-15",
    "startTime": "10:00:00",
    "endTime": "11:00:00",
    "durationMinutes": 60,
    "status": "SCHEDULED",
    "attendanceStatus": "PENDING",
    "deleted": false,
    "createdAt": "2025-01-15T10:00:00"
  }
]
```

---

#### GET `/api/appointments/upcoming`
Citas próximas (siguientes 7 días).

---

#### GET `/api/appointments/{id}`
Detalle de una cita.

---

#### POST `/api/appointments`
Crear nueva cita.

**Request Body:**
```json
{
  "user": { "id": 1 },
  "category": { "id": 1 },
  "operator": { "id": 2 },
  "title": "Consulta general",
  "description": "Revisión anual",
  "date": "2025-02-20",
  "startTime": "14:00:00",
  "endTime": "15:00:00",
  "durationMinutes": 60
}
```

**Notas:**
- Si `operator` no se especifica, se asigna automáticamente
- Validaciones automáticas de disponibilidad
- Genera notificaciones programadas
- Envía emails de confirmación

**Response 201:**
```json
{
  "success": true,
  "message": "Cita creada exitosamente",
  "data": { ... }
}
```

---

#### PUT `/api/appointments/{id}`
Actualizar cita.
- **USUARIO**: Solo sus citas programadas
- **OPERARIO**: Solo citas asignadas (programadas)
- **ADMIN**: Cualquier cita

---

#### DELETE `/api/appointments/{id}`
Cancelar cita (soft-delete).
- **USUARIO**: Solo sus citas programadas
- **ADMIN**: Cualquier cita programada
- **OPERARIO**: No puede cancelar

---

#### POST `/api/appointments/{id}/complete` 🔒 OPERARIO
Completar cita.

**Request Body:**
```json
{
  "attended": true,
  "operatorObservation": "Cita completada sin novedades",
  "operatorRating": 5
}
```

**Validaciones:**
- Solo el operario asignado
- Solo citas programadas
- Actualiza estadísticas del usuario

---

#### PATCH `/api/appointments/{id}/rate-operator` 🔒 USUARIO
Calificar operario.

**Request Body:**
```json
{
  "rating": 5,
  "observation": "Excelente atención"
}
```

**Validaciones:**
- Solo el usuario de la cita
- Solo citas completadas
- Solo si asistió
- Solo una vez

---

#### GET `/api/appointments/pending-completion` 🔒 OPERARIO
Citas pendientes de completar del operario autenticado.

---

#### GET `/api/appointments/available-operators`
Buscar operarios disponibles.

**Query Params:**
- `categoryId` - ID de categoría (requerido)
- `date` - Fecha ISO (requerido)
- `startTime` - Hora ISO (requerido)
- `durationMinutes` - Duración (requerido)

**Response 200:**
```json
{
  "success": true,
  "message": "Operario disponible encontrado",
  "data": {
    "id": 2,
    "fullName": "María López",
    "email": "maria@example.com",
    "averageRating": 4.8
  }
}
```

---

#### GET `/api/appointments/search`
Búsqueda avanzada con paginación.

**Query Params:**
- `query` - Búsqueda en título/descripción
- `categoryId` - Filtrar por categoría
- `operatorId` - Filtrar por operario (admin)
- `status` - Filtrar por estado
- `startDate` - Fecha inicio
- `endDate` - Fecha fin
- `page`, `size`, `sort` - Paginación

**Response 200:**
```json
{
  "content": [...],
  "totalPages": 10,
  "totalElements": 100
}
```

---

#### GET `/api/appointments/dashboard/stats`
Estadísticas del dashboard con filtros temporales.

**Query Params:**
- `period` - "7d", "30d", "6m", "1y", "custom" (default: "30d")
- `customStart` - Fecha inicio (si period es "custom")
- `customEnd` - Fecha fin (si period es "custom")

**Response 200:**
```json
{
  "totalAppointments": 150,
  "scheduledAppointments": 45,
  "completedAppointments": 100,
  "cancelledAppointments": 3,
  "failedAppointments": 2,
  "completionRate": 66.67,
  "attendanceRate": 98.0,
  "averageRating": 4.5,
  "totalUsers": 200,
  "totalOperators": 15,
  "activeUsers": 180,
  "appointmentsByCategory": {
    "Consulta Médica": 50,
    "Terapia": 30,
    "Control": 25
  },
  "appointmentsByOperator": {
    "María López": 40,
    "Juan García": 35
  },
  "appointmentsByDay": {
    "2025-01-13": 5,
    "2025-01-14": 8,
    "2025-01-15": 10
  }
}
```

---

#### GET `/api/appointments/operator-stats/{operatorId}` 🔒 OPERARIO/ADMIN
Estadísticas de operario.

**Query Params:**
- `startDate` - Fecha inicio (opcional)
- `endDate` - Fecha fin (opcional)

**Response 200:**
```json
{
  "totalAppointments": 50,
  "completedAppointments": 45,
  "failedAppointments": 3,
  "averageRating": 4.7,
  "userFailureRate": 6.0
}
```

---

#### GET `/api/appointments/user-stats/{userId}`
Estadísticas de usuario.

**Response 200:**
```json
{
  "totalAppointments": 20,
  "attendedAppointments": 18,
  "failedAppointments": 2,
  "failureRate": 10.0,
  "averageRating": 4.5
}
```

---

### 🔔 Notificaciones (`/api/notifications`)

#### GET `/api/notifications/me`
Notificaciones del usuario autenticado.

**Query Params:**
- `unreadOnly` - Solo no leídas (default: false)

**Response 200:**
```json
[
  {
    "id": 1,
    "user": { "id": 1 },
    "appointment": {
      "id": 1,
      "title": "Consulta médica"
    },
    "message": "Recordatorio: Tienes una cita mañana...",
    "type": "REMINDER_DAY",
    "isRead": false,
    "isSent": true,
    "createdAt": "2025-02-14T09:00:00"
  }
]
```

---

#### GET `/api/notifications/me/unread-count`
Contador de notificaciones no leídas.

**Response 200:**
```json
{
  "count": 5
}
```

---

#### PATCH `/api/notifications/{id}/read`
Marcar notificación como leída.

---

#### PATCH `/api/notifications/me/read-all`
Marcar todas las notificaciones como leídas.

---

#### DELETE `/api/notifications/{id}`
Eliminar notificación.

---

### 📁 Categorías (`/api/categories`)

#### GET `/api/categories`
Listar todas las categorías (público).

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Consulta Médica",
    "description": "Consultas generales",
    "allowedDurations": [30, 60, 90]
  }
]
```

---

#### POST `/api/categories` 🔒 ADMIN
Crear categoría.

**Request Body:**
```json
{
  "name": "Terapia Física",
  "description": "Sesiones de terapia",
  "allowedDurations": [45, 60, 90]
}
```

---

#### PUT `/api/categories/{id}` 🔒 ADMIN
Actualizar categoría.

---

#### DELETE `/api/categories/{id}` 🔒 ADMIN
Eliminar categoría (solo si no tiene citas).

---

#### PATCH `/api/categories/{id}/durations` 🔒 ADMIN
Actualizar duraciones permitidas.

**Request Body:**
```json
{
  "allowedDurations": [30, 60, 90, 120]
}
```

---

#### GET `/api/categories/{id}/durations`
Obtener duraciones permitidas.

---

#### PATCH `/api/categories/{id}/operators` 🔒 ADMIN
Asignar operarios a categoría.

**Request Body:**
```json
{
  "categoryIds": [2, 3, 5]
}
```
*Nota: Se llama `categoryIds` pero son IDs de operarios (herencia del DTO)*

---

#### GET `/api/categories/{id}/operators`
Obtener operarios de una categoría.

---

### ⏰ Horarios de Operarios (`/api/operator-schedules`)

#### GET `/api/operator-schedules/me` 🔒 OPERARIO
Obtener horarios propios.

**Response 200:**
```json
[
  {
    "id": 1,
    "operator": { "id": 2, "fullName": "María López" },
    "dayOfWeek": "MONDAY",
    "startTime": "08:00:00",
    "endTime": "17:00:00",
    "active": true,
    "createdAt": "2025-01-10T10:00:00"
  }
]
```

---

#### GET `/api/operator-schedules/operator/{operatorId}`
Obtener horarios de un operario (admin o el mismo operario).

---

#### POST `/api/operator-schedules` 🔒 OPERARIO
Crear horario propio.

**Request Body:**
```json
{
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "17:00:00"
}
```

**Validaciones:**
- Duración mínima: 1 hora
- Duración máxima: 12 horas
- Sin solapamientos con otros horarios del mismo día
- Horario recomendado: 6:00 AM - 10:00 PM

---

#### PUT `/api/operator-schedules/{id}` 🔒 OPERARIO
Actualizar horario propio.

---

#### DELETE `/api/operator-schedules/{id}` 🔒 OPERARIO
Eliminar horario propio (soft-delete).

---

#### POST `/api/operator-schedules/validate` 🔒 OPERARIO
Validar horario sin guardarlo (útil para frontend).

**Request Body:**
```json
{
  "dayOfWeek": "TUESDAY",
  "startTime": "09:00:00",
  "endTime": "18:00:00"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Horario válido"
}
```

---

#### GET `/api/operator-schedules/availability/{operatorId}/{dayOfWeek}`
Verificar disponibilidad de operario en un día.

**Response 200:**
```json
{
  "operatorId": 2,
  "dayOfWeek": "MONDAY",
  "isWorking": true
}
```

---

## ⚙️ Configuración

### application.properties

```properties
# ==================== SERVIDOR ====================
server.port=8080

# ==================== BASE DE DATOS ====================
spring.datasource.url=jdbc:postgresql://localhost:5432/appointments_db
spring.datasource.username=postgres
spring.datasource.password=tu_password
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# ==================== JWT ====================
jwt.secret=tu_clave_secreta_minimo_256_bits_muy_segura
jwt.expiration=3600000

# ==================== EMAIL SMTP (Gmail) ====================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tu-email@gmail.com
spring.mail.password=${SPRING_MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.timeout=5000

# ==================== CORS ====================
cors.allowed.origins=http://localhost:5173,http://127.0.0.1:5173

# ==================== TAREAS PROGRAMADAS ====================
spring.task.scheduling.pool.size=3
scheduler.notification.check.interval=600000
scheduler.appointment.complete.interval=3600000
```

### Variables de Entorno

```bash
# Contraseña de aplicación de Gmail (no usar contraseña real)
export SPRING_MAIL_PASSWORD=tu_password_de_aplicacion_gmail
```

**Cómo obtener contraseña de aplicación en Gmail:**
1. Ir a [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Habilitar "Verificación en 2 pasos"
3. Ir a "Contraseñas de aplicaciones"
4. Generar contraseña para "Correo" - "Otro (nombre personalizado)"
5. Usar esa contraseña en `SPRING_MAIL_PASSWORD`

---

## 🔧 Servicios Principales

### AppointmentService
**Responsabilidades:**
- CRUD de citas con validaciones complejas
- Validación de solapamientos de horarios
- Asignación automática de operarios disponibles
- Validación de disponibilidad según horarios laborales
- Validación de categorías y duraciones permitidas
- Auto-completado de citas pasadas
- Gestión de estados y asistencias
- Cálculo de estadísticas
- Actualización de ratings

**Métodos clave:**
```java
Appointment save(Appointment) // Crear/actualizar con validaciones
void delete(Long id) // Soft-delete
Appointment completeAppointment(Long id, CompleteAppointmentRequest)
Appointment rateOperator(Long id, Integer rating, String observation)
User findAvailableOperator(Long categoryId, LocalDate, LocalTime, int duration)
boolean isOperatorAvailable(Long operatorId, LocalDate, LocalTime, LocalTime)
void autoCompleteAppointments() // Tarea programada
DashboardStatsDTO getDashboardStats(Long userId, String role, LocalDate, LocalDate)
```

---

### NotificationService
**Responsabilidades:**
- Creación de notificaciones in-app
- Marcado como leídas
- Limpieza de notificaciones antiguas (90 días)
- Gestión de notificaciones programadas

**Métodos clave:**
```java
Notification save(Notification)
void markAsRead(Long id)
void markAllAsReadByUserId(Long userId)
List<Notification> findUnreadByUserId(Long userId)
long countUnreadByUserId(Long userId)
void cleanOldNotifications() // Tarea programada
```

---

### NotificationSchedulerService
**Responsabilidades:**
- Programación de recordatorios automáticos
- Recordatorio 1 día antes (9:00 AM)
- Recordatorio X horas antes (configurable por usuario)
- Re-programación al modificar citas
- Envío de notificaciones programadas
- Respeto a preferencias de usuario

**Métodos clave:**
```java
void scheduleAppointmentNotifications(Appointment)
void rescheduleAppointmentNotifications(Appointment)
void sendScheduledNotifications() // Tarea programada cada 10 min
void cancelAppointmentNotifications(Long appointmentId)
```

**Lógica de programación:**
1. **Recordatorio 1 día antes**: Se programa para las 9:00 AM del día anterior
2. **Recordatorio X horas antes**: Según preferencia del usuario (1-6 horas)
3. Solo se envían si las preferencias del usuario lo permiten
4. Se respetan los tipos de notificaciones habilitados

---

### EmailService
**Responsabilidades:**
- Envío de emails con plantillas HTML Thymeleaf
- Templates personalizados según tipo de notificación
- Manejo de errores sin bloquear flujo principal
- Integración con SMTP (Gmail)

**Métodos clave:**
```java
void sendHtmlEmail(String to, String subject, String template, Map<String, Object> vars)
void sendAppointmentEmail(String to, String subject, String userName, ...)
void sendOperatorAssignmentEmail(String operatorEmail, ...)
void sendCompletionReminderEmail(String operatorEmail, ...)
void sendRatingReceivedEmail(String operatorEmail, ...)
```

**Plantillas disponibles:**
- `appointment-notification.html` - Notificaciones generales de citas
- `operator-assignment.html` - Asignación de cita a operario
- `completion-reminder.html` - Recordatorio de citas pendientes
- `rating-received.html` - Notificación de calificación recibida

---

### ScheduledTasksService
**Responsabilidades:**
- Auto-completado de citas pasadas (cada hora)
- Envío de notificaciones programadas (cada 10 minutos)
- Limpieza de notificaciones antiguas (domingos 2:00 AM)
- Health checks del sistema

**Tareas programadas:**
```java
@Scheduled(cron = "0 5 * * * *") // Cada hora a los 5 minutos
void autoCompleteExpiredAppointments()

@Scheduled(fixedDelayString = "${scheduler.notification.check.interval}")
void sendScheduledNotifications() // Cada 10 minutos

@Scheduled(cron = "0 0 2 * * SUN") // Domingos 2:00 AM
void cleanOldNotifications()
```

---

### UserService
**Responsabilidades:**
- Gestión CRUD de usuarios
- Registro con hash BCrypt
- Actualización de email y contraseña
- Gestión de preferencias de notificaciones
- Cambio de roles
- Asignación de categorías a operarios
- Cálculo y actualización de estadísticas
- Búsqueda y paginación

**Métodos clave:**
```java
User register(User)
User updatePassword(Long id, String current, String newPassword)
User updateEmail(Long id, String newEmail)
User updateNotificationPreferences(Long id, NotificationPreferencesRequest)
User changeUserRole(Long userId, String roleName)
User createOperator(String fullName, String email, String password)
void assignCategoriesToOperator(Long operatorId, List<Long> categoryIds)
void updateUserStats(Long userId)
void updateOperatorStats(Long operatorId)
List<User> getActiveOperators()
List<User> getOperatorsByCategory(Long categoryId)
Page<User> searchUsers(String query, String role, Boolean active, Pageable)
```

---

### OperatorScheduleService
**Responsabilidades:**
- Gestión de horarios laborales de operarios
- Validación de solapamientos
- Verificación de disponibilidad por día
- Validación de rangos horarios (max 12 horas)
- Soft-delete de horarios

**Métodos clave:**
```java
OperatorSchedule createSchedule(OperatorSchedule)
OperatorSchedule updateSchedule(Long id, OperatorSchedule)
void deleteSchedule(Long id)
List<OperatorSchedule> getOperatorSchedules(Long operatorId)
boolean isOperatorWorkingOn(Long operatorId, DayOfWeek day)
boolean isWithinOperatorSchedule(Long operatorId, DayOfWeek, LocalTime, LocalTime)
boolean hasScheduleConflict(Long operatorId, DayOfWeek, LocalTime, LocalTime)
```

---

### CategoryService
**Responsabilidades:**
- Gestión de categorías de servicios
- Configuración de duraciones permitidas
- Asignación de operarios a categorías
- Validación de uso antes de eliminar

**Métodos clave:**
```java
Category save(Category)
void delete(Long id)
void updateAllowedDurations(Long categoryId, List<Integer> durations)
List<Integer> getAllowedDurations(Long categoryId)
void assignOperators(Long categoryId, List<Long> operatorIds)
List<User> getOperatorsByCategory(Long categoryId)
```

---

## 🔒 Seguridad

### Autenticación JWT

**Características:**
- Tokens firmados con **HS256** (HMAC-SHA256)
- Secret key configurable en `application.properties`
- Expiración configurable (default: 1 hora)
- Claims incluidos: `id`, `role`, `name`, `email`

**Estructura del token:**
```json
{
  "sub": "user@example.com",
  "id": 1,
  "role": "USUARIO",
  "name": "Juan Pérez",
  "iat": 1642358400,
  "exp": 1642362000
}
```

**Uso:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

### Autorización por Roles

**Roles disponibles:**
- `ADMIN` - Acceso total al sistema
- `OPERARIO` - Gestión de horarios, completar citas, ver asignadas
- `USUARIO` - Crear citas, ver propias, calificar operarios

**Control de acceso:**
```java
@PreAuthorize("hasAuthority('ADMIN')")
@PreAuthorize("hasAnyAuthority('ADMIN', 'OPERARIO')")
```

**Matriz de permisos:**

| Endpoint | ADMIN | OPERARIO | USUARIO |
|----------|-------|----------|---------|
| `POST /auth/register` | ✅ | ✅ | ✅ |
| `GET /api/users` | ✅ | ❌ | ❌ |
| `POST /api/users/create-operator` | ✅ | ❌ | ❌ |
| `GET /api/appointments` | ✅ (todas) | ✅ (asignadas) | ✅ (propias) |
| `POST /api/appointments` | ✅ | ❌ | ✅ |
| `POST /api/appointments/{id}/complete` | ❌ | ✅ | ❌ |
| `PATCH /api/appointments/{id}/rate-operator` | ❌ | ❌ | ✅ |
| `POST /api/categories` | ✅ | ❌ | ❌ |
| `POST /api/operator-schedules` | ❌ | ✅ | ❌ |
| `GET /api/appointments/dashboard/stats` | ✅ | ✅ | ✅ |

---

### Encriptación

**BCrypt para contraseñas:**
- Algoritmo: BCrypt con salt automático
- Costo: 10 rondas (default de Spring Security)
- Validación en cambio de contraseña

```java
passwordEncoder.encode(password) // Al registrar
passwordEncoder.matches(current, stored) // Al validar
```

---

### CORS

**Configuración:**
```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowCredentials(true);
}
```

---

## 🔄 Flujos Principales

### 1. Registro y Login

```mermaid
sequenceDiagram
    Usuario->>Backend: POST /auth/register
    Backend->>DB: Hash password (BCrypt)
    Backend->>DB: Guardar usuario (rol: USUARIO)
    Backend-->>Usuario: 201 Created
    Usuario->>Backend: POST /auth/login
    Backend->>DB: Validar credenciales
    Backend->>JWT: Generar token (1h)
    Backend-->>Usuario: 200 OK + JWT token
```

---

### 2. Crear Cita con Asignación Automática

```mermaid
sequenceDiagram
    Usuario->>Backend: POST /api/appointments
    Backend->>Service: Validar categoría y horario
    Backend->>Service: Buscar operario disponible
    Service->>DB: Query operarios por categoría
    Service->>Service: Verificar horarios laborales
    Service->>Service: Verificar solapamientos
    Service-->>Backend: Operario disponible
    Backend->>DB: Guardar cita
    Backend->>Scheduler: Programar notificaciones
    DB->>DB: Crear notif (1 día antes)
    DB->>DB: Crear notif (X horas antes)
    Backend->>Email: Enviar confirmación usuario
    Backend->>Email: Enviar asignación operario
    Backend-->>Usuario: 201 Created + cita
```

---

### 3. Completar Cita (Operario)

```mermaid
sequenceDiagram
    Operario->>Backend: POST /api/appointments/{id}/complete
    Backend->>DB: Validar permisos (operario asignado)
    Backend->>DB: Actualizar cita (status, attendance)
    Backend->>DB: Guardar observación
    Backend->>Service: Actualizar stats usuario
    DB->>DB: Incrementar total/attended/failed
    Backend->>DB: Crear notificación para usuario
    Backend->>Email: Notificar usuario
    Backend-->>Operario: 200 OK + cita completada
```

---

### 4. Calificar Operario (Usuario)

```mermaid
sequenceDiagram
    Usuario->>Backend: PATCH /api/appointments/{id}/rate-operator
    Backend->>DB: Validar cita completada + asistió
    Backend->>DB: Guardar rating y observación
    Backend->>Service: Actualizar stats operario
    DB->>DB: Recalcular average_rating
    Backend->>DB: Crear notificación operario
    Backend->>Email: Notificar operario
    Backend-->>Usuario: 200 OK
```

---

### 5. Sistema de Notificaciones Programadas

```mermaid
sequenceDiagram
    Note over Scheduler: Cada 10 minutos
    Scheduler->>DB: Query notificaciones pendientes
    DB-->>Scheduler: Lista de notificaciones
    loop Para cada notificación
        Scheduler->>DB: Verificar preferencias usuario
        alt Email habilitado
            Scheduler->>Email: Enviar email HTML
        end
        alt In-app habilitado
            Scheduler->>DB: Marcar isSent = true
        end
    end
```

---

### 6. Auto-completar Citas Pasadas

```mermaid
sequenceDiagram
    Note over Scheduler: Cada hora (5 minutos)
    Scheduler->>DB: Query citas SCHEDULED pasadas
    DB-->>Scheduler: Lista de citas
    loop Para cada cita
        Scheduler->>DB: Actualizar status = COMPLETED
        Scheduler->>Log: Registrar auto-completado
    end
```

---

## 📧 Sistema de Emails

### Plantillas HTML Disponibles

#### 1. `appointment-notification.html`
**Uso:** Notificaciones generales de citas

**Variables Thymeleaf:**
```java
Map<String, Object> vars = Map.of(
    "nombre", "Juan Pérez",
    "titulo", "Cita creada",
    "tituloEmoji", "📅",
    "headerColor", "#10b981",
    "mensajePrincipal", "Tu cita ha sido creada exitosamente",
    "tituloCita", "Consulta general",
    "fecha", "2025-02-20",
    "hora", "14:00 - 15:00",
    "observacion", "Observaciones adicionales",
    "operatorName", "María López"
);
```

**Tipos de email:**
- `created` - Cita creada (verde)
- `modified` - Cita modificada (naranja)
- `cancelled` - Cita cancelada (rojo)
- `reminder` - Recordatorio (azul)

---

#### 2. `operator-assignment.html`
**Uso:** Notificar operario sobre nueva cita asignada

**Variables:**
```java
Map<String, Object> vars = Map.of(
    "operatorName", "María López",
    "appointmentTitle", "Consulta general",
    "userName", "Juan Pérez",
    "date", "2025-02-20",
    "time", "14:00 - 15:00",
    "category", "Medicina General",
    "description", "Chequeo anual"
);
```

---

#### 3. `completion-reminder.html`
**Uso:** Recordar operario sobre citas pendientes de completar

**Variables:**
```java
List<Map<String, String>> appointments = List.of(
    Map.of(
        "title", "Consulta #1",
        "date", "2025-01-15",
        "time", "10:00 - 11:00",
        "userName", "Juan Pérez"
    )
);

Map<String, Object> vars = Map.of(
    "operatorName", "María López",
    "pendingCount", 3,
    "appointments", appointments
);
```

---

#### 4. `rating-received.html`
**Uso:** Notificar operario sobre calificación recibida

**Variables:**
```java
Map<String, Object> vars = Map.of(
    "operatorName", "María López",
    "rating", 5,
    "appointmentTitle", "Consulta general",
    "date", "2025-02-20",
    "userName", "Juan Pérez",
    "observation", "Excelente atención"
);
```

---

### Configuración de Gmail

**Pasos para habilitar:**

1. **Habilitar verificación en 2 pasos**
   - Ir a [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Activar "Verificación en 2 pasos"

2. **Generar contraseña de aplicación**
   - En Seguridad → "Contraseñas de aplicaciones"
   - Seleccionar "Correo" y "Otro (nombre personalizado)"
   - Copiar la contraseña generada

3. **Configurar en application.properties**
   ```properties
   spring.mail.username=tu-email@gmail.com
   spring.mail.password=${SPRING_MAIL_PASSWORD}
   ```

4. **Variable de entorno**
   ```bash
   export SPRING_MAIL_PASSWORD=abcd efgh ijkl mnop
   ```

---

## 🔄 Tareas Programadas

### Expresiones Cron

| Tarea | Frecuencia | Cron | Descripción |
|-------|-----------|------|-------------|
| Auto-completar citas | Cada hora | `0 5 * * * *` | A los 5 minutos de cada hora |
| Enviar notificaciones | Cada 10 min | Configurable | `scheduler.notification.check.interval` |
| Limpiar notificaciones | Semanal | `0 0 2 * * SUN` | Domingos 2:00 AM |

---

### Auto-completar Citas

**Lógica:**
```java
@Scheduled(cron = "0 5 * * * *")
public void autoCompleteExpiredAppointments() {
    LocalDate today = LocalDate.now();
    LocalTime now = LocalTime.now();
    
    List<Appointment> expired = appointmentRepository
        .findAppointmentsToComplete(today, now);
    
    expired.forEach(apt -> {
        apt.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(apt);
    });
}
```

**Criterios:**
- Estado: `SCHEDULED`
- Fecha anterior a hoy, O
- Fecha de hoy + hora de fin < hora actual
- No eliminadas

---

### Enviar Notificaciones Programadas

**Lógica:**
```java
@Scheduled(fixedDelayString = "${scheduler.notification.check.interval:600000}")
public void sendScheduledNotifications() {
    LocalDateTime now = LocalDateTime.now();
    
    List<Notification> pending = notificationRepository
        .findPendingScheduledNotifications(now);
    
    pending.forEach(notif -> {
        User user = notif.getUser();
        
        // Verificar preferencias
        if (!user.getEmailNotificationsEnabled()) return;
        
        // Enviar email
        emailService.sendHtmlEmail(
            user.getEmail(),
            "Recordatorio de cita",
            Map.of(...)
        );
        
        notif.setIsSent(true);
        notificationRepository.save(notif);
    });
}
```

---

### Limpiar Notificaciones Antiguas

**Lógica:**
```java
@Scheduled(cron = "0 0 2 * * SUN")
public void cleanOldNotifications() {
    LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
    
    List<Notification> old = notificationRepository
        .findOldReadNotifications(cutoff);
    
    notificationRepository.deleteAll(old);
    
    logger.info("Eliminadas {} notificaciones antiguas", old.size());
}
```

**Criterios:**
- Notificaciones leídas (`isRead = true`)
- Antigüedad > 90 días

---

## 📊 Enumeraciones

### AppointmentStatus

```java
public enum AppointmentStatus {
    SCHEDULED,      // Programada
    IN_PROGRESS,    // En curso
    COMPLETED,      // Completada
    CANCELLED,      // Cancelada
    FAILED         // Fallida (inasistencia)
}
```

---

### AttendanceStatus

```java
public enum AttendanceStatus {
    PENDING,        // Pendiente
    ATTENDED,       // Asistió
    NOT_ATTENDED   // No asistió
}
```

---

### NotificationType

```java
public enum NotificationType {
    SYSTEM,                 // Notificaciones generales del sistema
    ADMIN_MODIFICATION,     // Admin modifica cita
    ADMIN_CANCELLATION,     // Admin cancela cita
    REMINDER_DAY,           // Recordatorio 1 día antes
    REMINDER_HOUR,          // Recordatorio X horas antes
    OPERATOR_ASSIGNED,      // Operario asignado
    OPERATOR_CHANGED,       // Operario reasignado
    COMPLETION_REQUIRED,    // Recordatorio completar
    RATING_RECEIVED        // Calificación recibida
}
```

---

## 🛠️ Utilidades

### DateRangeHelper

**Propósito:** Calcular rangos de fechas según período.

**Uso:**
```java
DateRange range = DateRangeHelper.getRange("30d", null, null);
LocalDate start = range.getStart();
LocalDate end = range.getEnd();
```

**Períodos soportados:**
- `7d` - Últimos 7 días
- `30d` - Últimos 30 días
- `3m` - Últimos 3 meses
- `6m` - Últimos 6 meses
- `1y` - Último año
- `custom` - Rango personalizado (requiere `startDate` y `endDate`)

---

### ApiResponse (DTO)

**Propósito:** Formato estándar para respuestas HTTP.

**Estructura:**
```java
{
  "success": true/false,
  "message": "Mensaje descriptivo",
  "data": { ... } // Opcional
}
```

**Métodos estáticos:**
```java
ApiResponse.success("Operación exitosa")
ApiResponse.success("Dato creado", objeto)
ApiResponse.error("Error al procesar")
ApiResponse.error("Error", detalles)
```

---

## 📦 Dependencias Maven

```xml
<!-- Spring Boot Starters -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Base de datos -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>

<!-- Utilidades -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>io.hypersistence</groupId>
    <artifactId>hypersistence-utils-hibernate-60</artifactId>
    <version>3.7.0</version>
</dependency>

<dependency>
    <groupId>me.paulschwarz</groupId>
    <artifactId>spring-dotenv</artifactId>
    <version>3.0.0</version>
</dependency>

<!-- Documentación -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>

<!-- Testing -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

---

## 🐛 Debugging y Logs

### Configuración de Logs

```properties
# application.properties
logging.level.root=INFO
logging.level.uis.edu.co.appointments=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

logging.file.name=logs/application.log
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
```

### Logs Importantes

**AppointmentService:**
```
Cita creada ID: 123, Operario: 2
Cita actualizada ID: 123
Auto-completada cita ID: 123
Operario calificado en cita ID: 123, Rating: 5
```

**EmailService:**
```
Email enviado exitosamente a: user@example.com
Email HTML enviado exitosamente a: user@example.com
Error al enviar email a user@example.com: ...
```

**ScheduledTasksService:**
```
Total de citas auto-completadas: 5
Notificaciones programadas enviadas: 10
Eliminadas 150 notificaciones antiguas
```

---

## 🔗 Integración con Frontend

### Headers Requeridos

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Ejemplo de Integración

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Crear cita
const createAppointment = async (appointmentData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8080/api/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  
  return await response.json();
};
```

---

**⬅️ [Volver al README Principal](../README.md)**