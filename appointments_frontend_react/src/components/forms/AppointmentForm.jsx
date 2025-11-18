import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import OperatorSelector from '../appointments/OperatorSelector';
import categoryService from '../../api/categoryService';
import { useAuth } from '../../context/AuthContext';

const AppointmentForm = ({ 
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      userId: user?.id || '',
      categoryId: '',
      operatorId: '',
      date: '',
      startTime: '',
      durationMinutes: '',
      description: '',
      autoAssign: false,
    }
  });

  const [categories, setCategories] = React.useState([]);
  const [durations, setDurations] = React.useState([]);
  const [loadingData, setLoadingData] = React.useState(true);

  // Watch form values
  const categoryId = watch('categoryId');
  const date = watch('date');
  const startTime = watch('startTime');
  const durationMinutes = watch('durationMinutes');
  const autoAssign = watch('autoAssign');
  const operatorId = watch('operatorId');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        userId: initialData.userId || user?.id,
        categoryId: initialData.categoryId || '',
        operatorId: initialData.operatorId || '',
        date: initialData.date || '',
        startTime: initialData.startTime || '',
        durationMinutes: initialData.durationMinutes || '',
        description: initialData.description || '',
        autoAssign: !initialData.operatorId,
      });
    }
  }, [initialData, reset]);

  // POR ESTO:
  useEffect(() => {
    if (categoryId) {
      loadDurations(categoryId);
      // Limpiar operador cuando cambia categoría
      setValue('operatorId', '');
    }
  }, [categoryId]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadDurations = async (catId) => {
    try {
      const data = await categoryService.getAllowedDurations(catId);
      setDurations(data || []);
      
      // Reset duración si no es válida
      if (data && !data.includes(parseInt(durationMinutes))) {
        setValue('durationMinutes', '');
      }
    } catch (error) {
      console.error('Error al cargar duraciones:', error);
    }
  };

  const onFormSubmit = (data) => {
    const submitData = {
      userId: data.userId,
      categoryId: parseInt(data.categoryId),
      operatorId: data.autoAssign ? null : parseInt(data.operatorId),
      date: data.date,
      startTime: data.startTime,
      durationMinutes: parseInt(data.durationMinutes),
      description: data.description,
    };
    
    onSubmit(submitData);
  };

  const handleAutoAssignChange = (checked) => {
    setValue('autoAssign', checked);
    if (checked) {
      setValue('operatorId', '');
    }
  };

  if (loadingData) {
    return <div className="text-center py-4">Cargando formulario...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Categoría */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Categoría <span className="text-danger-500">*</span>
        </label>
        <select
          {...register('categoryId', { 
            required: 'Selecciona una categoría' 
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.categoryId ? 'border-danger-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-danger-500">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Duración */}
      {categoryId && durations.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Duración <span className="text-danger-500">*</span>
          </label>
          <select
            {...register('durationMinutes', { 
              required: 'Selecciona la duración' 
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.durationMinutes ? 'border-danger-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona la duración</option>
            {durations.map(dur => (
              <option key={dur} value={dur}>
                {dur} minutos ({(dur / 60).toFixed(1)} {dur >= 60 ? 'horas' : 'hora'})
              </option>
            ))}
          </select>
          {errors.durationMinutes && (
            <p className="mt-1 text-sm text-danger-500">{errors.durationMinutes.message}</p>
          )}
        </div>
      )}

      {/* Fecha */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Fecha <span className="text-danger-500">*</span>
        </label>
        <input
          type="date"
          {...register('date', { 
            required: 'Selecciona una fecha',
            validate: {
              notPast: (value) => {
                const selected = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selected >= today || 'La fecha no puede ser en el pasado';
              }
            }
          })}
          min={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.date ? 'border-danger-500' : 'border-gray-300'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-danger-500">{errors.date.message}</p>
        )}
      </div>

      {/* Hora */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Hora de inicio <span className="text-danger-500">*</span>
        </label>
        <input
          type="time"
          {...register('startTime', { 
            required: 'Selecciona una hora' 
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.startTime ? 'border-danger-500' : 'border-gray-300'
          }`}
        />
        {errors.startTime && (
          <p className="mt-1 text-sm text-danger-500">{errors.startTime.message}</p>
        )}
      </div>

      {/* Asignación automática */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          {...register('autoAssign')}
          id="autoAssign"
          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="autoAssign" className="text-sm font-medium text-gray-700">
          Asignar operario automáticamente
        </label>
      </div>

      {/* Selector de duración */}
      {categoryId && durations.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Duración <span className="text-danger-500">*</span>
          </label>
          <select
            {...register('durationMinutes', { 
              required: 'Selecciona la duración',
              validate: {
                positive: (value) => parseInt(value) > 0 || 'Duración inválida'
              }
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.durationMinutes ? 'border-danger-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona la duración</option>
            {durations.map(dur => (
              <option key={dur} value={dur}>
                {dur} minutos ({(dur / 60).toFixed(1)} hora{dur >= 60 ? 's' : ''})
              </option>
            ))}
          </select>
          {errors.durationMinutes && (
            <p className="text-sm text-danger-500 mt-1">{errors.durationMinutes.message}</p>
          )}
        </div>
      )}

      {/* Selector de operario */}
      {!autoAssign && categoryId && durationMinutes && (
        <div>
          <OperatorSelector
            categoryId={categoryId}
            date={date}
            startTime={startTime}
            durationMinutes={durationMinutes}
            selectedOperatorId={operatorId}
            onSelect={(id) => setValue('operatorId', id)}
            autoAssign={autoAssign}
            onAutoAssignChange={handleAutoAssignChange}
          />
          {!autoAssign && !operatorId && errors.operatorId && (
            <p className="mt-1 text-sm text-danger-500">
              Selecciona un operario o activa asignación automática
            </p>
          )}
        </div>
      )}

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Descripción <span className="text-danger-500">*</span>
        </label>
        <textarea
          {...register('description', { 
            required: 'Ingresa una descripción',
            minLength: {
              value: 10,
              message: 'La descripción debe tener al menos 10 caracteres'
            }
          })}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.description ? 'border-danger-500' : 'border-gray-300'
          }`}
          placeholder="Describe el motivo de tu cita..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-danger-500">{errors.description.message}</p>
        )}
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
          {initialData ? 'Actualizar Cita' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;