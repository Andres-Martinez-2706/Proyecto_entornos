import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, Plus, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { scheduleService } from '../../api/scheduleService';
import categoryService from '../../api/categoryService';
import userService from '../../api/userService';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

const SchedulePage = () => {
  const { user } = useAuth();
  
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myCategories, setMyCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modales de horarios
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);
  
  // Modal de categorías
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [schedulesData, categoriesData, userData] = await Promise.all([
        scheduleService.getMySchedules(),
        categoryService.getAll(),
        userService.getById(user.id),
      ]);
      
      setSchedules(schedulesData);
      setCategories(categoriesData);
      
      // ✅ FIX: El backend devuelve operatorCategories, no categories
      const userCategories = userData.operatorCategories || userData.categories || [];
      console.log('📦 Categorías cargadas:', userCategories);
      setMyCategories(userCategories);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await scheduleService.getMySchedules();
      setSchedules(data);
    } catch (error) {
      toast.error('Error al cargar horarios');
    }
  };

  // ============= GESTIÓN DE HORARIOS =============

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        dayOfWeek: '',
        startTime: '',
        endTime: '',
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = 'Selecciona un día';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Ingresa hora de inicio';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'Ingresa hora de fin';
    }
    
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'La hora de fin debe ser posterior a la de inicio';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setActionLoading(true);
    
    try {
      const scheduleData = {
        operatorId: user.id,
        ...formData,
      };
      
      if (editingSchedule) {
        await scheduleService.update(editingSchedule.id, scheduleData);
        toast.success('Horario actualizado exitosamente');
      } else {
        await scheduleService.create(scheduleData);
        toast.success('Horario creado exitosamente');
      }
      
      handleCloseModal();
      loadSchedules();
    } catch (error) {
      toast.error(error.message || 'Error al guardar horario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await scheduleService.delete(deletingScheduleId);
      toast.success('Horario eliminado exitosamente');
      setShowDeleteDialog(false);
      setDeletingScheduleId(null);
      loadSchedules();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar horario');
    } finally {
      setActionLoading(false);
    }
  };

  // ============= GESTIÓN DE CATEGORÍAS =============

  const handleOpenCategories = () => {
    const assignedIds = myCategories.map(c => c.id);
    console.log('🔧 Categorías actuales:', assignedIds);
    setSelectedCategories(assignedIds);
    setShowCategoriesModal(true);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSaveCategories = async () => {
    setActionLoading(true);
    try {
      console.log('💾 Guardando categorías:', selectedCategories);
      await userService.assignCategories(user.id, selectedCategories);
      toast.success('Categorías actualizadas exitosamente');
      setShowCategoriesModal(false);
      
      // ✅ Recargar datos del usuario
      const userData = await userService.getById(user.id);
      const userCategories = userData.operatorCategories || userData.categories || [];
      console.log('✅ Categorías actualizadas:', userCategories);
      setMyCategories(userCategories);
    } catch (error) {
      console.error('❌ Error al actualizar categorías:', error);
      toast.error(error.message || 'Error al actualizar categorías');
    } finally {
      setActionLoading(false);
    }
  };

  // ============= HELPERS =============

  const getDayLabel = (dayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || dayOfWeek;
  };

  const groupedSchedules = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.value] = schedules.filter(s => s.dayOfWeek === day.value);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-7 h-7" />
            Mi Configuración
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus horarios y categorías de atención
          </p>
        </div>
      </div>

      {/* ========== SECCIÓN: MIS CATEGORÍAS ========== */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-600" />
              Mis Categorías de Atención
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona las categorías en las que puedes atender
            </p>
          </div>
          <Button onClick={handleOpenCategories} variant="outline">
            <Edit className="w-4 h-4" />
            Editar Categorías
          </Button>
        </div>

        {myCategories.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">
              No tienes categorías asignadas aún
            </p>
            <Button onClick={handleOpenCategories} size="sm">
              Seleccionar Categorías
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myCategories.map(cat => (
              <Badge key={cat.id} variant="primary" className="text-sm py-2 px-3">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* ========== SECCIÓN: MIS HORARIOS ========== */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Mis Horarios de Atención
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configura los días y horarios en los que estás disponible
            </p>
          </div>
          
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Nuevo Horario
          </Button>
        </div>

        {schedules.length === 0 ? (
          <EmptyState
            icon={<Clock />}
            title="No tienes horarios configurados"
            description="Configura tus horarios de atención para que los usuarios puedan agendar citas contigo"
            action={
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4" />
                Crear Primer Horario
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {DAYS_OF_WEEK.map(day => {
              const daySchedules = groupedSchedules[day.value];
              
              if (daySchedules.length === 0) return null;
              
              return (
                <Card key={day.value}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      {day.label}
                    </h3>
                    <Badge variant="primary">
                      {daySchedules.length} {daySchedules.length === 1 ? 'horario' : 'horarios'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {daySchedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(schedule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingScheduleId(schedule.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== MODAL: CATEGORÍAS ========== */}
      <Modal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        title="Mis Categorías de Atención"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona las categorías que puedes atender. Los usuarios podrán agendar citas contigo solo en estas categorías.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map(category => (
              <label
                key={category.id}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {category.name}
                  </div>
                  {category.description && (
                    <div className="text-xs text-gray-500">
                      {category.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCategoriesModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategories}
              loading={actionLoading}
              className="flex-1"
            >
              Guardar Categorías
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========== MODAL: HORARIOS ========== */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Día de la semana <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dayOfWeek: e.target.value
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona un día</option>
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <p className="mt-1 text-sm text-danger-500">{errors.dayOfWeek}</p>
            )}
          </div>

          <Input
            type="time"
            label="Hora de inicio"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              startTime: e.target.value
            }))}
            error={errors.startTime}
            required
          />

          <Input
            type="time"
            label="Hora de fin"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              endTime: e.target.value
            }))}
            error={errors.endTime}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={actionLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={actionLoading}
              className="flex-1"
            >
              {editingSchedule ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== DIÁLOGO: ELIMINAR HORARIO ========== */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingScheduleId(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Horario"
        message="¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        loading={actionLoading}
      />
    </div>
  );
};

export default SchedulePage;