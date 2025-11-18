import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../common/Card';
import { cn } from '../../utils/cn';

const StatsCard = ({ 
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'primary',
  loading = false,
  onClick,
  className,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4" />;
    } else if (trend === 'down') {
      return <TrendingDown className="w-4 h-4" />;
    } else {
      return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    if (trend === 'up') {
      return 'text-success-600';
    } else if (trend === 'down') {
      return 'text-danger-600';
    } else {
      return 'text-gray-500';
    }
  };

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Icono */}
        {Icon && (
          <div className={cn('p-3 rounded-lg flex-shrink-0', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Título */}
          <div className="text-sm text-gray-600 mb-1">
            {title}
          </div>

          {/* Valor principal */}
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              {value}
            </div>
          )}

          {/* Subtitle o Trend */}
          <div className="flex items-center gap-2 mt-1">
            {subtitle && (
              <div className="text-xs text-gray-500">
                {subtitle}
              </div>
            )}

            {trend && trendValue && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
                {getTrendIcon()}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;