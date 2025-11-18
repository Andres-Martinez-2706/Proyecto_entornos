import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, TrendingUp,
  AlertCircle, Star, Activity
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import StatsCard from '../../components/stats/StatsCard';
import StatsChart from '../../components/stats/StatsChart';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../api/appointmentService';
import userService from '../../api/userService';
import { formatDate, formatTime } from '../../utils/formatters';
import { APPOINTMENT_STATUS, ROLES } from '../../utils/constants';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOperator } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, upcoming] = await Promise.all([
        appointmentService.getDashboardStats('30d'),
        appointmentService.getUpcoming(),
      ]);

      setStats(dashboardStats);
      setUpcomingAppointments(upcoming.slice(0, 5));
      
      // Preparar datos para gráficos
      // Preparar datos para gráficos
      if (dashboardStats.appointmentsByDay) {
        const chartData = Object.entries(dashboardStats.appointmentsByDay).map(([date, count]) => ({
          name: new Date(date).toLocaleDateString('es', { 
            month: 'short', 
            day: 'numeric' 
          }),
          citas: Number(count) || 0,
        }));
        setChartData(chartData);
      } else {
        setChartData([]);
      }

      // Actividad reciente (últimas citas)
      if (isAdmin() || isOperator()) {
        const allAppointments = await appointmentService.getAll();
        setRecentActivity(
          allAppointments
            .filter(apt => apt.status === APPOINTMENT_STATUS.COMPLETED || 
                          apt.status === APPOINTMENT_STATUS.CANCELLED)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const getStatusBadge = (status) => {
    const variants = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'warning',
      [APPOINTMENT_STATUS.COMPLETED]: 'success',
      [APPOINTMENT_STATUS.CANCELLED]: 'danger',
      [APPOINTMENT_STATUS.FAILED]: 'default',
    };
    return variants[status] || 'default';
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
      {/* Header con saludo */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.fullName}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin() && 'Panel de administración del sistema'}
          {isOperator() && 'Gestiona tus citas y horarios'}
          {!isAdmin() && !isOperator() && 'Aquí tienes un resumen de tus citas'}
        </p>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Calendar}
          title="Total Citas"
          value={stats?.totalAppointments || 0}
          subtitle="Últimos 30 días"
          color="primary"
          onClick={() => navigate('/appointments')}
        />

        <StatsCard
          icon={CheckCircle}
          title="Completadas"
          value={stats?.completedAppointments || 0}
          subtitle={`${stats?.completionRate?.toFixed(1) || 0}% tasa de éxito`}
          trend="up"
          trendValue={`${stats?.completionRate?.toFixed(0) || 0}%`}
          color="success"
        />

        <StatsCard
          icon={XCircle}
          title="Canceladas"
          value={stats?.cancelledAppointments || 0}
          subtitle={`${stats?.cancellationRate?.toFixed(1) || 0}% cancelación`}
          trend={stats?.cancellationRate > 15 ? 'down' : 'neutral'}
          trendValue={`${stats?.cancellationRate?.toFixed(0) || 0}%`}
          color="danger"
        />

        <StatsCard
          icon={Star}
          title="Rating Promedio"
          value={stats?.averageRating?.toFixed(1) || '0.0'}
          subtitle="De operarios"
          color="warning"
        />
      </div>

      {/* Estadísticas adicionales para Admin */}
      {isAdmin() && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon={Users}
            title="Operarios Activos"
            value={stats?.activeOperators || 0}
            subtitle="En el sistema"
            color="primary"
            onClick={() => navigate('/operators')}
          />

          <StatsCard
            icon={Activity}
            title="Categorías"
            value={stats?.totalCategories || 0}
            subtitle="Disponibles"
            color="success"
            onClick={() => navigate('/categories')}
          />

          <StatsCard
            icon={TrendingUp}
            title="Usuarios Totales"
            value={stats?.totalUsers || 0}
            subtitle="Registrados"
            color="warning"
            onClick={() => navigate('/users')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de tendencias (2/3) */}
        <div className="lg:col-span-2">
          <StatsChart
            type="bar"
            data={chartData}
            title="Tendencia de Citas - Últimos 30 días"
            subtitle="Comparativa de citas por día"
            dataKeys={[
              { dataKey: 'citas', name: 'Total', color: '#3b82f6' },
              { dataKey: 'completadas', name: 'Completadas', color: '#10b981' },
              { dataKey: 'canceladas', name: 'Canceladas', color: '#ef4444' },
            ]}
            height={300}
          />
        </div>

        {/* Distribución por estado (1/3) */}
        <div>
          <StatsChart
            type="pie"
            data={[
              { name: 'Completadas', value: stats?.completedAppointments || 0 },
              { name: 'Programadas', value: stats?.scheduledAppointments || 0 },
              { name: 'Canceladas', value: stats?.cancelledAppointments || 0 },
              { name: 'Fallidas', value: stats?.failedAppointments || 0 },
            ]}
            title="Distribución de Citas"
            subtitle="Por estado"
            dataKeys={['value']}
            colors={['#10b981', '#fbbf24', '#ef4444', '#6b7280']}
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas citas */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Próximas Citas
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/appointments')}
            >
              Ver todas →
            </Button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hay citas próximas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/appointments/${apt.id}`)}
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {apt.category?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(apt.date)} • {formatTime(apt.startTime)}
                    </div>
                    {isAdmin() || isOperator() ? (
                      <div className="text-xs text-gray-500">
                        Usuario: {apt.user?.fullName}
                      </div>
                    ) : (
                      apt.operator && (
                        <div className="text-xs text-gray-500">
                          Operario: {apt.operator.fullName}
                        </div>
                      )
                    )}
                  </div>
                  <Badge variant={getStatusBadge(apt.status)}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {upcomingAppointments.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => navigate('/appointments/create')}
                className="w-full"
              >
                + Nueva Cita
              </Button>
            </div>
          )}
        </Card>

        {/* Actividad reciente (Admin/Operario) */}
        {(isAdmin() || isOperator()) && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Actividad Reciente
              </h3>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(apt => (
                  <div
                    key={apt.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      apt.status === APPOINTMENT_STATUS.COMPLETED 
                        ? 'bg-success-100'
                        : 'bg-danger-100'
                    }`}>
                      {apt.status === APPOINTMENT_STATUS.COMPLETED ? (
                        <CheckCircle className="w-4 h-4 text-success-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {apt.status === APPOINTMENT_STATUS.COMPLETED 
                          ? 'Cita completada'
                          : 'Cita cancelada'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {apt.category?.name} • {apt.user?.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(apt.updatedAt)} {formatTime(apt.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Quick actions para usuarios normales */}
        {!isAdmin() && !isOperator() && (
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/appointments/create')}
                className="w-full justify-start"
              >
                <Calendar className="w-5 h-5" />
                Agendar Nueva Cita
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/appointments')}
                className="w-full justify-start"
              >
                <Clock className="w-5 h-5" />
                Ver Mis Citas
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/calendar')}
                className="w-full justify-start"
              >
                <Calendar className="w-5 h-5" />
                Ver Calendario
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="w-full justify-start"
              >
                <Users className="w-5 h-5" />
                Mi Perfil
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Alertas y recordatorios */}
      {stats?.pendingCompletions > 0 && isOperator() && (
        <Card className="bg-warning-50 border-l-4 border-warning-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-warning-900 mb-1">
                Citas Pendientes de Completar
              </h4>
              <p className="text-sm text-warning-800 mb-3">
                Tienes {stats.pendingCompletions} cita{stats.pendingCompletions > 1 ? 's' : ''} pendiente{stats.pendingCompletions > 1 ? 's' : ''} de completar
              </p>
              <Button
                size="sm"
                variant="warning"
                onClick={() => navigate('/appointments?status=SCHEDULED')}
              >
                Completar Citas
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;