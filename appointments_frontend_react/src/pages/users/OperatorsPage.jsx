import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Plus, Eye, Edit, Trash2, Tag, Clock, BarChart3, Calendar 
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import UserForm from '../../components/forms/UserForm';
import userService from '../../api/userService';
import categoryService from '../../api/categoryService';
import { scheduleService } from '../../api/scheduleService';
import { useDebounce } from '../../hooks/useDebounce';

const OperatorsPage = () => {
  // Estados principales
  const [operators, setOperators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showSchedulesModal, setShowSchedulesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Selección
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [operatorSchedules, setOperatorSchedules] = useState([]);
  const [operatorStats, setOperatorStats] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterOperators();
  }, [debouncedSearch, statusFilter]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [opsData, catsData] = await Promise.all([
        userService.getOperators(),
        categoryService.getAll(),
      ]);
      
      setOperators(opsData);
      setCategories(catsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar operarios');
    } finally {
      setLoading(false);
    }
  };

  const filterOperators = () => {
    // Aquí podrías implementar filtrado local
    // Por ahora solo recargamos
    loadInitialData();
  };

  const handleCreate = async (formData) => {
    setActionLoading(true);
    try {
      await userService.createOperator(
        formData.fullName,
        formData.email,
        formData.password
      );
      
      toast.success('Operario creado exitosamente');
      setShowCreateModal(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al crear operario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (operator) => {
    setActionLoading(true);
    try {
      await userService.updateActiveStatus(operator.id, !operator.active);
      
      toast.success(
        operator.active 
          ? 'Operario desactivado' 
          : 'Operario activado'
      );
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCategories = async (operator) => {
    setSelectedOperator(operator);
    
    const operatorCats = operator.operatorCategories || operator.categories || [];
    const assignedIds = operatorCats.map(c => c.id);
    
    console.log('🔧 Operador:', operator.fullName);
    console.log('📋 Categorías asignadas:', assignedIds);
    
    setSelectedCategories(assignedIds);
    setShowCategoriesModal(true);
  };

  const handleSaveCategories = async () => {
    setActionLoading(true);
    try {
      await userService.assignCategories(
        selectedOperator.id,
        selectedCategories
      );
      
      toast.success('Categorías asignadas exitosamente');
      setShowCategoriesModal(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al asignar categorías');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSchedules = async (operator) => {
    setSelectedOperator(operator);
    setActionLoading(true);
    
    try {
      const schedules = await scheduleService.getOperatorSchedules(operator.id);
      setOperatorSchedules(schedules || []);
      setShowSchedulesModal(true);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      toast.error('Error al cargar horarios del operario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStats = async (operator) => {
    setSelectedOperator(operator);
    setLoading(true);
    
    try {
      const stats = await userService.getUserBasicStats(operator.id);
      setOperatorStats(stats);
      setShowStatsModal(true);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (operator) => {
    setSelectedOperator(operator);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await userService.delete(selectedOperator.id);
      toast.success('Operario eliminado exitosamente');
      setShowDeleteDialog(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar operario');
    } finally {
      setActionLoading(false);
    }
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

  const getDayLabel = (day) => {
    const labels = {
      MONDAY: 'Lun',
      TUESDAY: 'Mar',
      WEDNESDAY: 'Mié',
      THURSDAY: 'Jue',
      FRIDAY: 'Vie',
      SATURDAY: 'Sáb',
      SUNDAY: 'Dom',
    };
    return labels[day] || day;
  };

  const filteredOperators = operators.filter(op => {
    const matchesSearch = op.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                         op.email.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && op.active) ||
                         (statusFilter === 'inactive' && !op.active);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operarios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los operarios del sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Operario
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre o email..."
          />
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos ({operators.length})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Activos ({operators.filter(o => o.active).length})
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactivos ({operators.filter(o => !o.active).length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Operarios */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : filteredOperators.length === 0 ? (
        <EmptyState
          icon="👷"
          title="No hay operarios"
          description="No se encontraron operarios con los filtros aplicados"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              Crear Primer Operario
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOperators.map((operator) => (
            <Card key={operator.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {operator.fullName}
                      </h3>
                      <Badge variant={operator.active ? 'success' : 'default'}>
                        {operator.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{operator.email}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {operator.totalAppointments || 0}
                    </div>
                    <div className="text-xs text-gray-600">Citas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {operator.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {operator.categories?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Categorías</div>
                  </div>
                </div>

                {/* Categories */}
                {(operator.operatorCategories || operator.categories) && (operator.operatorCategories || operator.categories).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Categorías Asignadas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(operator.operatorCategories || operator.categories).map(cat => (
                        <Badge key={cat.id} variant="primary" className="text-xs">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCategories(operator)}
                  >
                    <Tag className="w-4 h-4" />
                    Categorías
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSchedules(operator)}
                  >
                    <Clock className="w-4 h-4" />
                    Horarios
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenStats(operator)}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Stats
                  </Button>

                  <Button
                    variant={operator.active ? 'warning' : 'success'}
                    size="sm"
                    onClick={() => handleToggleStatus(operator)}
                  >
                    {operator.active ? 'Desactivar' : 'Activar'}
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(operator)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Crear Operario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Operario"
        size="md"
      >
        <UserForm
          isOperatorForm={true}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Modal: Asignar Categorías */}
      <Modal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        title={`Categorías de ${selectedOperator?.fullName}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona las categorías que este operario puede atender
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

      {/* Modal: Ver Horarios */}
      <Modal
        isOpen={showSchedulesModal}
        onClose={() => setShowSchedulesModal(false)}
        title={`Horarios de ${selectedOperator?.fullName}`}
        size="lg"
      >
        <div className="space-y-4">
          {operatorSchedules.length === 0 ? (
            <EmptyState
              icon={<Clock />}
              title="Sin horarios configurados"
              description="Este operario aún no tiene horarios definidos"
            />
          ) : (
            <div className="space-y-2">
              {operatorSchedules.map(schedule => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getDayLabel(schedule.dayOfWeek)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>
                  </div>
                  <Badge variant="primary">
                    {(() => {
                      const start = new Date(`2000-01-01T${schedule.startTime}`);
                      const end = new Date(`2000-01-01T${schedule.endTime}`);
                      const hours = Math.floor((end - start) / (1000 * 60 * 60));
                      return `${hours}h`;
                    })()}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSchedulesModal(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Estadísticas */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title={`Estadísticas de ${selectedOperator?.fullName}`}
        size="md"
      >
        {operatorStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-primary-600">
                  {operatorStats.totalAppointments || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Citas
                </div>
              </Card>

              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-success-600">
                  {operatorStats.completedAppointments || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Completadas
                </div>
              </Card>

              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-warning-600">
                  {operatorStats.averageRating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Rating Promedio
                </div>
              </Card>

              <Card className="text-center p-4">
                <div className="text-3xl font-bold text-danger-600">
                  {operatorStats.cancelledAppointments || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Canceladas
                </div>
              </Card>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowStatsModal(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Operario"
        message={`¿Estás seguro de eliminar a ${selectedOperator?.fullName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default OperatorsPage;