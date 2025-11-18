import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Clock, User, Tag, FileText, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import appointmentService from '../../api/appointmentService';
import categoryService from '../../api/categoryService';
import userService from '../../api/userService';
import { useAuth } from '../../context/AuthContext';

const CreateAppointmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [operators, setOperators] = useState([]);
  const [availableOperators, setAvailableOperators] = useState([]);
  const [durations, setDurations] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '', // ✅ AGREGADO
    categoryId: '',
    operatorId: '',
    date: '',
    startTime: '',
    durationMinutes: '',
    description: '',
    autoAssign: false,
  });

  const [errors, setErrors] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (formData.categoryId) {
      loadDurations(formData.categoryId);
      loadOperatorsByCategory(formData.categoryId);
      
      setFormData(prev => ({
        ...prev,
        durationMinutes: '',
        operatorId: '',
      }));
      setAvailableOperators([]);
    }
  }, [formData.categoryId]);

  const loadDurations = async (categoryId) => {
    try {
      const data = await categoryService.getAllowedDurations(categoryId);
      setDurations(data || []);
    } catch (error) {
      toast.error('Error al cargar duraciones');
    }
  };

  const loadOperatorsByCategory = async (categoryId) => {
    try {
      const data = await userService.getOperatorsByCategory(categoryId);
      setOperators(data || []);
    } catch (error) {
      toast.error('Error al cargar operarios');
      setOperators([]);
    }
  };

  useEffect(() => {
    if (
      formData.categoryId &&
      formData.date &&
      formData.startTime &&
      formData.durationMinutes &&
      !formData.autoAssign
    ) {
      checkAvailability();
    }
  }, [
    formData.categoryId,
    formData.date,
    formData.startTime,
    formData.durationMinutes,
  ]);

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const startTimeFormatted = formData.startTime.length === 5 
        ? `${formData.startTime}:00` 
        : formData.startTime;
      const available = await appointmentService.getAvailableOperators(
        formData.categoryId,
        formData.date,
        startTimeFormatted,
        formData.durationMinutes
      );
      
      setAvailableOperators(available || []);
      
      if (available.length === 0) {
        toast.warning('No hay operarios disponibles en este horario');
      }
    } catch (error) {
      toast.error('Error al verificar disponibilidad');
      setAvailableOperators([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ FUNCIÓN HELPER PARA CALCULAR endTime
  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    
    return `${endHours}:${endMinutes}:00`;
  };


  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Ingresa un título para la cita';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Selecciona una categoría';
    }
    
    if (!formData.date) {
      newErrors.date = 'Selecciona una fecha';
    } else {
      // ✅ FIX: Validar que NO sea fecha pasada (permitir hoy)
      const selectedDate = new Date(formData.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'La fecha no puede ser en el pasado';
      }
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Selecciona una hora';
    }
    
    if (!formData.durationMinutes) {
      newErrors.durationMinutes = 'Selecciona una duración';
    }
    
    if (!formData.autoAssign && !formData.operatorId) {
      newErrors.operatorId = 'Selecciona un operario o activa asignación automática';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Ingresa una descripción';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    setLoading(true);
    
    try {
      const startTimeFormatted = formData.startTime.length === 5 
        ? `${formData.startTime}:00` 
        : formData.startTime;
      
      // ✅ CALCULAR endTime
      const endTime = calculateEndTime(formData.startTime, parseInt(formData.durationMinutes));
      
      const appointmentData = {
        title: formData.title.trim(), // ✅ INCLUIR TITLE
        user: { id: user.id }, // ✅ FORMATO CORRECTO (objeto con id)
        category: { id: parseInt(formData.categoryId) }, // ✅ FORMATO CORRECTO
        operator: formData.autoAssign ? null : { id: parseInt(formData.operatorId) }, // ✅ FORMATO CORRECTO
        date: formData.date,
        startTime: startTimeFormatted,
        endTime: endTime, // ✅ INCLUIR endTime CALCULADO
        durationMinutes: parseInt(formData.durationMinutes),
        description: formData.description.trim(),
      };
      
      console.log('📤 Enviando al backend:', appointmentData);
      
      await appointmentService.create(appointmentData);
      
      toast.success('Cita creada exitosamente');
      navigate('/appointments');
    } catch (error) {
      console.error('❌ Error completo:', error);
      toast.error(error.message || 'Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cita</h1>
        <p className="text-gray-600 mt-1">
          Completa el formulario para agendar una nueva cita
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* ✅ TÍTULO - NUEVO CAMPO */}
            <div>
              <Input
                type="text"
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
                placeholder="Ej: Cita de mantenimiento general"
              />
            </div>

            {/* Categoría */}
            <div>
              <Select
                label="Categoría"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                error={errors.categoryId}
                required
                options={categories.map(cat => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                placeholder="Selecciona una categoría"
              />
            </div>

            {/* Duración */}
            {formData.categoryId && durations.length > 0 && (
              <div>
                <Select
                  label="Duración"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  error={errors.durationMinutes}
                  required
                  options={durations.map(dur => ({
                    value: dur,
                    label: `${dur} minutos (${(dur / 60).toFixed(1)} ${dur >= 60 ? 'horas' : 'hora'})`,
                  }))}
                  placeholder="Selecciona la duración"
                />
              </div>
            )}

            {/* Fecha */}
            <div>
              <Input
                type="date"
                label="Fecha"
                name="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Hora */}
            <div>
              <Input
                type="time"
                label="Hora de inicio"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                error={errors.startTime}
                required
              />
            </div>

            {/* Asignación automática */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="autoAssign"
                name="autoAssign"
                checked={formData.autoAssign}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoAssign" className="text-sm font-medium text-gray-700">
                Asignar operario automáticamente
              </label>
            </div>

            {/* Operarios disponibles */}
            {!formData.autoAssign && formData.categoryId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Operario <span className="text-danger-500">*</span>
                </label>
                
                {!formData.durationMinutes ? (
                  <div className="text-sm text-gray-500 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    ℹ️ Primero selecciona una duración para la cita
                  </div>
                ) : !formData.date || !formData.startTime ? (
                  <div className="text-sm text-gray-500 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    ℹ️ Completa la fecha y hora para ver operarios disponibles
                  </div>
                ) : checkingAvailability ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <Spinner size="sm" />
                    Verificando disponibilidad...
                  </div>
                ) : availableOperators.length > 0 ? (
                  <div className="space-y-2">
                    {availableOperators.map(op => (
                      <label
                        key={op.id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.operatorId === op.id.toString()
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="operatorId"
                          value={op.id}
                          checked={formData.operatorId === op.id.toString()}
                          onChange={handleChange}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{op.fullName}</div>
                          <div className="text-sm text-gray-500">{op.email}</div>
                        </div>
                        {op.averageRating > 0 && (
                          <Badge variant="success">
                            ⭐ {op.averageRating.toFixed(1)}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      No hay operarios disponibles en este horario. 
                      Intenta con otra fecha/hora o activa la asignación automática.
                    </div>
                  </div>
                )}
                
                {errors.operatorId && (
                  <p className="mt-1 text-sm text-danger-500">{errors.operatorId}</p>
                )}
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descripción <span className="text-danger-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe el motivo de tu cita..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-danger-500">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/appointments')}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Crear Cita
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateAppointmentPage;