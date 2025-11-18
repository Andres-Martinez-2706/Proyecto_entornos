import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { ROLES } from './utils/constants';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Appointments
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import CreateAppointmentPage from './pages/appointments/CreateAppointmentPage';

// Calendar
import CalendarPage from './pages/calendar/CalendarPage';

// Schedule (Operario)
import SchedulePage from './pages/schedule/SchedulePage';

// Users & Operators (Admin)
import UsersPage from './pages/users/UsersPage';
import OperatorsPage from './pages/users/OperatorsPage';

// Categories (Admin)
import CategoriesPage from './pages/categories/CategoriesPage';

// Notifications
import NotificationsPage from './pages/notifications/NotificationsPage';

// Profile
import ProfilePage from './pages/profile/ProfilePage';

// Stats
import StatsPage from './pages/stats/StatsPage';
import { ThemeProvider } from './context/ThemeContext';



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          {/* Toast notifications */}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            duration={4000}
          />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard - All roles */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Appointments - All roles */}
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/create" element={<CreateAppointmentPage />} />

              {/* Calendar - All roles */}
              <Route path="calendar" element={<CalendarPage />} />

              {/* Notifications - All roles */}
              <Route path="notifications" element={<NotificationsPage />} />

              {/* Profile - All roles */}
              <Route path="profile" element={<ProfilePage />} />

              {/* Schedule - Only Operario */}
              <Route
                path="schedule"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OPERARIO]}>
                    <SchedulePage />
                  </ProtectedRoute>
                }
              />

              {/* Categories - Only Admin */}
              <Route
                path="categories"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />

              {/* Users - Only Admin */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              {/* Operators - Only Admin */}
              <Route
                path="operators"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <OperatorsPage />
                  </ProtectedRoute>
                }
              />

              {/* Stats - Admin and Operario */}
              <Route
                path="stats"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OPERARIO]}>
                    <StatsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 - Not found */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;