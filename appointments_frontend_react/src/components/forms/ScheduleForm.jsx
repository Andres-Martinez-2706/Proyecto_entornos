import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Button from '../common/Button';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { scheduleService } from '../../api/scheduleService';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

const ScheduleForm = ({ 
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  operatorId,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    }
  });

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const dayOfWeek = watch('dayOfWeek');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  useEffect(() => {
    if (initialData) {
      reset({
        dayOfWeek: initialData.dayOfWeek || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
      });
    }
  }, [initialData, reset]);

  // Validar en tiempo real cuando cambien los campos
  useEffect(() => {
    if (dayOfWeek && startTime && endTime && operatorId) {
      validateSchedule();
    } else {
      setValidationResult(null);
    }
  }, [dayOfWeek, startTime, endTime]);

  const validateSchedule = async () => {
    // Validar que end > start
    if (startTime >= endTime) {
      setValidationResult({
        valid: false,
        message: 'La hora de fin debe ser posterior a la de inicio'
      });
      return;
    }

    // Validar máximo 12 horas
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffHours = (end - start) / (1000 * 60 * 60);
    
    if (diffHours > 12) {
      setValidationResult({
        valid: false,
        message: 'El horario no puede ser mayor a 12 horas'
      });
      return;
    }

    // Validar con el backend
    setValidating(true);
    try {
      const scheduleData = {
        operatorId,
        dayOfWeek,
        startTime,
        endTime,
      };

      // Si es edición, incluir el ID para excluirlo de la validación
      if (initialData?.id) {
        scheduleData.id = initialData.id;
      }

      await scheduleService.validate(scheduleData);
      
      setValidationResult({
        valid: true,
        message: '✓ Horario disponible'
      });
      clearErrors();
    } catch (error) {
      setValidationResult({
        valid: false,
        message: error.message || 'Este horario se superpone con otro existente'
      });
    } finally {
      setValidating(false);
    }
  };

  const onFormSubmit = async (data) => {
    // Validar una última vez antes de enviar
    if (validationResult && !validationResult.valid) {
      setError('endTime', {
        type: 'manual',
        message: validationResult.message
      });
      return;
    }

    const submitData = {
      operatorId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    };
    
    onSubmit(submitData);
  };

  const getDuration = () => {
    if (startTime && endTime && startTime < endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diff = (end - start) / (1000 * 60); // minutos
      
      if (diff > 0) {
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        
        if (hours > 0 && minutes > 0) {
          return `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minutos`;
        } else if (hours > 0) {
          return `${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
          return `${minutes} minutos`;
        }
      }
    }
    return null;
  };

  const duration = getDuration();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Día de la semana */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Día de la Semana <span className="text-danger-500">*</span>
        </label>
        <select
          {...register('dayOfWeek', { 
            required: 'Selecciona un día de la semana' 
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.dayOfWeek ? 'border-danger-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona un día</option>
          {DAYS_OF_WEEK.map(day => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        {errors.dayOfWeek && (
          <p className="mt-1 text-sm text-danger-500">{errors.dayOfWeek.message}</p>
        )}
      </div>

      {/* Hora de inicio */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Hora de Inicio <span className="text-danger-500">*</span>
        </label>
        <input
          type="time"
          {...register('startTime', { 
            required: 'Ingresa la hora de inicio' 
          })}
          min="06:00"
          max="22:00"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.startTime ? 'border-danger-500' : 'border-gray-300'
          }`}
        />
        {errors.startTime && (
          <p className="mt-1 text-sm text-danger-500">{errors.startTime.message}</p>
        )}
      </div>

      {/* Hora de fin */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Hora de Fin <span className="text-danger-500">*</span>
        </label>
        <input
          type="time"
          {...register('endTime', { 
            required: 'Ingresa la hora de fin' 
          })}
          min="06:00"
          max="22:00"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.endTime ? 'border-danger-500' : 'border-gray-300'
          }`}
        />
        {errors.endTime && (
          <p className="mt-1 text-sm text-danger-500">{errors.endTime.message}</p>
        )}
      </div>

      {/* Duración calculada */}
      {duration && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center gap-2 text-primary-900">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Duración del bloque: {duration}
            </span>
          </div>
        </div>
      )}

      {/* Resultado de validación */}
      {validating && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-700">
            <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
            <span className="text-sm">Verificando disponibilidad...</span>
          </div>
        </div>
      )}

      {!validating && validationResult && (
        <div className={`p-3 border rounded-lg ${
          validationResult.valid 
            ? 'bg-success-50 border-success-200' 
            : 'bg-danger-50 border-danger-200'
        }`}>
          <div className="flex items-center gap-2">
            {validationResult.valid ? (
              <CheckCircle className="w-4 h-4 text-success-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-danger-600" />
            )}
            <span className={`text-sm font-medium ${
              validationResult.valid ? 'text-success-900' : 'text-danger-900'
            }`}>
              {validationResult.message}
            </span>
          </div>
        </div>
      )}

      {/* Información importante */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">
              Importante
            </h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• Solo podrás recibir citas dentro de estos horarios</li>
              <li>• Puedes crear múltiples bloques para el mismo día</li>
              <li>• El horario máximo por bloque es de 12 horas</li>
              <li>• Horario recomendado: 6:00 AM - 10:00 PM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ejemplo visual */}
      {dayOfWeek && startTime && endTime && startTime < endTime && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ejemplo de Horario
          </h4>
          <div className="text-sm text-gray-700">
            <strong>{DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label}</strong>
            <span className="mx-2">•</span>
            <span>{startTime} - {endTime}</span>
            {duration && (
              <>
                <span className="mx-2">•</span>
                <span className="text-gray-500">({duration})</span>
              </>
            )}
          </div>
        </div>
      )}

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
          disabled={loading || validating || (validationResult && !validationResult.valid)}
          className="flex-1"
        >
          {initialData ? 'Actualizar Horario' : 'Crear Horario'}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleForm;