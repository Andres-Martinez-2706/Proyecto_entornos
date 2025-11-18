import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, Plus, Filter, ChevronLeft, ChevronRight 
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import AppointmentCalendar from '../../components/appointments/AppointmentCalendar';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../api/appointmentService';
import categoryService from '../../api/categoryService';
import { formatDate, formatTime } from '../../utils/formatters';
import { APPOINTMENT_STATUS } from '../../utils/constants';

const CalendarPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isOperator } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Estado del calendario
  const [view, setView] = useState('month'); // month, week, day, agenda
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'SCHEDULED', // Mostrar solo programadas por defecto
    categoryId: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal de detalles
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsData, categoriesData] = await Promise.all([
        appointmentService.getAll(),
        categoryService.getAll(),
      ]);

      // Filtrar citas
      let filtered = appointmentsData;

      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(apt => apt.status === filters.status);
      }

      if (filters.categoryId) {
        filtered = filtered.filter(apt => apt.category?.id === parseInt(filters.categoryId));
      }

      setAppointments(filtered);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setShowDetailsModal(true);
  };

  const handleSelectSlot = (slotInfo) => {
    // Navegar a crear cita con fecha preseleccionada
    const selectedDate = slotInfo.start.toISOString().split('T')[0];
    navigate(`/appointments/create?date=${selectedDate}`);
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getAppointmentCounts = () => {
    const counts = {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === APPOINTMENT_STATUS.SCHEDULED).length,
      completed: appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED).length,
      cancelled: appointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED).length,
    };
    return counts;
  };

  const counts = getAppointmentCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary-600" />
            Calendario de Citas
          </h1>
          <p className="text-gray-600 mt-1">
            Vista gráfica de todas tus citas
          </p>
        </div>
        <Button onClick={() => navigate('/appointments/create')}>
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Resumen Rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-primary-600">
            {counts.total}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total
          </div>
        </Card>

        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-warning-600">
            {counts.scheduled}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Programadas
          </div>
        </Card>

        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-success-600">
            {counts.completed}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Completadas
          </div>
        </Card>

        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-danger-600">
            {counts.cancelled}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Canceladas
          </div>
        </Card>
      </div>

      {/* Filtros y Controles */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Navegación de fecha */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Hoy
            </Button>
            
            <div className="flex items-center gap-1 border rounded-lg">
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else if (view === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else {
                    newDate.setDate(newDate.getDate() - 1);
                  }
                  handleNavigate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-l-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-4 text-sm font-medium text-gray-900">
                {currentDate.toLocaleDateString('es', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else if (view === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else {
                    newDate.setDate(newDate.getDate() + 1);
                  }
                  handleNavigate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-r-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vista */}
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
            >
              Mes
            </Button>
            <Button
              variant={view === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
            >
              Día
            </Button>
            <Button
              variant={view === 'agenda' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('agenda')}
            >
              Agenda
            </Button>
          </div>

          {/* Filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'SCHEDULED', label: 'Solo programadas' },
                { value: 'COMPLETED', label: 'Solo completadas' },
                { value: 'CANCELLED', label: 'Solo canceladas' },
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
          </div>
        )}
      </Card>

      {/* Calendario */}
      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center items-center h-96 p-6">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="p-6">
            <AppointmentCalendar
              appointments={appointments}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              view={view}
              onViewChange={handleViewChange}
              date={currentDate}
              onNavigate={handleNavigate}
              selectable={true}
            />
          </div>
        )}
      </Card>

      {/* Leyenda */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Leyenda
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Programadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Completadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Canceladas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-700">Fallidas</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Haz clic en una cita para ver más detalles o en un espacio vacío para crear una nueva
        </p>
      </Card>

      {/* Modal de Detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de la Cita"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedEvent.title || selectedEvent.category?.name}
              </h3>
              {getStatusBadge(selectedEvent.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Fecha</p>
                <p className="text-gray-900">{formatDate(selectedEvent.date)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Horario</p>
                <p className="text-gray-900">
                  {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                </p>
              </div>
            </div>

            {selectedEvent.description && (
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Descripción</p>
                <p className="text-gray-900">{selectedEvent.description}</p>
              </div>
            )}

            {/* OPERARIO ve QUIEN programó la cita (Usuario) */}
            {isOperator() && selectedEvent.user && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  👤 Programada por:
                </p>
                <p className="text-blue-800 font-medium">{selectedEvent.user.fullName}</p>
                <p className="text-xs text-blue-600">{selectedEvent.user.email}</p>
              </div>
            )}

            {/* USUARIO ve CON QUE OPERARIO tiene la cita */}
            {!isOperator() && !isAdmin() && selectedEvent.operator && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  👨‍💼 Operario asignado:
                </p>
                <p className="text-green-800 font-medium">{selectedEvent.operator.fullName}</p>
                <p className="text-xs text-green-600">{selectedEvent.operator.email}</p>
                {selectedEvent.operator.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-xs text-green-700">
                      {selectedEvent.operator.averageRating.toFixed(1)} / 5.0
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ADMIN ve AMBOS (Usuario Y Operario) */}
            {isAdmin() && (
              <div className="space-y-2">
                {selectedEvent.user && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-semibold text-purple-900 mb-1">
                      👤 Usuario:
                    </p>
                    <p className="text-purple-800 font-medium">{selectedEvent.user.fullName}</p>
                    <p className="text-xs text-purple-600">{selectedEvent.user.email}</p>
                  </div>
                )}
                
                {selectedEvent.operator && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm font-semibold text-indigo-900 mb-1">
                      👨‍💼 Operario:
                    </p>
                    <p className="text-indigo-800 font-medium">{selectedEvent.operator.fullName}</p>
                    <p className="text-xs text-indigo-600">{selectedEvent.operator.email}</p>
                    {selectedEvent.operator.averageRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-xs text-indigo-700">
                          {selectedEvent.operator.averageRating.toFixed(1)} / 5.0
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  navigate(`/appointments/${selectedEvent.id}`);
                }}
                className="flex-1"
              >
                Ver Detalles Completos
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;