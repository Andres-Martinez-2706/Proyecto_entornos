import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { ROLES } from '../../utils/constants';
import { Shield, User, Briefcase } from 'lucide-react';

const UserForm = ({ 
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  isOperatorForm = false, // Si es true, solo crea operarios
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: isOperatorForm ? ROLES.OPERARIO : ROLES.USUARIO,
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        password: '',
        // ✅ FIX: Extraer el nombre del rol si es objeto
        role: typeof initialData.role === 'string' 
          ? initialData.role 
          : initialData.role?.name || (isOperatorForm ? ROLES.OPERARIO : ROLES.USUARIO),
      });
    }
  }, [initialData, isOperatorForm]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!initialData) {
      // Solo validar contraseña en creación
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    } else {
      // En edición, solo validar si se ingresó una contraseña
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // No enviar contraseña vacía en edición
    const submitData = { ...formData };
    if (initialData && !submitData.password) {
      delete submitData.password;
    }
    
    onSubmit(submitData);
  };

  const getRoleInfo = (role) => {
    const info = {
      [ROLES.ADMIN]: {
        icon: Shield,
        label: 'Administrador',
        color: 'danger',
        description: 'Acceso total al sistema',
      },
      [ROLES.OPERARIO]: {
        icon: Briefcase,
        label: 'Operario',
        color: 'warning',
        description: 'Gestiona citas y horarios',
      },
      [ROLES.USUARIO]: {
        icon: User,
        label: 'Usuario',
        color: 'primary',
        description: 'Agenda y gestiona sus citas',
      },
    };
    return info[role] || info[ROLES.USUARIO];
  };

  const roleInfo = getRoleInfo(formData.role);
  const RoleIcon = roleInfo.icon;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre completo */}
      <Input
        label="Nombre Completo"
        value={formData.fullName}
        onChange={(e) => handleChange('fullName', e.target.value)}
        error={errors.fullName}
        required
        placeholder="Ej: Juan Pérez García"
        maxLength={100}
      />

      {/* Email */}
      <Input
        type="email"
        label="Correo Electrónico"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        required
        placeholder="ejemplo@correo.com"
        disabled={!!initialData} // No permitir cambiar email en edición
      />

      {/* Contraseña */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-semibold text-gray-700">
            Contraseña {!initialData && <span className="text-danger-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          required={!initialData}
          placeholder={initialData ? 'Dejar vacío para mantener la actual' : '••••••••'}
          minLength={6}
        />
        {!initialData && (
          <p className="mt-1 text-xs text-gray-500">
            Mínimo 6 caracteres
          </p>
        )}
      </div>

      {/* Rol (solo si no es operatorForm) */}
      {!isOperatorForm && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rol <span className="text-danger-500">*</span>
          </label>
          
          <div className="space-y-2">
            {[ROLES.USUARIO, ROLES.OPERARIO, ROLES.ADMIN].map(role => {
              const info = getRoleInfo(role);
              const Icon = info.icon;
              
              return (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === role
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  
                  <div className={`p-2 rounded-lg bg-${info.color}-100`}>
                    <Icon className={`w-5 h-5 text-${info.color}-600`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {info.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {info.description}
                    </div>
                  </div>
                  
                  {formData.role === role && (
                    <Badge variant={info.color}>
                      Seleccionado
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista previa del rol seleccionado */}
      <div className={`p-4 bg-${roleInfo.color}-50 border border-${roleInfo.color}-200 rounded-lg`}>
        <div className="flex items-start gap-3">
          <RoleIcon className={`w-6 h-6 text-${roleInfo.color}-600 flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className={`font-semibold text-${roleInfo.color}-900 mb-1`}>
              {isOperatorForm ? 'Creando Operario' : `Usuario con rol: ${roleInfo.label}`}
            </h4>
            <p className={`text-sm text-${roleInfo.color}-800`}>
              {roleInfo.description}
            </p>
            
            {formData.role === ROLES.OPERARIO && (
              <p className="text-xs text-yellow-700 mt-2">
                💡 Después de crear el operario, asígnale categorías y horarios de trabajo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          {initialData 
            ? 'Actualizar Usuario' 
            : isOperatorForm 
            ? 'Crear Operario' 
            : 'Crear Usuario'
          }
        </Button>
      </div>
    </form>
  );
};

export default UserForm;