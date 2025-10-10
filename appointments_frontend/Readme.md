# 📗 Frontend - Sistema de Gestión de Citas

Aplicación web SPA (Single Page Application) desarrollada con HTML5, CSS3 y JavaScript vanilla para la gestión de citas.

## 🎨 Características de UI/UX

- ✨ **Diseño Moderno**: Interfaz limpia y profesional
- 📱 **Responsive**: Adaptado a móvil, tablet y desktop
- 🎯 **Sidebar Desplegable**: Navegación intuitiva
- 🌙 **Estados Visuales**: Loading, empty states, mensajes de éxito/error
- ⚡ **Interactivo**: Animaciones suaves y transiciones
- 🔔 **Notificaciones en Tiempo Real**: Badge actualizado automáticamente
- 🎨 **Sistema de Variables CSS**: Fácil personalización de colores

## 📁 Estructura de Archivos

```
appointments_frontend/
├── index.html              # Landing + Login/Register
├── home.html               # Dashboard principal
├── appointments.html       # Gestión de citas
├── notifications.html      # Notificaciones
├── profile.html            # Perfil de usuario
│
├── css/
│   └── styles.css         # Estilos completos (~1200 líneas)
│
└── js/
    ├── api.js             # Cliente API REST
    ├── auth.js            # Autenticación y sesión
    ├── ui.js              # Utilidades de interfaz
    ├── appointments.js    # Lógica de citas
    ├── notifications.js   # Lógica de notificaciones
    └── profile.js         # Lógica de perfil
```
---

## 📄 Páginas

### 1. **index.html** - Landing Page

#### Componentes:
- **Hero Section**: Presentación del sistema
- **Features Grid**: Características principales
- **Modal Login**: Formulario de inicio de sesión
- **Modal Register**: Formulario de registro

#### Funcionalidad:
- Redirección automática si ya está autenticado
- Validación de formularios
- Alternancia entre login y registro
- Mensajes de error personalizados

#### Código de Ejemplo:
```javascript
// Login
Auth.login(email, password)
  .then(result => {
    if (result.success) {
      window.location.href = 'home.html';
    }
  });
```

---

### 2. **home.html** - Dashboard

#### Secciones:
- **Welcome Section**: Descripción y features
- **Upcoming Appointments**: Citas próximas (7 días)
- **Admin Stats** (solo admin): Estadísticas del sistema

#### Funcionalidad:
- Carga automática de citas próximas
- Estadísticas en tiempo real para admin
- Cards interactivas con estados visuales
- Redirección a gestión de citas

#### API Calls:
```javascript
// Citas próximas
API.getUpcomingAppointments()

// Estadísticas (admin)
API.getUserStats()
API.getAppointments(true)
```

---

### 3. **appointments.html** - Gestión de Citas

#### Componentes:
- **Filtros**: Por estado y incluir eliminadas
- **Grid de Citas**: Cards con información completa
- **Modal Crear/Editar**: Formulario de cita
- **Modal Admin**: Formulario con observación
- **Modal Eliminar**: Confirmación con observación (admin)
- **Modal Detalles**: Vista completa de la cita

#### Funcionalidad:

- **Usuarios**:
  - Ver solo sus citas
  - Crear, editar, eliminar propias citas
  - Ver observaciones del admin
- **Admin**:
  - Ver todas las citas
  - Modificar/eliminar cualquier cita
  - Agregar observaciones obligatorias
  - Ver usuario de cada cita

#### Estados de Cita:
- 🔵 **Pendiente**: Cita programada
- ✅ **Confirmada**: Confirmada por sistema
- ✔️ **Terminada**: Cita completada
- ❌ **Cancelada**: Cita cancelada/eliminada

#### Validaciones:
- Duración mínima: 5 minutos
- Fecha no puede ser pasada
- No solapamiento de horarios
- Campos obligatorios

---

### 4. **notifications.html** - Notificaciones

#### Componentes:
- **Filtros**: Todas, No leídas, De admin
- **Contadores**: Badge con cantidad por categoría
- **Lista de Notificaciones**: Cards interactivas
- **Modal Detalle**: Información completa
- **Acciones**: Marcar leída, eliminar

#### Tipos de Notificaciones:
- 📧 **SYSTEM**: Notificaciones del sistema
- ⚠️ **ADMIN_MODIFICATION**: Modificación por admin
- ❌ **ADMIN_CANCELLATION**: Cancelación por admin
- ⏰ **REMINDER_DAY**: Recordatorio 1 día antes
- 🔔 **REMINDER_HOUR**: Recordatorio X horas antes

#### Funcionalidad:
- Marcar como leída al hacer clic
- Marcar todas como leídas
- Eliminar notificaciones
- Filtrado en tiempo real
- Badge actualizado cada 60 segundos

---

### 5. **profile.html** - Perfil de Usuario

#### Secciones:
- **User Card**: Avatar, nombre, email, rol
- **Notification Preferences**: Configurar horas de recordatorio
- **Change Email**: Actualizar correo electrónico
- **Change Password**: Cambiar contraseña
- **Danger Zone**: Información de soporte

#### Funcionalidad:
- Avatar con iniciales automáticas
- Validaciones en tiempo real
- Mensajes de éxito temporales
- Actualización de sesión tras cambios

---

## 🔧 Módulos JavaScript

### 1. **api.js** - Cliente API

```javascript
// Configuración
const API = {
  getToken() { ... },
  getHeaders() { ... },
  request(endpoint, options) { ... },
  
  // HTTP Methods
  get(endpoint) { ... },
  post(endpoint, data) { ... },
  put(endpoint, data) { ... },
  patch(endpoint, data) { ... },
  delete(endpoint) { ... },
  
  // Endpoints específicos
  login(email, password) { ... },
  getMyProfile() { ... },
  getAppointments() { ... },
  // ... etc
};
```

#### Uso:
```javascript
// GET
const appointments = await API.getAppointments();

// POST
const newAppointment = await API.createAppointment({
  title: "Reunión",
  date: "2025-02-20",
  startTime: "10:00",
  endTime: "11:00"
});

// Con manejo de errores
try {
  const data = await API.getMyProfile();
} catch (error) {
  if (error instanceof APIError) {
    console.error(error.message, error.status);
  }
}
```

---

### 2. **auth.js** - Autenticación

```javascript
const Auth = {
  // Sesión
  saveSession(token, userId, email, fullName, role) { ... },
  getSession() { ... },
  clearSession() { ... },
  
  // Estado
  isAuthenticated() { ... },
  isAdmin() { ... },
  
  // Acciones
  login(email, password) { ... },
  register(fullName, email, password) { ... },
  logout() { ... },
  
  // Redirecciones
  checkAuthAndRedirect() { ... }
};
```

#### Flujo de Autenticación:
```javascript
// 1. Login
const result = await Auth.login(email, password);
if (result.success) {
  // Token guardado en localStorage
  window.location.href = 'home.html';
}

// 2. Verificar en cada página
Auth.checkAuthAndRedirect(); // Redirige si no está autenticado

// 3. Obtener datos de sesión
const session = Auth.getSession();
console.log(session.fullName, session.role);

// 4. Logout
Auth.logout(); // Limpia localStorage y redirige
```

---

### 3. **ui.js** - Utilidades de Interfaz

```javascript
const UI = {
  // Sidebar
  initSidebar() { ... },
  
  // Modales
  openModal(modalId) { ... },
  closeModal(modalId) { ... },
  
  // Mensajes
  showError(elementId, message) { ... },
  showSuccess(elementId, message) { ... },
  clearError(elementId) { ... },
  
  // Estados
  showLoading(elementId) { ... },
  hideLoading(elementId) { ... },
  showEmpty(elementId) { ... },
  
  // Formateo
  formatDate(dateString) { ... },
  formatTime(timeString) { ... },
  formatDateTime(dateTimeString) { ... },
  formatRelativeTime(dateTimeString) { ... },
  
  // Utilidades
  escapeHtml(text) { ... },
  truncateText(text, maxLength) { ... },
  disableButton(button, text) { ... },
  enableButton(button) { ... }
};
```

#### Ejemplos de Uso:
```javascript
// Abrir modal
UI.openModal('appointmentModal');

// Mostrar error
UI.showError('formError', 'Campos obligatorios faltantes');

// Formatear fecha
const formatted = UI.formatDate('2025-02-20'); // "20 de febrero de 2025"

// Tiempo relativo
const relative = UI.formatRelativeTime('2025-01-15T10:00:00'); // "Hace 2 días"

// Deshabilitar botón durante operación
UI.disableButton(submitBtn, 'Guardando...');
await API.createAppointment(data);
UI.enableButton(submitBtn);
```

---

### 4. **appointments.js** - Lógica de Citas

```javascript
const Appointments = {
  // Estado
  categories: [],
  currentAppointments: [],
  currentFilter: 'Pendiente',
  
  // Inicialización
  initHome() { ... },
  initAppointments() { ... },
  
  // Carga de datos
  loadUpcomingAppointments() { ... },
  loadAppointments() { ... },
  loadCategories() { ... },
  
  // Filtros
  filterAppointments() { ... },
  
  // Modales
  showCreateModal() { ... },
  showEditModal(id) { ... },
  showAdminEditModal(id) { ... },
  showDeleteModal(id) { ... },
  viewDetails(id) { ... },
  
  // Acciones
  handleSaveAppointment(event) { ... },
  handleAdminEdit(event) { ... },
  handleDeleteAppointment() { ... }
};
```

---

### 5. **notifications.js** - Lógica de Notificaciones

```javascript
const Notifications = {
  // Estado
  currentNotifications: [],
  currentFilter: 'all',
  
  // Inicialización
  init() { ... },
  
  // Carga de datos
  loadNotifications() { ... },
  filterNotifications() { ... },
  updateCounts() { ... },
  
  // Acciones
  viewNotification(id) { ... },
  markAsRead(id) { ... },
  markAllAsRead() { ... },
  showDeleteModal(id) { ... },
  handleDeleteNotification() { ... }
};
```

---

### 6. **profile.js** - Lógica de Perfil

```javascript
const Profile = {
  // Estado
  currentUser: null,
  
  // Inicialización
  init() { ... },
  loadProfile() { ... },
  displayProfile() { ... },
  
  // Acciones
  updateReminderPreference() { ... },
  handleChangeEmail(event) { ... },
  handleChangePassword(event) { ... },
  
  // Utilidades
  getInitials(fullName) { ... }
};
```

---

## 🔐 Seguridad Frontend

### 1. **Token JWT**
```javascript
// Almacenado en localStorage
localStorage.setItem('token', token);

// Enviado en cada petición
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 2. **Protección XSS**
```javascript
// Escapar HTML
UI.escapeHtml(userInput); // Previene inyección de scripts
```

### 3. **Validaciones**
- Email: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Contraseña: mínimo 6 caracteres
- Campos obligatorios antes de enviar
- Validación de tipos de datos

### 4. **Redirecciones Automáticas**
```javascript
// Proteger páginas de la app
if (!Auth.isAuthenticated()) {
  window.location.href = 'index.html';
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Desktop: > 1024px (por defecto) */

/* Tablet: ≤ 1024px */
@media (max-width: 1024px) { ... }

/* Mobile: ≤ 768px */
@media (max-width: 768px) {
  /* Sidebar se oculta */
  /* Botones full-width */
  /* Grid a 1 columna */
}

/* Small Mobile: ≤ 480px */
@media (max-width: 480px) {
  /* Padding reducido */
  /* Font-size más pequeño */
}
```

### Características Responsive
- **Sidebar**: Overlay en móvil, fijo en desktop
- **Grid**: Auto-ajuste de columnas
- **Forms**: Inputs full-width en móvil
- **Tables**: Scroll horizontal si es necesario
- **Modales**: Márgenes ajustados en móvil

---

## 🔄 Flujos de Usuario

### Flujo: Crear Cita
```
1. Usuario hace clic en "Nueva Cita"
2. Se abre modal con formulario
3. Usuario completa datos:
   - Título (obligatorio)
   - Descripción (opcional)
   - Categoría (opcional)
   - Fecha (obligatoria, mínimo hoy)
   - Hora inicio/fin (obligatorias, mín 5 min)
4. Click en "Guardar"
5. Validación frontend
6. POST /api/appointments
7. Backend valida y crea cita
8. Backend programa notificaciones automáticas
9. Backend envía email de confirmación
10. Frontend cierra modal y recarga lista
11. Mensaje de éxito
```

### Flujo: Admin Modifica Cita
```
1. Admin hace clic en "Editar" de una cita
2. Se abre modal especial de admin
3. Admin modifica datos
4. Admin escribe observación (obligatoria)
5. Click en "Guardar Cambios"
6. PUT /api/appointments/{id}/admin
7. Backend actualiza cita
8. Backend guarda observación
9. Backend crea notificación para usuario
10. Backend envía email al usuario
11. Frontend recarga lista
12. Mensaje de éxito
```

---

[⬅️ Volver al README Principal](../README.md)