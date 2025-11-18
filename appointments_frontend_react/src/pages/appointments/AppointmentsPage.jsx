import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../api/appointmentService';
import categoryService from '../../api/categoryService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import StarRating from '../../components/common/StarRating';
import Select from '../../components/common/Select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  User,
  Folder
} from 'lucide-react';
import { 
  formatDate, 
  formatTime, 
  formatDateTime,
} from '../../utils/formatters';
import { 
  APPOINTMENT_STATUS, 
  APPOINTMENT_STATUS_LABELS, 
  STATUS_EMOJIS,
} from '../../utils/constants';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isOperator } = useAuth();
  
  // Estados principales
  const [appointments, setAppointments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'SCHEDULED',
    categoryId: '',
    includeDeleted: false,
  });

  // Modales normales
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // 🔥 NUEVO: Modal BLOQUEANTE para completar citas (operario)
  const [pendingCompletion, setPendingCompletion] = useState([]);
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const [currentPendingIndex, setCurrentPendingIndex] = useState(0);

  // 🔥 NUEVO: Modal OPCIONAL para calificar (usuario)
  const [pendingRatings, setPendingRatings] = useState([]);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);

  // Form para completar cita
  const { register: registerComplete, handleSubmit: handleSubmitComplete, formState: { errors: errorsComplete }, reset: resetComplete } = useForm();

  // Form para calificar operario
  const { register: registerRating, handleSubmit: handleSubmitRating, reset: resetRating } = useForm();
  const [ratingValue, setRatingValue] = useState(0);

  // 🔥 NUEVO: Verificar citas pendientes al cargar la página
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar citas cuando cambien los filtros
  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      // Cargar categorías
      const cats = await categoryService.getAll();
      setCategories(cats);

      // 🔥 OPERARIO: Verificar citas pendientes de completar (BLOQUEANTE)
      if (isOperator()) {
        await checkPendingCompletion();
      }

      // 🔥 USUARIO: Verificar citas pendientes de calificar (OPCIONAL)
      if (!isOperator() && !isAdmin()) {
        await checkPendingRatings();
      }

      await loadAppointments();
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos iniciales');
    }
  };

  const checkPendingCompletion = async () => {
    try {
      const pending = await appointmentService.getPendingCompletion();
      if (pending && pending.length > 0) {
        setPendingCompletion(pending);
        setCurrentPendingIndex(0);
        setShowBlockingModal(true);
      }
    } catch (error) {
      console.error('Error verificando citas pendientes:', error);
    }
  };

  // 🔥 NUEVO: Verificar citas que el usuario puede calificar (opcional)
  const checkPendingRatings = async () => {
    try {
      const allAppointments = await appointmentService.getAll(false);
      const canRate = allAppointments.filter(apt => 
        apt.user?.id === user?.id &&
        apt.status === APPOINTMENT_STATUS.COMPLETED &&
        apt.attendanceStatus === 'ATTENDED' &&
        !apt.userRating &&
        new Date(`${apt.date}T${apt.endTime}`) < new Date()
      );

      if (canRate.length > 0) {
        setPendingRatings(canRate);
        setShowRatingPrompt(true);
      }
    } catch (error) {
      console.error('Error verificando calificaciones pendientes:', error);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAll(filters.includeDeleted);
      
      // Filtrar según estado y categoría
      let filtered = data;

      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(apt => apt.status === filters.status);
      }

      if (filters.categoryId) {
        filtered = filtered.filter(apt => apt.category?.id === parseInt(filters.categoryId));
      }

      setAppointments(filtered);
    } catch (error) {
      console.error('Error cargando citas:', error);
      toast.error('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleEdit = (appointment) => {
    navigate(`/appointments/create?edit=${appointment.id}`);
  };

  const handleDeleteClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await appointmentService.delete(selectedAppointment.id);
      toast.success('Cita eliminada exitosamente');
      setShowDeleteModal(false);
      loadAppointments();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar la cita');
    } finally {
      setActionLoading(false);
    }
  };

  // 🔥 NUEVO: Completar cita desde la lista (abre el modal bloqueante)
  const handleCompleteClick = (appointment) => {
    setPendingCompletion([appointment]);
    setCurrentPendingIndex(0);
    setShowBlockingModal(true);
  };

  // 🔥 MODIFICADO: Manejo del submit de completar con cola
  const handleCompleteSubmit = async (data) => {
    setActionLoading(true);
    try {
      const completionData = {
        attended: data.attended === 'true',
        operatorObservation: data.operatorObservation,
        operatorRating: data.operatorRating ? parseInt(data.operatorRating) : null,
      };

      const currentAppointment = pendingCompletion[currentPendingIndex];
      await appointmentService.complete(currentAppointment.id, completionData);

      // Si hay más citas pendientes, pasar a la siguiente
      if (currentPendingIndex < pendingCompletion.length - 1) {
        setCurrentPendingIndex(prev => prev + 1);
        resetComplete();
        toast.success(`Cita completada. ${pendingCompletion.length - currentPendingIndex - 1} restante(s)`);
      } else {
        // No hay más, cerrar modal
        setShowBlockingModal(false);
        setPendingCompletion([]);
        setCurrentPendingIndex(0);
        resetComplete();
        toast.success('¡Todas las citas completadas!');
        loadAppointments();
      }
    } catch (error) {
      toast.error(error.message || 'Error al completar la cita');
    } finally {
      setActionLoading(false);
    }
  };

  // Calificar operario (desde la lista)
  const handleRateClick = (appointment) => {
    setSelectedAppointment(appointment);
    setRatingValue(0);
    resetRating();
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (data) => {
    setActionLoading(true);
    try {
      await appointmentService.rateOperator(
        selectedAppointment.id,
        ratingValue,
        data.observation || ''
      );
      toast.success('¡Operario calificado exitosamente!');
      setShowRatingModal(false);
      
      // Actualizar la lista de pendientes si venimos del prompt
      if (showRatingPrompt) {
        const remaining = pendingRatings.filter(apt => apt.id !== selectedAppointment.id);
        setPendingRatings(remaining);
        if (remaining.length === 0) {
          setShowRatingPrompt(false);
        }
      }
      
      loadAppointments();
    } catch (error) {
      toast.error(error.message || 'Error al calificar operario');
    } finally {
      setActionLoading(false);
    }
  };

  // 🔥 NUEVO: Saltar calificación (usuario)
  const handleSkipRating = () => {
    setShowRatingPrompt(false);
    setPendingRatings([]);
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      SCHEDULED: 'warning',
      IN_PROGRESS: 'primary',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      FAILED: 'default',
    };
    return variants[status] || 'default';
  };

  const canEdit = (appointment) => {
    if (isAdmin()) return !appointment.deleted;
    if (isOperator()) return appointment.operator?.id === user?.id && !appointment.deleted;
    return appointment.user?.id === user?.id && !appointment.deleted && appointment.status === APPOINTMENT_STATUS.SCHEDULED;
  };

  const canDelete = (appointment) => {
    if (isAdmin()) return !appointment.deleted;
    if (isOperator()) return false;
    return appointment.user?.id === user?.id && !appointment.deleted && appointment.status === APPOINTMENT_STATUS.SCHEDULED;
  };

  const canComplete = (appointment) => {
    if (!isOperator() || appointment.operator?.id !== user?.id) return false;
    
    // Permitir completar si está SCHEDULED o IN_PROGRESS
    const validStatuses = [APPOINTMENT_STATUS.SCHEDULED, 'IN_PROGRESS'];
    if (!validStatuses.includes(appointment.status)) return false;
    
    // Verificar si ya pasó la hora de inicio
    const appointmentStart = new Date(`${appointment.date}T${appointment.startTime}`);
    return appointmentStart < new Date();
  };

  // 🔥 MODIFICADO: Mostrar botón "Calificar" solo si ya pasó la hora de la cita
  const canRate = (appointment) => {
    if (isOperator() || isAdmin()) return false;
    if (appointment.user?.id !== user?.id) return false;
    if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) return false;
    if (appointment.attendanceStatus !== 'ATTENDED') return false;
    if (appointment.userRating) return false;
    
    // Verificar si ya pasó la hora de fin
    const appointmentEnd = new Date(`${appointment.date}T${appointment.endTime}`);
    return appointmentEnd < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y visualiza todas tus citas
          </p>
        </div>
        <Button onClick={() => navigate('/appointments/create')}>
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Estado"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'SCHEDULED', label: 'Programadas' },
              { value: 'COMPLETED', label: 'Completadas' },
              { value: 'CANCELLED', label: 'Canceladas' },
              { value: 'FAILED', label: 'Fallidas' },
            ]}
          />

          <Select
            label="Categoría"
            value={filters.categoryId}
            onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
            ]}
          />

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.includeDeleted}
                onChange={(e) => setFilters(prev => ({ ...prev, includeDeleted: e.target.checked }))}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Incluir eliminadas</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Lista de Citas */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="🔭"
          title="No hay citas"
          description="No se encontraron citas con los filtros aplicados"
          action={
            <Button onClick={() => navigate('/appointments/create')}>
              Crear Primera Cita
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className={appointment.deleted ? 'opacity-60' : ''}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{STATUS_EMOJIS[appointment.status]}</span>
                      <h3 className="font-bold text-lg text-gray-900">
                        {appointment.title}
                      </h3>
                    </div>
                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                      {APPOINTMENT_STATUS_LABELS[appointment.status]}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(appointment.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                  </div>
                  {appointment.category && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Folder className="w-4 h-4" />
                      <span>{appointment.category.name}</span>
                    </div>
                  )}
                  {(isAdmin() || !isOperator()) && appointment.operator && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Operario: {appointment.operator.fullName}</span>
                    </div>
                  )}
                  {isOperator() && appointment.user && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Usuario: {appointment.user.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {appointment.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {appointment.description}
                  </p>
                )}

                {/* Admin Observation */}
                {appointment.adminObservation && (
                  <div className="bg-warning-50 border-l-4 border-warning-500 p-3 rounded">
                    <p className="text-sm font-semibold text-warning-900 mb-1">
                      ⚠️ Observación del Administrador
                    </p>
                    <p className="text-sm text-warning-700">{appointment.adminObservation}</p>
                  </div>
                )}

                {/* Ratings */}
                {appointment.userRating && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Tu calificación:</span>
                    <StarRating value={appointment.userRating} readOnly size="sm" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(appointment)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </Button>

                  {canEdit(appointment) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(appointment)}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                  )}

                  {canDelete(appointment) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(appointment)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  )}

                  {canComplete(appointment) && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleCompleteClick(appointment)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Completar
                    </Button>
                  )}

                  {canRate(appointment) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRateClick(appointment)}
                    >
                      ⭐ Calificar Operario
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de la Cita"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Título</p>
                <p className="text-gray-900">{selectedAppointment.title}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Estado</p>
                <Badge variant={getStatusBadgeVariant(selectedAppointment.status)}>
                  {APPOINTMENT_STATUS_LABELS[selectedAppointment.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Fecha</p>
                <p className="text-gray-900">{formatDate(selectedAppointment.date)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Horario</p>
                <p className="text-gray-900">
                  {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                </p>
              </div>
              {selectedAppointment.category && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Categoría</p>
                  <p className="text-gray-900">{selectedAppointment.category.name}</p>
                </div>
              )}
              {selectedAppointment.operator && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Operario</p>
                  <p className="text-gray-900">{selectedAppointment.operator.fullName}</p>
                </div>
              )}
            </div>

            {selectedAppointment.description && (
              <div>
                <p className="text-sm font-semibold text-gray-600">Descripción</p>
                <p className="text-gray-900">{selectedAppointment.description}</p>
              </div>
            )}

            {selectedAppointment.operatorObservation && (
              <div>
                <p className="text-sm font-semibold text-gray-600">Observación del Operario</p>
                <p className="text-gray-900">{selectedAppointment.operatorObservation}</p>
              </div>
            )}

            {selectedAppointment.adminObservation && (
              <div className="bg-warning-50 p-3 rounded">
                <p className="text-sm font-semibold text-warning-900">Observación del Admin</p>
                <p className="text-warning-700">{selectedAppointment.adminObservation}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-semibold text-gray-600">Creada</p>
                <p className="text-sm text-gray-900">{formatDateTime(selectedAppointment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Última modificación</p>
                <p className="text-sm text-gray-900">{formatDateTime(selectedAppointment.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Cita"
        message={`¿Estás seguro de eliminar la cita "${selectedAppointment?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={actionLoading}
      />

      {/* 🔥 MODAL BLOQUEANTE: Completar Cita (OPERARIO) */}
      <Modal
        isOpen={showBlockingModal}
        onClose={() => {}} // No hace nada - BLOQUEANTE
        showCloseButton={false} // Sin botón X
        closeOnOverlayClick={false} // No se cierra al hacer clic fuera
        title="⚠️ Completar Citas Pendientes"
        size="lg"
      >
        {pendingCompletion.length > 0 && (
          <div className="space-y-4">
            <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded">
              <p className="text-danger-900 font-semibold">
                Debes completar estas citas antes de continuar
              </p>
              <p className="text-danger-700 text-sm mt-1">
                Cita {currentPendingIndex + 1} de {pendingCompletion.length}
              </p>
            </div>

            {/* Info de la cita actual */}
            <Card className="bg-gray-50">
              <h3 className="font-bold text-lg mb-2">
                {pendingCompletion[currentPendingIndex]?.title}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📅 {formatDate(pendingCompletion[currentPendingIndex]?.date)}</p>
                <p>🕐 {formatTime(pendingCompletion[currentPendingIndex]?.startTime)} - {formatTime(pendingCompletion[currentPendingIndex]?.endTime)}</p>
                <p>👤 Usuario: {pendingCompletion[currentPendingIndex]?.user?.fullName}</p>
              </div>
            </Card>

            {/* Formulario */}
            <form onSubmit={handleSubmitComplete(handleCompleteSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿El usuario asistió? <span className="text-danger-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="true"
                      {...registerComplete('attended', { required: 'Este campo es obligatorio' })}
                      className="w-4 h-4"
                    />
                    <span>✅ Sí, asistió</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="false"
                      {...registerComplete('attended', { required: 'Este campo es obligatorio' })}
                      className="w-4 h-4"
                    />
                    <span>❌ No, no asistió</span>
                  </label>
                </div>
                {errorsComplete.attended && (
                  <p className="text-sm text-danger-500 mt-1">{errorsComplete.attended.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Observación <span className="text-danger-500">*</span>
                </label>
                <textarea
                  {...registerComplete('operatorObservation', { 
                    required: 'La observación es obligatoria',
                    minLength: { value: 10, message: 'Mínimo 10 caracteres' }
                  })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe cómo fue la cita, si hubo alguna novedad, etc."
                />
                {errorsComplete.operatorObservation && (
                  <p className="text-sm text-danger-500 mt-1">{errorsComplete.operatorObservation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Calificación al Usuario (opcional)
                </label>
                <select
                  {...registerComplete('operatorRating')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sin calificar</option>
                  <option value="1">⭐ 1 - Muy malo</option>
                  <option value="2">⭐⭐ 2 - Malo</option>
                  <option value="3">⭐⭐⭐ 3 - Regular</option>
                  <option value="4">⭐⭐⭐⭐ 4 - Bueno</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 - Excelente</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={actionLoading}
                disabled={actionLoading}
              >
                {currentPendingIndex < pendingCompletion.length - 1 
                  ? '✅ Completar y Continuar' 
                  : '✅ Completar Cita'}
              </Button>
            </form>
          </div>
        )}
      </Modal>

      {/* 🔥 MODAL OPCIONAL: Prompt para calificar operario (USUARIO) */}
      <Modal
        isOpen={showRatingPrompt}
        onClose={handleSkipRating}
        title="⭐ Tienes citas por calificar"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
            <p className="text-primary-900 font-semibold">
              Tienes {pendingRatings.length} cita(s) completada(s)
            </p>
            <p className="text-primary-700 text-sm mt-1">
              ¿Te gustaría calificar la atención de tu operario?
            </p>
          </div>

          <div className="space-y-2">
            {pendingRatings.slice(0, 3).map((apt) => (
              <div key={apt.id} className="p-3 bg-gray-50 rounded border">
                <p className="font-semibold text-sm">{apt.title}</p>
                <p className="text-xs text-gray-600">
                  {formatDate(apt.date)} - Operario: {apt.operator?.fullName}
                </p>
              </div>
            ))}
            {pendingRatings.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                ... y {pendingRatings.length - 3} más
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkipRating}
              className="flex-1"
            >
              Ahora no
            </Button>
            <Button
              onClick={() => {
                setShowRatingPrompt(false);
                if (pendingRatings.length > 0) {
                  handleRateClick(pendingRatings[0]);
                }
              }}
              className="flex-1"
            >
              Calificar Ahora
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Calificar Operario (Individual) */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="⭐ Calificar Operario"
        size="md"
      >
        {selectedAppointment && (
          <form onSubmit={handleSubmitRating(handleRatingSubmit)} className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Califica la atención del operario
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                {selectedAppointment.operator?.fullName}
              </p>
              <StarRating
                value={ratingValue}
                onChange={setRatingValue}
                size="lg"
                className="justify-center"
              />
              {ratingValue === 0 && (
                <p className="text-sm text-danger-500 mt-2">
                  Debes seleccionar una calificación
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Comentarios (opcional)
              </label>
              <textarea
                {...registerRating('observation')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Cuéntanos sobre tu experiencia..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRatingModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={ratingValue === 0 || actionLoading}
                loading={actionLoading}
              >
                Enviar Calificación
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentsPage;