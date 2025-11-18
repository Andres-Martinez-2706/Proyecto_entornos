import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Card from '../common/Card';
import Spinner from '../common/Spinner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatsChart = ({ 
  type = 'line', // line, bar, pie
  data = [],
  title,
  subtitle,
  dataKeys = [],
  xAxisKey = 'name',
  loading = false,
  height = 300,
  showLegend = true,
  showGrid = true,
  colors = COLORS,
  customTooltip,
  className = '',
}) => {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="flex justify-center items-center" style={{ height }}>
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        )}
        <div 
          className="flex flex-col items-center justify-center text-gray-500" 
          style={{ height }}
        >
          <p className="text-sm">No hay datos disponibles</p>
        </div>
      </Card>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip content={customTooltip} />
            {showLegend && <Legend />}
            {dataKeys.map((key, index) => (
              <Bar 
                key={key.dataKey || key}
                dataKey={key.dataKey || key}
                fill={key.color || colors[index % colors.length]}
                name={key.name || key}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey={dataKeys[0]?.dataKey || dataKeys[0] || 'value'}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'line':
      default:
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip content={customTooltip} />
            {showLegend && <Legend />}
            {dataKeys.map((key, index) => (
              <Line
                key={key.dataKey || key}
                type="monotone"
                dataKey={key.dataKey || key}
                stroke={key.color || colors[index % colors.length]}
                name={key.name || key}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className={className}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  );
};

export default StatsChart;