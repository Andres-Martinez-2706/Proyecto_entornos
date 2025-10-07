# 📅 **Proyecto entornos - Aplicacion de Citas**

Este proyecto implementa el **backend y frontend de un sistema de gestión de citas** con autenticación JWT, roles (admin y usuario), validación de horarios, notificaciones automáticas y envío de correos electrónicos.

## 🤝🏻 **Integrantes**

* Andres Felipe Martinez
* Harold Esteban Duran
* Luige Alejandro Velasco

## 💾 **Imagen del esquma inicial de la Base de Datos**

![Base_Datos](neondb-db.jpeg)

---

## 📘 **Appointments Backend**

Desarrollado en **Spring Boot (v3+)**, con base de datos **PostgreSQL** en la nube con **Neon postgreSQL** y seguridad basada en **JWT + BCrypt**.

---

### 🧩 **Características principales del Backend**

| Módulo                          | Descripción                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| 🔐 **Autenticación JWT**        | Registro y login de usuarios. Tokens firmados y validados con `io.jsonwebtoken`.   |
| 👥 **Roles**                    | `admin` y `usuario`, con permisos diferenciados.                                               |
| 📅 **Citas (Appointments)**     | CRUD completo con validación de duración mínima por cita (≥5 min) y sin solapamientos.                  |
| ✉️ **Notificaciones**           | Se crean automáticamente en BD y se envían por correo en creación, modificación o cancelación de citas. |
| 📨 **Correo (SMTP Gmail)**      | Envío de mensajes automáticos mediante `JavaMailSender`.                                       |
| ⚙️ **Seguridad**                | Protección por roles, JWT y endpoints configurados en `SecurityConfig`.                        |
| 🌐 **CORS global**              | Acceso controlado desde el frontend                                        |
| 📜 **Swagger**                  | Documentación automática y testing visual.                                                     |
| 🧱 **Base de datos PostgreSQL** | Gestión mediante `Spring Data JPA`.                                                            |

---

## 🧠 **Arquitectura del Proyecto**

```
appointments/
├── src/
│   ├── main/java/uis/edu/co/appointments/
│   │   ├── controller/         → Controladores REST (Auth, Appointment, Notification)
│   │   ├── models/             → Entidades JPA (User, Role, Appointment, Notification)
│   │   ├── repository/         → Interfaces JPA Repository
│   │   ├── security/           → Configuración JWT, filtros y autenticación
│   │   └── service/            → Lógica de negocio y correo
│   └── resources/
│       └── application.properties
├── pom.xml
└── README.md
```

---

### ⚙️ **Configuración inicial Backend**

### 🔧 Dependencias principales usadas (`pom.xml`)

* Spring Boot Starter Web
* Spring Boot Starter Security
* Spring Boot Starter Mail
* Spring Boot Starter Data JPA
* PostgreSQL Driver
* JJWT (0.11.5)
* Spring Security Crypto (para BCrypt)
* Swagger (springdoc-openapi)

---

## 🗄️ **Configuración de Base de Datos**

Tablas principales:

* `roles`
* `users`
* `appointments`
* `notifications`
* `categories`


---

## ⚙️ **Configuración del archivo `application.properties`**

```properties
spring.application.name=appointments
server.port=8080

# =====================
# BASE DE DATOS
# =====================
spring.datasource.url=jdbc:postgresql://ep-bold-brook-add31moy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
spring.datasource.username=neondb_owner
spring.datasource.password=npg_xW6yEcD1zmOi
spring.jpa.hibernate.ddl-auto=none  
spring.jpa.show-sql=true            
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# =====================
# JWT
# =====================
jwt.secret=mi_clave_secreta_para_el_proyecto_de_citas
jwt.expiration= 3600000

# =====================
# EMAIL (SMTP Gmail)
# =====================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tests.programacion.afmo@gmail.com
spring.mail.password=${SPRING_MAIL_PASSWORD} 
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# =====================
# CORS y LOGGING
# =====================
cors.allowed.origins=*
logging.level.root=INFO
logging.level.uis.edu.co.appointments=DEBUG
logging.pattern.console=%d{HH:mm:ss} [%level] %msg%n
```

---

### 🧩 **Autenticación y Seguridad**

### 🔐 Endpoints de autenticación

| Método | Endpoint         | Descripción                        | Acceso  |
| ------ | ---------------- | ---------------------------------- | ------- |
| `POST` | `/auth/register` | Registra un nuevo usuario          | Público |
| `POST` | `/auth/login`    | Inicia sesión y devuelve token JWT | Público |

Ejemplo de login:

```json
{
  "email": "usuario@demo.com",
  "password": "123456"
}
```

Respuesta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "usuario@demo.com",
  "role": "usuario"
}
```

---

## 📅 **Gestión de Citas**

### Endpoints principales

| Método   | Endpoint                 | Descripción                                      | Rol |
| -------- | ------------------------ | ------------------------------------------------ | --- |
| `GET`    | `/api/appointments`      | Lista citas (todas si es admin, propias si es usuario) | 🔒  |
| `GET`    | `/api/appointments/{id}` | Obtiene una cita por id                                 | 🔒  |
| `POST`   | `/api/appointments`      | Crea una cita                                    | 🔒  |
| `PUT`    | `/api/appointments/{id}` | Actualiza una cita                               | 🔒  |
| `DELETE` | `/api/appointments/{id}` | Cancela y elimina una cita                       | 🔒  |

### Validaciones aplicadas

* ⏰ **Duración mínima de una cita:** 5 minutos
* 🚫 **Sin solapamientos:** no se permiten citas que se crucen
* 🔁 **Actualización automática de `updated_at`**

---

## 📨 **Notificaciones**

Cada cita genera una notificación automáticamente:

| Evento          | Acción                                                  | Correo |
| --------------- | ------------------------------------------------------- | ------ |
| Cita creada     | Se guarda notificación                | ✅      |
| Cita modificada | Se actualiza notificación            | ✅      |
| Cita eliminada  | Se guarda notificación de cancelación  | ✅      |

### Endpoints de notificaciones

| Método  | Endpoint                       | Descripción                                |
| ------- | ------------------------------ | ------------------------------------------ |
| `GET`   | `/api/notifications`           | Lista todas las notificaciones del usuario |
| `PATCH` | `/api/notifications/{id}/read` | Marca una notificación como leída          |

---

## 👥 **Roles del sistema**

| Rol         | Permisos                                                       |
| ----------- | -------------------------------------------------------------- |
| **admin**   | Puede ver, crear, editar y eliminar citas de cualquier usuario |
| **usuario** | Solo puede ver, crear, editar y eliminar sus propias citas     |

---

## 🧩 **Swagger UI**

Disponible en:

```
/swagger-ui/index.html
```

Permite probar todos los endpoints y enviar tokens JWT fácilmente.
Se dejo como acceso abierto para facilitar el revisar la documentacion.

---

## 🧾 **Resumen técnico**

| Tecnología                  | Versión / Uso                      |
| --------------------------- | ---------------------------------- |
| Java                        | 17+                                |
| Spring Boot                 | 3.x                                |
| Spring Security             | Autenticación JWT + roles          |
| Spring Data JPA             | ORM y repositorios                 |
| PostgreSQL                  | Base de datos                      |
| JavaMailSender              | Envío de notificaciones por correo |
| Swagger (springdoc-openapi) | Documentación de API               |
| Maven                       | Gestor de dependencias             |

---

## 🧠 **Autor y Créditos**

Desarrollado bajo la guía del profesor **Carlos Adolfo Beltran castro — UIS**

Proyecto académico — Universidad Industrial de Santander 🟢
