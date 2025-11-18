import { useState } from 'react';
import Button from '../common/Button';
import StarRating from '../common/StarRating';
import { CheckCircle, XCircle } from 'lucide-react';

const CompleteAppointmentForm = ({ 
  appointment,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    userAttended: true,
    observation: '',
    ratingToUser: 0,
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.observation?.trim()) {
      newErrors.observation = 'La observación es obligatoria';
    } else if (formData.observation.trim().length < 10) {
      newErrors.observation = 'La observación debe tener al menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información de la cita */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">
          Información de la Cita
        </h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Categoría:</span> {appointment.category?.name}</p>
          <p><span className="font-medium">Usuario:</span> {appointment.user?.fullName}</p>
          <p><span className="font-medium">Fecha:</span> {appointment.date}</p>
          <p><span className="font-medium">Hora:</span> {appointment.startTime} - {appointment.endTime}</p>
        </div>
      </div>

      {/* Asistencia del usuario */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Asistencia del Usuario <span className="text-danger-500">*</span>
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('userAttended', true)}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              formData.userAttended
                ? 'border-success-500 bg-success-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CheckCircle className={`w-8 h-8 ${
              formData.userAttended ? 'text-success-600' : 'text-gray-400'
            }`} />
            <span className={`font-medium ${
              formData.userAttended ? 'text-success-900' : 'text-gray-700'
            }`}>
              Sí asistió
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleChange('userAttended', false)}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              !formData.userAttended
                ? 'border-danger-500 bg-danger-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <XCircle className={`w-8 h-8 ${
              !formData.userAttended ? 'text-danger-600' : 'text-gray-400'
            }`} />
            <span className={`font-medium ${
              !formData.userAttended ? 'text-danger-900' : 'text-gray-700'
            }`}>
              No asistió
            </span>
          </button>
        </div>
      </div>

      {/* Observación */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Observación <span className="text-danger-500">*</span>
        </label>
        <textarea
          value={formData.observation}
          onChange={(e) => handleChange('observation', e.target.value)}
          rows={5}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.observation ? 'border-danger-500' : 'border-gray-300'
          }`}
          placeholder="Describe cómo fue la cita, qué se realizó, observaciones importantes..."
        />
        {errors.observation && (
          <p className="mt-1 text-sm text-danger-500">{errors.observation}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Mínimo 10 caracteres. Sé detallado en tu descripción.
        </p>
      </div>

      {/* Calificación al usuario (opcional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Calificación al Usuario (Opcional)
        </label>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <StarRating
            value={formData.ratingToUser}
            onChange={(rating) => handleChange('ratingToUser', rating)}
            size="lg"
          />
          {formData.ratingToUser > 0 && (
            <span className="text-sm text-gray-600">
              {formData.ratingToUser === 1 && 'Muy mala experiencia'}
              {formData.ratingToUser === 2 && 'Experiencia regular'}
              {formData.ratingToUser === 3 && 'Experiencia aceptable'}
              {formData.ratingToUser === 4 && 'Buena experiencia'}
              {formData.ratingToUser === 5 && 'Excelente experiencia'}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Califica la puntualidad y comportamiento del usuario
        </p>
      </div>

      {/* Resumen */}
      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <h4 className="font-semibold text-primary-900 mb-2">
          📋 Resumen de Completación
        </h4>
        <ul className="space-y-1 text-sm text-primary-800">
          <li>
            • Usuario: <strong>{formData.userAttended ? 'Asistió' : 'No asistió'}</strong>
          </li>
          <li>
            • Observación: <strong>{formData.observation.length > 0 ? `${formData.observation.length} caracteres` : 'Sin completar'}</strong>
          </li>
          <li>
            • Calificación: <strong>{formData.ratingToUser > 0 ? `${formData.ratingToUser} estrellas` : 'Sin calificar'}</strong>
          </li>
        </ul>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
          Completar Cita
        </Button>
      </div>
    </form>
  );
};

export default CompleteAppointmentForm;