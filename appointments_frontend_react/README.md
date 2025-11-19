# 📅 Sistema de Gestión de Citas - Frontend

## 📋 Descripción

Aplicación web moderna para la gestión de citas desarrollada con **React + Vite**. Sistema completo con tres roles de usuario (Admin, Operario, Usuario) que permite agendar, gestionar y completar citas de manera eficiente.

## ✨ Características Principales

### 🔐 Autenticación y Autorización
- Sistema de login y registro
- Gestión de sesiones con JWT
- Tres roles de usuario: `ADMIN`, `OPERARIO`, `USUARIO`
- Rutas protegidas según rol

### 👤 Gestión de Usuarios
- Perfil de usuario editable
- Administración de usuarios (Admin)
- Creación y gestión de operarios
- Asignación de categorías a operarios

### 📅 Gestión de Citas
- Creación de citas con validaciones
- Selección automática o manual de operarios
- Verificación de disponibilidad en tiempo real
- Estados: Programada, Completada, Cancelada, Fallida
- Historial completo de citas

### ⏰ Horarios (Operarios)
- Definición de horarios semanales
- Validación de solapamientos
- Bloques de hasta 12 horas
- Gestión de disponibilidad por día

### 📂 Categorías de Servicio
- Creación y gestión de categorías
- Duraciones permitidas configurables
- Asignación de operarios por categoría

### 🔔 Sistema de Notificaciones
- Notificaciones en tiempo real
- Contador de no leídas
- Polling automático cada 30 segundos
- Notificaciones por eventos importantes

### ⭐ Sistema de Calificaciones
- Usuarios califican a operarios
- Operarios califican a usuarios
- Promedio de calificaciones visible
- Observaciones opcionales

### 📊 Estadísticas y Dashboard
- Dashboard personalizado por rol
- Estadísticas de citas
- Gráficos interactivos con Recharts
- Filtros de fecha personalizables

### 📆 Calendario Visual
- Vista de calendario mensual/semanal/diaria
- Integración con React Big Calendar
- Colores por estado de cita
- Selección de slots para crear citas

## 🛠️ Tecnologías Utilizadas

### Core
- **React 18** - Biblioteca principal
- **Vite** - Build tool y dev server
- **React Router DOM** - Navegación
- **Axios** - Cliente HTTP

### UI/UX
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast
- **React Hook Form** - Manejo de formularios

### Visualización
- **React Big Calendar** - Calendario
- **Recharts** - Gráficos y estadísticas
- **Moment.js** - Manejo de fechas

### Estado y Contexto
- **React Context API** - Gestión de estado global
- **Custom Hooks** - Lógica reutilizable

## 📁 Estructura del Proyecto

```
src/
├── api/                          # Servicios de API
│   ├── axiosConfig.js           # Configuración de Axios
│   ├── authService.js           # Autenticación
│   ├── appointmentService.js    # Citas
│   ├── categoryService.js       # Categorías
│   ├── userService.js           # Usuarios
│   ├── scheduleService.js       # Horarios
│   └── notificationService.js   # Notificaciones
│
├── components/                   # Componentes reutilizables
│   ├── common/                  # Componentes comunes
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Pagination.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Select.jsx
│   │   ├── Spinner.jsx
│   │   └── StarRating.jsx
│   │
│   ├── appointments/            # Componentes de citas
│   │   ├── AppointmentCalendar.jsx
│   │   ├── AppointmentCard.jsx
│   │   ├── AppointmentFilters.jsx
│   │   ├── AppointmentList.jsx
│   │   └── OperatorSelector.jsx
│   │
│   ├── forms/                   # Formularios
│   │   ├── AppointmentForm.jsx
│   │   ├── CategoryForm.jsx
│   │   ├── CompleteAppointmentForm.jsx
│   │   ├── ScheduleForm.jsx
│   │   └── UserForm.jsx
│   │
│   ├── layout/                  # Layout y navegación
│   │   ├── Header.jsx
│   │   ├── MainLayout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Sidebar.jsx
│   │
│   ├── notifications/           # Sistema de notificaciones
│   │   ├── NotificationBell.jsx
│   │   ├── NotificationItem.jsx
│   │   └── NotificationList.jsx
│   │
│   └── stats/                   # Estadísticas
│       ├── DateRangeFilter.jsx
│       ├── StatsCard.jsx
│       └── StatsChart.jsx
│
├── context/                     # Context API
│   ├── AuthContext.jsx         # Autenticación global
│   └── NotificationContext.jsx # Notificaciones globales
│
├── hooks/                       # Custom Hooks
│   ├── useDebounce.js
│   ├── usePagination.js
│   └── usePolling.js
│
├── pages/                       # Páginas/Vistas
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   │
│   ├── appointments/
│   │   ├── AppointmentsPage.jsx
│   │   ├── AppointmentDetailsPage.jsx
│   │   └── CreateAppointmentPage.jsx
│   │
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   │
│   ├── calendar/
│   │   └── CalendarPage.jsx
│   │
│   ├── schedule/
│   │   └── SchedulePage.jsx
│   │
│   ├── categories/
│   │   └── CategoriesPage.jsx
│   │
│   ├── users/
│   │   ├── UsersPage.jsx
│   │   └── OperatorsPage.jsx
│   │
│   ├── notifications/
│   │   └── NotificationsPage.jsx
│   │
│   ├── profile/
│   │   └── ProfilePage.jsx
│   │
│   └── stats/
│       └── StatsPage.jsx
│
├── utils/                       # Utilidades
│   ├── cn.js                   # Class names helper
│   ├── constants.js            # Constantes globales
│   ├── formatters.js           # Funciones de formato
│   └── validators.js           # Validaciones
│
├── App.jsx                      # Componente principal
├── main.jsx                     # Punto de entrada
└── index.css                    # Estilos globales
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Backend API corriendo (por defecto en `http://localhost:8080`)

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd appointments_frontend_react
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz:
```env
VITE_API_BASE_URL=http://localhost:8080
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:5173
```

### Build para Producción
```bash
npm run build
```

### Preview de producción
```bash
npm run preview
```

## 🔧 Configuración Detallada

### Axios Configuration (`axiosConfig.js`)
- Base URL configurable
- Interceptor de request (JWT automático)
- Interceptor de response (manejo de errores)
- Redirección automática en 401
- Mensajes de error personalizados

### Tailwind CSS (`tailwind.config.js`)
```javascript
colors: {
  primary: { 50-900 },   // Azul
  success: { 500-600 },  // Verde
  warning: { 500-600 },  // Amarillo
  danger: { 500-600 }    // Rojo
}
```

## 🎯 Roles y Permisos

### 👨‍💼 ADMIN
- ✅ Gestión completa de usuarios
- ✅ CRUD de categorías
- ✅ Asignación de categorías a operarios
- ✅ Visualización de todas las citas
- ✅ Estadísticas globales
- ✅ Gestión de operarios

### 👷 OPERARIO
- ✅ Gestión de horarios propios
- ✅ Ver citas asignadas
- ✅ Completar citas
- ✅ Calificar usuarios
- ✅ Estadísticas personales
- ❌ No puede gestionar usuarios

### 👤 USUARIO
- ✅ Crear citas
- ✅ Ver sus citas
- ✅ Cancelar citas programadas
- ✅ Calificar operarios
- ✅ Gestionar perfil
- ❌ No accede a administración

## 📱 Componentes Principales

### Common Components

#### Button
```jsx
<Button 
  variant="primary|secondary|success|danger|outline|ghost"
  size="sm|md|lg"
  loading={boolean}
  disabled={boolean}
>
  Texto
</Button>
```

#### Modal
```jsx
<Modal
  isOpen={boolean}
  onClose={function}
  title="string"
  size="sm|md|lg|xl|full"
  showCloseButton={boolean}
  closeOnOverlayClick={boolean}
>
  Contenido
</Modal>
```

#### StarRating
```jsx
<StarRating
  value={1-5}
  onChange={function}
  readOnly={boolean}
  size="sm|md|lg"
/>
```

### Appointment Components

#### AppointmentCalendar
- Vista mensual/semanal/diaria
- Colores por estado
- Click en eventos
- Selección de slots

#### OperatorSelector
- Búsqueda de operarios disponibles
- Verificación en tiempo real
- Modo manual o automático
- Filtros por categoría y horario

### Form Components

#### AppointmentForm
- Validación completa
- Selección de operario
- Duraciones dinámicas por categoría
- Verificación de disponibilidad

#### ScheduleForm
- Días de la semana
- Validación de horarios
- Prevención de solapamientos
- Máximo 12 horas por bloque

## 🌐 Rutas de la Aplicación

### Públicas
- `/login` - Inicio de sesión
- `/register` - Registro de usuario

### Protegidas (Todos los roles)
- `/dashboard` - Dashboard personalizado
- `/appointments` - Lista de citas
- `/appointments/create` - Crear cita
- `/appointments/:id` - Detalles de cita
- `/calendar` - Calendario visual
- `/notifications` - Centro de notificaciones
- `/profile` - Perfil de usuario

### Solo OPERARIO
- `/schedule` - Gestión de horarios

### Solo ADMIN
- `/categories` - Gestión de categorías
- `/users` - Gestión de usuarios
- `/operators` - Gestión de operarios

### ADMIN y OPERARIO
- `/stats` - Estadísticas avanzadas

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones
- `APPOINTMENT_CREATED` - Cita creada
- `APPOINTMENT_UPDATED` - Cita actualizada
- `APPOINTMENT_CANCELLED` - Cita cancelada
- `APPOINTMENT_REMINDER` - Recordatorio de cita
- `APPOINTMENT_COMPLETED` - Cita completada
- `SYSTEM` - Notificación del sistema

### Características
- Polling cada 30 segundos
- Contador en tiempo real
- Marcado individual o masivo
- Navegación a citas relacionadas
- Eliminación individual

## 📊 Gestión de Estado

### AuthContext
```javascript
{
  user: Object,
  loading: boolean,
  isAuthenticated: boolean,
  login: (email, password) => Promise,
  register: (fullName, email, password) => Promise,
  logout: () => void,
  updateUser: (userData) => void,
  hasRole: (role) => boolean,
  isAdmin: () => boolean,
  isOperator: () => boolean,
  isUser: () => boolean
}
```

### NotificationContext
```javascript
{
  notifications: Array,
  unreadCount: number,
  loading: boolean,
  markAsRead: (id) => Promise,
  markAllAsRead: () => Promise,
  deleteNotification: (id) => Promise,
  refresh: () => Promise
}
```

## 🎨 Estilos Personalizados

### Scrollbar Personalizado
```css
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { bg-gray-400; }
```

### Animaciones
- `fade-in` - Aparición suave
- `slide-in` - Deslizamiento desde arriba

### Estilos de Calendario
- Estados por color
- Eventos personalizados
- Responsive design

## 🔍 Utilidades

### Formatters (`formatters.js`)
```javascript
formatDate(date)          // "15 Ene 2024"
formatTime(time)          // "14:30"
formatDateTime(datetime)  // "15 Ene 2024, 14:30"
formatDuration(minutes)   // "2 horas 30 minutos"
formatRating(rating)      // "4.5 ⭐"
```

### Constants (`constants.js`)
```javascript
ROLES = { ADMIN, OPERARIO, USUARIO }
APPOINTMENT_STATUS = { SCHEDULED, COMPLETED, CANCELLED, FAILED }
APPOINTMENT_STATUS_LABELS = { ... }
STATUS_EMOJIS = { ... }
STATUS_COLORS = { ... }
POLLING_INTERVAL = 30000 // 30 segundos
```

### Validators (`validators.js`)
- Validación de email
- Validación de teléfono
- Validación de fechas
- Validación de horarios

## 🐛 Manejo de Errores

### Interceptor de Axios
- **401**: Logout automático y redirect a `/login`
- **403**: Mensaje "Sin permisos"
- **404**: Recurso no encontrado
- **500+**: Error del servidor
- **Network Error**: Sin conexión al backend

### Toast Notifications (Sonner)
```javascript
toast.success('Operación exitosa')
toast.error('Error al procesar')
toast.info('Información')
toast.warning('Advertencia')
```

## 🔐 Seguridad

### JWT Storage
- Token guardado en `localStorage`
- Limpieza automática en logout
- Verificación en cada request
- Expiración manejada por backend

### Rutas Protegidas
```jsx
<ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
  <AdminPage />
</ProtectedRoute>
```

## 📦 Scripts Disponibles

```json
{
  "dev": "vite",                    // Desarrollo
  "build": "vite build",            // Build producción
  "preview": "vite preview",        // Preview producción
  "lint": "eslint ."                // Linting
}
```

## 🚀 Optimizaciones

- **Lazy Loading** de componentes pesados
- **Memoization** con `useMemo` y `useCallback`
- **Debouncing** en búsquedas
- **Polling** optimizado (30s)
- **Pagination** para listas grandes
- **Image optimization** (si aplica)
- **Bundle size** optimizado con Vite

## 📝 Convenciones de Código

### Nomenclatura
- **Componentes**: PascalCase (`AppointmentCard.jsx`)
- **Hooks**: camelCase con prefijo `use` (`useDebounce.js`)
- **Utilidades**: camelCase (`formatters.js`)
- **Constantes**: UPPER_SNAKE_CASE (`APPOINTMENT_STATUS`)

### Estructura de Componentes
```jsx
// 1. Imports
import { useState } from 'react';

// 2. Component Definition
const MyComponent = ({ prop1, prop2 }) => {
  // 3. Hooks
  const [state, setState] = useState();
  
  // 4. Effects
  useEffect(() => {}, []);
  
  // 5. Handlers
  const handleClick = () => {};
  
  // 6. Render
  return <div>...</div>;
};

// 7. Export
export default MyComponent;
```
