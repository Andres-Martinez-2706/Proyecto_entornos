import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Clock, Users, Tag 
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import CategoryForm from '../../components/forms/CategoryForm';
import categoryService from '../../api/categoryService';
import userService from '../../api/userService';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDurationsModal, setShowDurationsModal] = useState(false);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Selección
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDurations, setSelectedDurations] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [newDuration, setNewDuration] = useState('');

  // Duraciones predefinidas comunes (en minutos)
  const COMMON_DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [catsData, opsData] = await Promise.all([
        categoryService.getAll(),
        userService.getOperators(),
      ]);
      
      setCategories(catsData);
      setOperators(opsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    setActionLoading(true);
    try {
      await categoryService.create(formData);
      toast.success('Categoría creada exitosamente');
      setShowCreateModal(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al crear categoría');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    setActionLoading(true);
    try {
      await categoryService.update(selectedCategory.id, formData);
      toast.success('Categoría actualizada exitosamente');
      setShowEditModal(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al actualizar categoría');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleOpenDurations = async (category) => {
    setSelectedCategory(category);
    setActionLoading(true);
    
    try {
      const durations = await categoryService.getAllowedDurations(category.id);
      setSelectedDurations(durations || []);
      setShowDurationsModal(true);
    } catch (error) {
      toast.error('Error al cargar duraciones');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDurations = async () => {
    setActionLoading(true);
    try {
      await categoryService.updateAllowedDurations(
        selectedCategory.id,
        selectedDurations
      );
      
      toast.success('Duraciones actualizadas exitosamente');
      setShowDurationsModal(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al actualizar duraciones');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleDuration = (duration) => {
    setSelectedDurations(prev => {
      if (prev.includes(duration)) {
        return prev.filter(d => d !== duration);
      } else {
        return [...prev, duration].sort((a, b) => a - b);
      }
    });
  };

  const handleAddCustomDuration = () => {
    const minutes = parseInt(newDuration);
    
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Ingresa una duración válida');
      return;
    }
    
    if (minutes > 480) {
      toast.error('La duración máxima es 8 horas (480 minutos)');
      return;
    }
    
    if (selectedDurations.includes(minutes)) {
      toast.error('Esta duración ya está agregada');
      return;
    }
    
    setSelectedDurations(prev => [...prev, minutes].sort((a, b) => a - b));
    setNewDuration('');
  };

  const handleOpenOperators = async (category) => {
    setSelectedCategory(category);
    setActionLoading(true);
    
    try {
      const assignedOps = await categoryService.getOperators(category.id);
      const assignedIds = assignedOps.map(op => op.id);
      setSelectedOperators(assignedIds);
      setShowOperatorsModal(true);
    } catch (error) {
      toast.error('Error al cargar operarios');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveOperators = async () => {
    setActionLoading(true);
    try {
      await categoryService.assignOperators(
        selectedCategory.id,
        selectedOperators
      );
      
      toast.success('Operarios asignados exitosamente');
      setShowOperatorsModal(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al asignar operarios');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleOperator = (operatorId) => {
    setSelectedOperators(prev => {
      if (prev.includes(operatorId)) {
        return prev.filter(id => id !== operatorId);
      } else {
        return [...prev, operatorId];
      }
    });
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await categoryService.delete(selectedCategory.id);
      toast.success('Categoría eliminada exitosamente');
      setShowDeleteDialog(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar categoría');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las categorías de servicios
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Lista de Categorías */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No hay categorías"
          description="Crea tu primera categoría de servicio"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              Crear Primera Categoría
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {category.allowedDurations?.length || 0} duraciones
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {category.operators?.length || 0} operarios
                    </span>
                  </div>
                </div>

                {/* Duraciones preview */}
                {category.allowedDurations && category.allowedDurations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Duraciones:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {category.allowedDurations.slice(0, 4).map(dur => (
                        <Badge key={dur} variant="primary" className="text-xs">
                          {formatDuration(dur)}
                        </Badge>
                      ))}
                      {category.allowedDurations.length > 4 && (
                        <Badge variant="default" className="text-xs">
                          +{category.allowedDurations.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDurations(category)}
                  >
                    <Clock className="w-4 h-4" />
                    Duraciones
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenOperators(category)}
                  >
                    <Users className="w-4 h-4" />
                    Operarios
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(category)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Crear Categoría */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Categoría"
        size="md"
      >
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Modal: Editar Categoría */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Categoría"
        size="md"
      >
        <CategoryForm
          initialData={selectedCategory}
          onSubmit={handleEdit}
          onCancel={() => setShowEditModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Modal: Duraciones */}
      <Modal
        isOpen={showDurationsModal}
        onClose={() => setShowDurationsModal(false)}
        title={`Duraciones de ${selectedCategory?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona las duraciones permitidas para esta categoría
          </p>

          {/* Duraciones comunes */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Duraciones Comunes
            </p>
            <div className="grid grid-cols-4 gap-2">
              {COMMON_DURATIONS.map(duration => (
                <label
                  key={duration}
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDurations.includes(duration)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDurations.includes(duration)}
                    onChange={() => toggleDuration(duration)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">
                    {formatDuration(duration)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Duración personalizada */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Agregar Duración Personalizada
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Minutos"
                min="1"
                max="480"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                onClick={handleAddCustomDuration}
                disabled={!newDuration}
              >
                Agregar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Máximo 480 minutos (8 horas)
            </p>
          </div>

          {/* Duraciones seleccionadas */}
          {selectedDurations.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Duraciones Seleccionadas ({selectedDurations.length})
              </p>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                {selectedDurations.map(duration => (
                  <Badge
                    key={duration}
                    variant="primary"
                    className="cursor-pointer hover:bg-primary-200"
                    onClick={() => toggleDuration(duration)}
                  >
                    {formatDuration(duration)} ✕
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDurationsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveDurations}
              loading={actionLoading}
              disabled={selectedDurations.length === 0}
              className="flex-1"
            >
              Guardar Duraciones
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Asignar Operarios */}
      <Modal
        isOpen={showOperatorsModal}
        onClose={() => setShowOperatorsModal(false)}
        title={`Operarios de ${selectedCategory?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona los operarios que pueden atender esta categoría
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {operators.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No hay operarios"
                description="Crea operarios primero para asignarlos a esta categoría"
              />
            ) : (
              operators.map(operator => (
                <label
                  key={operator.id}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedOperators.includes(operator.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOperators.includes(operator.id)}
                    onChange={() => toggleOperator(operator.id)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {operator.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {operator.email}
                    </div>
                    {operator.averageRating > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        ⭐ {operator.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  {!operator.active && (
                    <Badge variant="default" className="text-xs">
                      Inactivo
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowOperatorsModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveOperators}
              loading={actionLoading}
              className="flex-1"
            >
              Guardar Operarios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar "${selectedCategory?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default CategoriesPage;