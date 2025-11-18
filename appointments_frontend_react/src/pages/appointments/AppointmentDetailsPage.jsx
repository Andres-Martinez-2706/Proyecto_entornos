import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Calendar, Clock, User, Tag, FileText, CheckCircle, XCircle,
  Edit, Trash2, Star, AlertCircle 
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import StarRating from '../../components/common/StarRating';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import appointmentService from '../../api/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime } from '../../utils/formatters';
import { APPOINTMENT_STATUS } from '../../utils/constants';

const AppointmentDetailsPage = () => {
  const [cancelForm, setCancelForm] = useState({
    observation: '',
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOperator, isAdmin } = useAuth();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modales
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Formulario de completar cita (operario)
  const [completeForm, setCompleteForm] = useState({
    userAttended: true,
    observation: '',
    ratingToUser: 0,
  });
  
  // Formulario de calificar operario (usuario)
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    observation: '',
  });

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const data = await appointmentService.getById(id);
      setAppointment(data);
    } catch (error) {
      toast.error('Error al cargar la cita');
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelForm.observation.trim()) {
      toast.error('La observación es obligatoria');
      return;
    }

    setActionLoading(true);
    try {
      await appointmentService.cancelWithObservation(id, cancelForm.observation);
      toast.success('Cita cancelada exitosamente');
      navigate('/appointments');
    } catch (error) {
      toast.error(error.message || 'Error al cancelar la cita');
      setActionLoading(false);
    }
  };


  const handleComplete = async () => {
    if (!completeForm.observation.trim()) {
      toast.error('La observación es obligatoria');
      return;
    }

    setActionLoading(true);
    try {
      await appointmentService.complete(id, completeForm);
      toast.success('Cita completada exitosamente');
      setShowCompleteModal(false);
      loadAppointment();
    } catch (error) {
      toast.error(error.message || 'Error al completar la cita');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRateOperator = async () => {
    if (ratingForm.rating === 0) {
      toast.error('Selecciona una calificación');
      return;
    }

    setActionLoading(true);
    try {
      await appointmentService.rateOperator(
        id, 
        ratingForm.rating, 
        ratingForm.observation
      );
      toast.success('Calificación enviada exitosamente');
      setShowRatingModal(false);
      loadAppointment();
    } catch (error) {
      toast.error(error.message || 'Error al calificar');
    } finally {
      setActionLoading(false);
    }
  };

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
           appointment?.status === APPOINTMENT_STATUS.SCHEDULED &&
           appointment?.operator?.id === user.id;
  };

  const canRate = () => {
    return appointment?.userId === user.id &&
           appointment?.status === APPOINTMENT_STATUS.COMPLETED &&
           !appointment?.ratingToOperator;
  };

  const canCancel = () => {
    if (appointment?.status !== APPOINTMENT_STATUS.SCHEDULED) return false;
    
    if (isAdmin()) return true;
    
    if (isOperator()) {
      return appointment?.operator?.id === user.id;
    }
    
    return appointment?.user?.id === user.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Cita no encontrada
        </h2>
        <Button onClick={() => navigate('/appointments')}>
          Volver a citas
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalles de la Cita
          </h1>
          <p className="text-gray-600 mt-1">
            ID: #{appointment.id}
          </p>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="grid gap-6">
        {/* Información Principal */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Información General
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Categoría</div>
                <div className="font-medium text-gray-900">
                  {appointment.category?.name}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Fecha</div>
                <div className="font-medium text-gray-900">
                  {formatDate(appointment.date)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Horario</div>
                <div className="font-medium text-gray-900">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </div>
                <div className="text-sm text-gray-500">
                  {appointment.durationMinutes} minutos
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Usuario</div>
                <div className="font-medium text-gray-900">
                  {appointment.user?.fullName}
                </div>
                <div className="text-sm text-gray-500">
                  {appointment.user?.email}
                </div>
              </div>
            </div>

            {appointment.operator && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Operario</div>
                  <div className="font-medium text-gray-900">
                    {appointment.operator.fullName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {appointment.operator.email}
                  </div>
                </div>
              </div>
            )}
          </div>

          {appointment.description && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Descripción</div>
                  <p className="text-gray-900">{appointment.description}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Observaciones y Calificaciones */}
        {appointment.status === APPOINTMENT_STATUS.COMPLETED && (
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Resultado de la Cita
            </h2>

            {/* Observación del operario */}
            {appointment.operatorObservation && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    Observación del Operario
                  </span>
                </div>
                <p className="text-gray-700">{appointment.operatorObservation}</p>
                
                {appointment.ratingToUser > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Calificación al usuario:</span>
                    <StarRating value={appointment.ratingToUser} readOnly size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Asistencia */}
            <div className="flex items-center gap-3 mb-4">
              {appointment.userAttended ? (
                <>
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="font-medium text-success-600">Usuario asistió</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-danger-600" />
                  <span className="font-medium text-danger-600">Usuario no asistió</span>
                </>
              )}
            </div>

            {/* Calificación al operario */}
            {appointment.ratingToOperator > 0 && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-primary-600" />
                  <span className="font-medium text-gray-900">
                    Calificación al Operario
                  </span>
                </div>
                <StarRating value={appointment.ratingToOperator} readOnly />
                
                {appointment.userObservation && (
                  <p className="text-gray-700 mt-2">{appointment.userObservation}</p>
                )}
              </div>
            )}

            {/* Botón para calificar si aún no lo ha hecho */}
            {canRate() && (
              <Button
                onClick={() => setShowRatingModal(true)}
                className="mt-4"
              >
                <Star className="w-4 h-4" />
                Calificar Operario
              </Button>
            )}
          </Card>
        )}

        {/* Acciones */}
        <Card>
          <div className="flex flex-wrap gap-3">
            {canComplete() && (
              <Button onClick={() => setShowCompleteModal(true)}>
                <CheckCircle className="w-4 h-4" />
                Completar Cita
              </Button>
            )}

            {canCancel() && (
              <Button
                variant="danger"
                onClick={() => {
                  // Si es operario o admin, mostrar modal con observación
                  if (isOperator() || isAdmin()) {
                    setShowCancelModal(true);
                  } else {
                    // Usuario normal: confirmación simple
                    setShowDeleteDialog(true);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Cancelar Cita
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/appointments')}
            >
              Volver
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal Completar Cita */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => !actionLoading && setShowCompleteModal(false)}
        title="Completar Cita"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="userAttended"
              checked={completeForm.userAttended}
              onChange={(e) => setCompleteForm(prev => ({
                ...prev,
                userAttended: e.target.checked
              }))}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="userAttended" className="font-medium text-gray-900">
              El usuario asistió a la cita
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Observación <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={completeForm.observation}
              onChange={(e) => setCompleteForm(prev => ({
                ...prev,
                observation: e.target.value
              }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe cómo fue la cita, qué se realizó, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Calificación al Usuario (Opcional)
            </label>
            <StarRating
              value={completeForm.ratingToUser}
              onChange={(rating) => setCompleteForm(prev => ({
                ...prev,
                ratingToUser: rating
              }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCompleteModal(false)}
              disabled={actionLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              loading={actionLoading}
              className="flex-1"
            >
              Completar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Calificar Operario */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => !actionLoading && setShowRatingModal(false)}
        title="Calificar Operario"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Calificación <span className="text-danger-500">*</span>
            </label>
            <StarRating
              value={ratingForm.rating}
              onChange={(rating) => setRatingForm(prev => ({
                ...prev,
                rating
              }))}
              size="lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Observación (Opcional)
            </label>
            <textarea
              value={ratingForm.observation}
              onChange={(e) => setRatingForm(prev => ({
                ...prev,
                observation: e.target.value
              }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Cuéntanos sobre tu experiencia..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRatingModal(false)}
              disabled={actionLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRateOperator}
              loading={actionLoading}
              className="flex-1"
            >
              Enviar Calificación
            </Button>
          </div>
        </div>
      </Modal>
      

      {/* Modal Cancelar Cita (Operario/Admin) */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => !actionLoading && setShowCancelModal(false)}
        title="Cancelar Cita"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-sm text-warning-800">
              ⚠️ Esta acción no se puede deshacer. La cita será cancelada permanentemente.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Motivo de cancelación <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={cancelForm.observation}
              onChange={(e) => setCancelForm({ observation: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500"
              placeholder="Explica el motivo de la cancelación..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta observación será visible para el usuario y el administrador.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={actionLoading}
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={actionLoading}
              className="flex-1"
            >
              Confirmar Cancelación
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          setActionLoading(true);
          try {
            await appointmentService.delete(id);
            toast.success('Cita cancelada exitosamente');
            navigate('/appointments');
          } catch (error) {
            toast.error(error.message || 'Error al cancelar la cita');
            setActionLoading(false);
          }
        }}
        title="Cancelar Cita"
        message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        loading={actionLoading}
      />
    </div>
  );
};

export default AppointmentDetailsPage;