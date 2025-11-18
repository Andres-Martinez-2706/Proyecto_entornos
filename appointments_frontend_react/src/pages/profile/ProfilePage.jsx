import { useState } from 'react';
import { toast } from 'sonner';
import { 
  User, Mail, Lock, Bell, Shield, Save, Eye, EyeOff 
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import userService from '../../api/userService';
import { ROLES } from '../../utils/constants';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState({
    email: false,
    password: false,
    notifications: false,
  });

  // Estados para formularios
  const [emailForm, setEmailForm] = useState({
    newEmail: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    reminderHours: user?.reminderHours || 24,
    emailNotifications: true,
  });

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    
    if (emailForm.newEmail === user.email) {
      toast.error('El email es el mismo que el actual');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      toast.error('Email inválido');
      return;
    }

    setLoading(prev => ({ ...prev, email: true }));
    try {
      await userService.updateEmail(user.id, emailForm.newEmail);
      updateUser({ email: emailForm.newEmail });
      toast.success('Email actualizado exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar email');
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!passwordForm.currentPassword) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error('Ingresa la nueva contraseña');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(prev => ({ ...prev, password: true }));
    try {
      await userService.updatePassword(
        user.id,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      // Limpiar formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Contraseña actualizada exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleUpdateNotifications = async (e) => {
    e.preventDefault();

    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      await userService.updateNotificationPreference(
        user.id,
        notificationPreferences.reminderHours
      );
      
      updateUser({ reminderHours: notificationPreferences.reminderHours });
      toast.success('Preferencias actualizadas exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar preferencias');
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const getRoleInfo = (role) => {
    const info = {
      [ROLES.ADMIN]: {
        label: 'Administrador',
        color: 'danger',
        description: 'Acceso total al sistema',
      },
      [ROLES.OPERARIO]: {
        label: 'Operario',
        color: 'warning',
        description: 'Gestiona citas y horarios',
      },
      [ROLES.USUARIO]: {
        label: 'Usuario',
        color: 'primary',
        description: 'Agenda y gestiona sus citas',
      },
    };
    return info[role] || info[ROLES.USUARIO];
  };

  const roleInfo = getRoleInfo(user?.role);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Información Personal */}
      <Card>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.fullName}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={roleInfo.color}>
                {roleInfo.label}
              </Badge>
              <Badge variant={user?.active ? 'success' : 'default'}>
                {user?.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-900">Rol en el sistema</span>
          </div>
          <p className="text-sm text-gray-600">
            {roleInfo.description}
          </p>
        </div>
      </Card>

      {/* Cambiar Email */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary-600" />
          Correo Electrónico
        </h3>

        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <Input
            type="email"
            label="Nuevo Email"
            value={emailForm.newEmail}
            onChange={(e) => setEmailForm({ newEmail: e.target.value })}
            placeholder="nuevo@email.com"
            required
          />

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Al cambiar tu email, deberás usarlo para iniciar sesión
            </p>
          </div>

          <Button
            type="submit"
            loading={loading.email}
            disabled={emailForm.newEmail === user?.email}
          >
            <Save className="w-4 h-4" />
            Actualizar Email
          </Button>
        </form>
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-600" />
          Cambiar Contraseña
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contraseña Actual <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  current: !prev.current
                }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nueva Contraseña <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  new: !prev.new
                }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 6 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Confirmar Nueva Contraseña <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  confirm: !prev.confirm
                }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {passwordForm.newPassword && passwordForm.confirmPassword && 
           passwordForm.newPassword !== passwordForm.confirmPassword && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800">
                ⚠️ Las contraseñas no coinciden
              </p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading.password}
          >
            <Save className="w-4 h-4" />
            Cambiar Contraseña
          </Button>
        </form>
      </Card>

      {/* Preferencias de Notificaciones */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          Preferencias de Notificaciones
        </h3>

        <form onSubmit={handleUpdateNotifications} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Recordatorio de Citas
            </label>
            <select
              value={notificationPreferences.reminderHours}
              onChange={(e) => setNotificationPreferences(prev => ({
                ...prev,
                reminderHours: parseInt(e.target.value)
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="1">1 hora antes</option>
              <option value="2">2 horas antes</option>
              <option value="3">3 horas antes</option>
              <option value="6">6 horas antes</option>
              <option value="12">12 horas antes</option>
              <option value="24">24 horas antes (1 día)</option>
              <option value="48">48 horas antes (2 días)</option>
              <option value="72">72 horas antes (3 días)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Recibirás una notificación antes de cada cita
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPreferences.emailNotifications}
                onChange={(e) => setNotificationPreferences(prev => ({
                  ...prev,
                  emailNotifications: e.target.checked
                }))}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  Notificaciones por Email
                </div>
                <div className="text-sm text-gray-600">
                  Recibe recordatorios y actualizaciones por correo
                </div>
              </div>
            </label>
          </div>

          <Button
            type="submit"
            loading={loading.notifications}
          >
            <Save className="w-4 h-4" />
            Guardar Preferencias
          </Button>
        </form>
      </Card>

      {/* Información del Sistema */}
      <Card className="bg-gray-50">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Información del Sistema
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">ID de Usuario:</span>
            <span className="font-medium text-gray-900">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tipo de Cuenta:</span>
            <span className="font-medium text-gray-900">{roleInfo.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado:</span>
            <Badge variant={user?.active ? 'success' : 'default'}>
              {user?.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;