import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import Select from '../common/Select';
import Input from '../common/Input';
import categoryService from '../../api/categoryService';
import userService from '../../api/userService';
import { APPOINTMENT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const AppointmentFilters = ({ filters, onFilterChange, onClear }) => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [operators, setOperators] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [catsData, opsData] = await Promise.all([
        categoryService.getAll(),
        isAdmin() ? userService.getOperators() : Promise.resolve([]),
      ]);
      
      setCategories(catsData);
      setOperators(opsData);
    } catch (error) {
      console.error('Error al cargar opciones de filtros:', error);
    }
  };

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      value !== '' && value !== null && value !== undefined
    );
  };

  const statusOptions = [
    { value: APPOINTMENT_STATUS.SCHEDULED, label: 'Programadas' },
    { value: APPOINTMENT_STATUS.COMPLETED, label: 'Completadas' },
    { value: APPOINTMENT_STATUS.CANCELLED, label: 'Canceladas' },
    { value: APPOINTMENT_STATUS.FAILED, label: 'Fallidas' },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
          {hasActiveFilters() && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
              {Object.values(filters).filter(v => v).length}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* Búsqueda */}
          <SearchBar
            value={filters.search || ''}
            onChange={(value) => handleChange('search', value)}
            placeholder="Buscar por descripción, usuario, operario..."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Estado */}
            <Select
              label="Estado"
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              placeholder="Todos los estados"
            />

            {/* Categoría */}
            <Select
              label="Categoría"
              value={filters.categoryId || ''}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              options={categories.map(cat => ({
                value: cat.id,
                label: cat.name,
              }))}
              placeholder="Todas las categorías"
            />

            {/* Operario (solo admin) */}
            {isAdmin() && (
              <Select
                label="Operario"
                value={filters.operatorId || ''}
                onChange={(e) => handleChange('operatorId', e.target.value)}
                options={operators.map(op => ({
                  value: op.id,
                  label: op.fullName,
                }))}
                placeholder="Todos los operarios"
              />
            )}
          </div>

          {/* Rango de fechas */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Desde"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />

            <Input
              type="date"
              label="Hasta"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>

          {/* Filtros adicionales */}
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyPending || false}
                  onChange={(e) => handleChange('onlyPending', e.target.checked)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Solo pendientes de completar
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyRated || false}
                  onChange={(e) => handleChange('onlyRated', e.target.checked)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Solo con calificación
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyAttended || false}
                  onChange={(e) => handleChange('onlyAttended', e.target.checked)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Solo asistencias
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AppointmentFilters;