import { useState, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Users, Star, Clock, CheckCircle, XCircle,
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import StatsCard from '../../components/stats/StatsCard';
import StatsChart from '../../components/stats/StatsChart';
import DateRangeFilter from '../../components/stats/DateRangeFilter';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../api/appointmentService';
import userService from '../../api/userService';

const StatsPage = () => {
  const { user, isAdmin, isOperator } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({
    daily: [],
    byCategory: [],
    byOperator: [],
    byStatus: [],
  });

  useEffect(() => {
    loadStats();
  }, [period, startDate, endDate]);

  const loadStats = async () => {
    setLoading(true);
    try {
      let statsData;
      
      if (isAdmin()) {
        // Admin: estadísticas globales
        statsData = await appointmentService.getDashboardStats(
          period,
          startDate || null,
          endDate || null
        );
      } else if (isOperator()) {
        // Operario: estadísticas propias
        statsData = await appointmentService.getOperatorStats(
          user.id,
          startDate || null,
          endDate || null
        );
      }

      setStats(statsData);

      // Preparar datos para gráficos
      prepareChartData(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (data) => {
    if (!data) {
      setChartData({ daily: [], byStatus: [], byCategory: [], byOperator: [] });
      return;
    }

    // Gráfico de tendencia diaria - convertir de objeto a array
    const daily = data.appointmentsByDay && typeof data.appointmentsByDay === 'object'
      ? Object.entries(data.appointmentsByDay).map(([date, count]) => ({
          name: new Date(date).toLocaleDateString('es', {
            month: 'short',
            day: 'numeric'
          }),
          total: Number(count) || 0,
        }))
      : [];

    // Distribución por estado
    const byStatus = [
      { name: 'Programadas', value: data.scheduledAppointments || 0, color: '#fbbf24' },
      { name: 'Completadas', value: data.completedAppointments || 0, color: '#10b981' },
      { name: 'Canceladas', value: data.cancelledAppointments || 0, color: '#ef4444' },
      { name: 'Fallidas', value: data.failedAppointments || 0, color: '#6b7280' },
    ];

    // Por categoría - convertir de objeto Map a array
    const byCategory = data.appointmentsByCategory && typeof data.appointmentsByCategory === 'object'
      ? Object.entries(data.appointmentsByCategory).map(([name, value]) => ({
          name: name || 'Sin categoría',
          value: Number(value) || 0,
        }))
      : [];

    // Por operario - convertir de objeto Map a array (solo admin)
    const byOperator = data.appointmentsByOperator && typeof data.appointmentsByOperator === 'object'
      ? Object.entries(data.appointmentsByOperator).map(([name, value]) => ({
          name: name || 'Sin nombre',
          value: Number(value) || 0,
        }))
      : [];

    setChartData({
      daily,
      byStatus,
      byCategory,
      byOperator,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin() ? 'Estadísticas del Sistema' : 'Mis Estadísticas'}
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado del desempeño
          </p>
        </div>
      </div>

      {/* Filtro de Período */}
      <Card>
        <DateRangeFilter
          period={period}
          startDate={startDate}
          endDate={endDate}
          onPeriodChange={setPeriod}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          showApplyButton={false}
        />
      </Card>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Calendar}
          title="Total Citas"
          value={stats?.totalAppointments || 0}
          subtitle={getPeriodLabel(period)}
          color="primary"
        />

        <StatsCard
          icon={CheckCircle}
          title="Completadas"
          value={stats?.completedAppointments || 0}
          subtitle={`${stats?.completionRate?.toFixed(1) || 0}% tasa`}
          trend={stats?.completionRate > 70 ? 'up' : 'down'}
          trendValue={`${stats?.completionRate?.toFixed(0) || 0}%`}
          color="success"
        />

        <StatsCard
          icon={XCircle}
          title="Canceladas"
          value={stats?.cancelledAppointments || 0}
          subtitle={`${stats?.cancellationRate?.toFixed(1) || 0}% tasa`}
          trend={stats?.cancellationRate < 20 ? 'up' : 'down'}
          trendValue={`${stats?.cancellationRate?.toFixed(0) || 0}%`}
          color="danger"
        />

        <StatsCard
          icon={Star}
          title="Rating Promedio"
          value={stats?.averageRating?.toFixed(1) || '0.0'}
          subtitle="Calificación"
          color="warning"
        />
      </div>

      {/* Estadísticas Adicionales */}
      {isAdmin() && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon={Users}
            title="Operarios Activos"
            value={stats?.activeOperators || 0}
            subtitle="Trabajando"
            color="primary"
          />

          <StatsCard
            icon={Clock}
            title="Duración Promedio"
            value={`${stats?.averageDuration || 0}m`}
            subtitle="Por cita"
            color="success"
          />

          <StatsCard
            icon={TrendingUp}
            title="Tasa de Asistencia"
            value={`${stats?.attendanceRate?.toFixed(1) || 0}%`}
            subtitle="Usuarios asisten"
            color="warning"
          />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Citas */}
        <div className="lg:col-span-2">
          <StatsChart
            type="line"
            data={chartData.daily}
            title="Tendencia de Citas"
            subtitle={`${getPeriodLabel(period)}`}
            dataKeys={[
              { dataKey: 'total', name: 'Total', color: '#3b82f6' },
              { dataKey: 'completadas', name: 'Completadas', color: '#10b981' },
              { dataKey: 'canceladas', name: 'Canceladas', color: '#ef4444' },
            ]}
            height={350}
          />
        </div>

        {/* Distribución por Estado */}
        <StatsChart
          type="pie"
          data={chartData.byStatus}
          title="Distribución por Estado"
          subtitle="Resumen general"
          dataKeys={['value']}
          colors={['#fbbf24', '#10b981', '#ef4444', '#6b7280']}
          height={300}
        />

        {/* Por Categoría */}
        {chartData.byCategory.length > 0 && (
          <StatsChart
            type="bar"
            data={chartData.byCategory}
            title="Citas por Categoría"
            subtitle="Top categorías"
            dataKeys={[
              { dataKey: 'value', name: 'Citas', color: '#3b82f6' }
            ]}
            height={300}
          />
        )}
      </div>

      {/* Tabla de Operarios (Solo Admin) */}
      {isAdmin() && chartData.byOperator.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Desempeño por Operario
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Operario
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Citas
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Desempeño
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chartData.byOperator.map((op, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {op.name}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {op.value}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold">
                          {op.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {op.rating >= 4.5 ? (
                        <Badge variant="success">Excelente</Badge>
                      ) : op.rating >= 3.5 ? (
                        <Badge variant="primary">Bueno</Badge>
                      ) : op.rating >= 2.5 ? (
                        <Badge variant="warning">Regular</Badge>
                      ) : (
                        <Badge variant="danger">Bajo</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Insights y Recomendaciones */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-l-4 border-primary-500">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary-900 mb-2">
              💡 Insights del Período
            </h4>
            <ul className="space-y-1 text-sm text-primary-800">
              {stats?.completionRate > 80 && (
                <li>✓ Excelente tasa de completación ({stats.completionRate.toFixed(1)}%)</li>
              )}
              {stats?.cancellationRate < 15 && (
                <li>✓ Baja tasa de cancelación ({stats.cancellationRate.toFixed(1)}%)</li>
              )}
              {stats?.averageRating >= 4.0 && (
                <li>✓ Alta satisfacción de usuarios (⭐ {stats.averageRating.toFixed(1)})</li>
              )}
              {stats?.attendanceRate > 85 && (
                <li>✓ Excelente asistencia de usuarios ({stats.attendanceRate.toFixed(1)}%)</li>
              )}
              
              {stats?.completionRate < 70 && (
                <li>⚠️ Considera revisar los procesos de seguimiento de citas</li>
              )}
              {stats?.cancellationRate > 25 && (
                <li>⚠️ Tasa de cancelación alta, revisa las políticas</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper
const getPeriodLabel = (period) => {
  const labels = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    '3m': 'Últimos 3 meses',
    '6m': 'Últimos 6 meses',
    '1y': 'Último año',
    'custom': 'Período personalizado',
  };
  return labels[period] || 'Período seleccionado';
};

export default StatsPage;