import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const PERIOD_PRESETS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'custom', label: 'Personalizado' },
];

const DateRangeFilter = ({ 
  period = '30d',
  startDate = '',
  endDate = '',
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  showApplyButton = true,
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const handlePeriodChange = (newPeriod) => {
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }

    // Si no es custom, limpiar fechas
    if (newPeriod !== 'custom') {
      setLocalStartDate('');
      setLocalEndDate('');
      if (onStartDateChange) onStartDateChange('');
      if (onEndDateChange) onEndDateChange('');
    }
  };

  const handleApply = () => {
    if (period === 'custom') {
      if (onStartDateChange) onStartDateChange(localStartDate);
      if (onEndDateChange) onEndDateChange(localEndDate);
    }
    if (onApply) onApply();
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    if (onPeriodChange) onPeriodChange('30d');
    if (onStartDateChange) onStartDateChange('');
    if (onEndDateChange) onEndDateChange('');
    if (onClear) onClear();
  };

  const isCustomPeriod = period === 'custom';
  const hasCustomDates = isCustomPeriod && (localStartDate || localEndDate);

  return (
    <div className="space-y-4">
      {/* Selector de período predefinido */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0" />
        <Select
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value)}
          options={PERIOD_PRESETS}
          className="flex-1"
        />
      </div>

      {/* Rango personalizado */}
      {isCustomPeriod && (
        <div className="pl-7 space-y-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Fecha Inicio"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              max={localEndDate || new Date().toISOString().split('T')[0]}
            />

            <Input
              type="date"
              label="Fecha Fin"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              min={localStartDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Botones de acción */}
          {showApplyButton && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApply}
                disabled={!localStartDate || !localEndDate}
                className="flex-1"
              >
                Aplicar
              </Button>
              
              {hasCustomDates && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Validación */}
          {localStartDate && localEndDate && localStartDate > localEndDate && (
            <p className="text-xs text-danger-500">
              La fecha de inicio debe ser anterior a la fecha de fin
            </p>
          )}
        </div>
      )}

      {/* Información del rango actual */}
      {!isCustomPeriod && (
        <p className="text-xs text-gray-500 pl-7">
          {PERIOD_PRESETS.find(p => p.value === period)?.label}
        </p>
      )}

      {hasCustomDates && (
        <div className="pl-7 p-2 bg-primary-50 border border-primary-200 rounded text-xs text-primary-800">
          <strong>Rango seleccionado:</strong>
          <br />
          {localStartDate && new Date(localStartDate).toLocaleDateString('es')}
          {' - '}
          {localEndDate && new Date(localEndDate).toLocaleDateString('es')}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;