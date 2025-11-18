import { Calendar } from 'lucide-react';
import AppointmentCard from './AppointmentCard';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import Pagination from '../common/Pagination';

const AppointmentList = ({ 
  appointments = [],
  loading = false,
  emptyMessage = 'No hay citas disponibles',
  emptyDescription = 'Las citas aparecerán aquí cuando las crees',
  showPagination = false,
  currentPage = 0,
  totalPages = 0,
  onPageChange,
  onComplete,
  onCancel,
  onRate,
  onCreateNew,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={<Calendar />}
        title={emptyMessage}
        description={emptyDescription}
        action={
          onCreateNew && (
            <Button onClick={onCreateNew}>
              + Nueva Cita
            </Button>
          )
        }
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 mb-6">
        {appointments.map(appointment => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onComplete={onComplete}
            onCancel={onCancel}
            onRate={onRate}
          />
        ))}
      </div>

      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default AppointmentList;