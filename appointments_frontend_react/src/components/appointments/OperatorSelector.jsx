import { useState, useEffect } from 'react';
import { User, Star, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import Button from '../common/Button';
import appointmentService from '../../api/appointmentService';

const OperatorSelector = ({ 
  categoryId,
  date,
  startTime,
  durationMinutes,
  selectedOperatorId,
  onSelect,
  autoAssign = false,
  onAutoAssignChange,
}) => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (categoryId && date && startTime && durationMinutes && !autoAssign) {
      loadAvailableOperators();
    } else {
      setOperators([]);
    }
  }, [categoryId, date, startTime, durationMinutes, autoAssign]);

  const loadAvailableOperators = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const available = await appointmentService.getAvailableOperators(
        categoryId,
        date,
        startTime,
        durationMinutes
      );
      
      setOperators(available || []);
      
      // Si no hay operadores, seleccionar auto-asignar por defecto
      if (available.length === 0 && onAutoAssignChange) {
        onAutoAssignChange(true);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar operarios');
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };

  if (autoAssign) {
    return (
      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-primary-900">
            Asignación Automática Activada
          </span>
        </div>
        <p className="text-sm text-primary-700 mb-3">
          El sistema asignará automáticamente al primer operario disponible
        </p>
        {onAutoAssignChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAutoAssignChange(false)}
          >
            Elegir Operario Manualmente
          </Button>
        )}
      </div>
    );
  }

  if (!categoryId || !date || !startTime || !durationMinutes) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Completa la categoría, fecha, hora y duración para ver operarios disponibles
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Spinner size="md" />
        <p className="text-sm text-gray-600 mt-2">
          Verificando disponibilidad...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-danger-600" />
          <span className="font-medium text-danger-900">Error</span>
        </div>
        <p className="text-sm text-danger-700">{error}</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-warning-600" />
            <span className="font-medium text-warning-900">
              No hay operarios disponibles
            </span>
          </div>
          <p className="text-sm text-warning-700">
            No se encontraron operarios disponibles en este horario.
            Intenta con otra fecha/hora o activa la asignación automática.
          </p>
        </div>

        {onAutoAssignChange && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="autoAssignCheckbox"
              onChange={(e) => onAutoAssignChange(e.target.checked)}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="autoAssignCheckbox" className="text-sm font-medium text-gray-700">
              Asignar operario automáticamente
            </label>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-700">
          Operarios Disponibles ({operators.length})
        </label>
        
        {onAutoAssignChange && (
          <button
            onClick={() => onAutoAssignChange(true)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Asignar automáticamente
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {operators.map(operator => (
          <label
            key={operator.id}
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedOperatorId === operator.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="operator"
              value={operator.id}
              checked={selectedOperatorId === operator.id}
              onChange={() => onSelect(operator.id)}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />

            <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-warning-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 truncate">
                  {operator.fullName}
                </span>
                
                {operator.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      {operator.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 truncate">
                {operator.email}
              </p>

              {/* Estadísticas del operario */}
              <div className="flex items-center gap-3 mt-2">
                {operator.totalAppointments !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{operator.totalAppointments} citas</span>
                  </div>
                )}

                {operator.completionRate !== undefined && (
                  <Badge variant="success" className="text-xs">
                    {operator.completionRate.toFixed(0)}% éxito
                  </Badge>
                )}
              </div>
            </div>

            {selectedOperatorId === operator.id && (
              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
            )}
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        💡 Tip: Selecciona un operario según su calificación y experiencia
      </p>
    </div>
  );
};

export default OperatorSelector;