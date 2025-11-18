import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Tag, Star, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatTime } from '../../utils/formatters';
import { APPOINTMENT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const AppointmentCard = ({ appointment, onComplete, onCancel, onRate }) => {
  const navigate = useNavigate();
  const { user, isOperator, isAdmin } = useAuth();

  const getStatusBadge = (status) => {
    const variants = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'warning',
      [APPOINTMENT_STATUS.COMPLETED]: 'success',
      [APPOINTMENT_STATUS.CANCELLED]: 'danger',
      [APPOINTMENT_STATUS.FAILED]: 'default',
    };

    const labels = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'Programada',
      [APPOINTMENT_STATUS.COMPLETED]: 'Completada',
      [APPOINTMENT_STATUS.CANCELLED]: 'Cancelada',
      [APPOINTMENT_STATUS.FAILED]: 'Fallida',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const canComplete = () => {
    return isOperator() && 
           appointment.status === APPOINTMENT_STATUS.SCHEDULED &&
           appointment.operator?.id === user.id;
  };

  const canCancel = () => {
    if (isAdmin()) return appointment.status === APPOINTMENT_STATUS.SCHEDULED;
    if (isOperator()) {
      return appointment.status === APPOINTMENT_STATUS.SCHEDULED &&
             appointment.operator?.id === user.id;
    }
    return appointment.userId === user.id &&
           appointment.status === APPOINTMENT_STATUS.SCHEDULED;
  };

  const canRate = () => {
    return appointment.userId === user.id &&
           appointment.status === APPOINTMENT_STATUS.COMPLETED &&
           !appointment.ratingToOperator;
  };

  const isPastDue = () => {
    if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) return false;
    
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.endTime}`);
    return appointmentDateTime < now;
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all cursor-pointer ${
        isPastDue() ? 'border-l-4 border-l-warning-500' : ''
      }`}
      onClick={() => navigate(`/appointments/${appointment.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 truncate">
                {appointment.category?.name || 'Sin categoría'}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>
            
            {appointment.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {appointment.description}
              </p>
            )}
          </div>
        </div>

        {isPastDue() && canComplete() && (
          <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
        )}
      </div>

      {/* Información de fecha y hora */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(appointment.date)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </span>
        </div>
      </div>

      {/* Usuario y Operario */}
      <div className="space-y-2 mb-4 pb-4 border-b">
        {appointment.user && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Usuario:</span>
            <span className="font-medium text-gray-900">
              {appointment.user.fullName}
            </span>
          </div>
        )}

        {appointment.operator && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Operario:</span>
            <span className="font-medium text-gray-900">
              {appointment.operator.fullName}
            </span>
            {appointment.operator.averageRating > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600">
                  {appointment.operator.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultados (si está completada) */}
      {appointment.status === APPOINTMENT_STATUS.COMPLETED && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">Resultado:</span>
            {appointment.userAttended ? (
              <Badge variant="success">Usuario asistió</Badge>
            ) : (
              <Badge variant="danger">Usuario no asistió</Badge>
            )}
          </div>

          {appointment.ratingToOperator > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-600">Tu calificación:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < appointment.ratingToOperator
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {canComplete() && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(appointment);
            }}
          >
            Completar
          </Button>
        )}

        {canRate() && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onRate?.(appointment);
            }}
          >
            <Star className="w-4 h-4" />
            Calificar
          </Button>
        )}

        {canCancel() && (
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.(appointment);
            }}
          >
            Cancelar
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/appointments/${appointment.id}`)}
        >
          Ver Detalles →
        </Button>
      </div>

      {/* Alerta si está vencida */}
      {isPastDue() && canComplete() && (
        <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded text-xs text-warning-700">
          ⚠️ Esta cita está pendiente de completar
        </div>
      )}
    </Card>
  );
};

export default AppointmentCard;