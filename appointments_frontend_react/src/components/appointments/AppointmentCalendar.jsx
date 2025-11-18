import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { APPOINTMENT_STATUS } from '../../utils/constants';

moment.locale('es');
const localizer = momentLocalizer(moment);

const AppointmentCalendar = ({ 
  appointments = [],
  onSelectEvent,
  onSelectSlot,
  view = 'month',
  onViewChange,
  date,
  onNavigate,
  selectable = true,
  className = '',
}) => {
  // Convertir citas a eventos del calendario
  const events = appointments.map(apt => {
    const startDateTime = moment(`${apt.date} ${apt.startTime}`, 'YYYY-MM-DD HH:mm:ss').toDate();
    const endDateTime = moment(`${apt.date} ${apt.endTime}`, 'YYYY-MM-DD HH:mm:ss').toDate();

    return {
      id: apt.id,
      title: apt.category?.name || 'Sin categoría',
      start: startDateTime,
      end: endDateTime,
      resource: apt,
    };
  });

  // Estilos personalizados según el estado
  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    
    let backgroundColor = '#94a3b8'; // gray default
    let borderColor = '#64748b';
    
    switch (status) {
      case APPOINTMENT_STATUS.SCHEDULED:
        backgroundColor = '#fbbf24'; // yellow
        borderColor = '#f59e0b';
        break;
      case APPOINTMENT_STATUS.COMPLETED:
        backgroundColor = '#10b981'; // green
        borderColor = '#059669';
        break;
      case APPOINTMENT_STATUS.CANCELLED:
        backgroundColor = '#ef4444'; // red
        borderColor = '#dc2626';
        break;
      case APPOINTMENT_STATUS.FAILED:
        backgroundColor = '#6b7280'; // gray
        borderColor = '#4b5563';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        color: 'white',
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '0.875rem',
        fontWeight: '500',
      },
    };
  };

  // Mensajes en español
  const messages = {
    allDay: 'Todo el día',
    previous: '← Anterior',
    next: 'Siguiente →',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay citas en este rango de fechas',
    showMore: (total) => `+ Ver más (${total})`,
  };

  // ✅ FIX: Componente personalizado para el evento
  const EventComponent = ({ event }) => {
    const apt = event.resource; // ✅ Extraer apt del resource
    
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="truncate font-medium">{event.title}</span>
        {apt.user && apt.operator && (
          <span className="text-xs opacity-75 truncate">
            • {apt.user.fullName.split(' ')[0]} → {apt.operator.fullName.split(' ')[0]}
          </span>
        )}
      </div>
    );
  };

  // Componente personalizado para la agenda
  const AgendaEvent = ({ event }) => {
    const apt = event.resource;
    return (
      <div className="py-2">
        <div className="font-semibold">{event.title}</div>
        <div className="text-sm text-gray-600">
          {apt.user?.fullName}
          {apt.operator && ` • ${apt.operator.fullName}`}
        </div>
        {apt.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {apt.description}
          </div>
        )}
      </div>
    );
  };

  const handleSelectSlot = (slotInfo) => {
    // Solo permitir seleccionar slots futuros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (slotInfo.start >= today && onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  };

  return (
    <div className={`appointment-calendar ${className}`}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600, minHeight: 500 }}
        messages={messages}
        view={view}
        onView={onViewChange}
        date={date}
        onNavigate={onNavigate}
        onSelectEvent={onSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable={selectable}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        components={{
          event: EventComponent,
          agenda: {
            event: AgendaEvent,
          },
        }}
        popup
        step={30}
        timeslots={2}
        min={new Date(2000, 0, 1, 7, 0, 0)} // 7 AM
        max={new Date(2000, 0, 1, 21, 0, 0)} // 9 PM
        formats={{
          dayFormat: 'DD ddd',
          dayHeaderFormat: 'dddd DD [de] MMMM',
          monthHeaderFormat: 'MMMM YYYY',
          agendaDateFormat: 'DD ddd',
          agendaTimeFormat: 'HH:mm',
          agendaTimeRangeFormat: ({ start, end }) =>
            `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
        }}
      />
    </div>
  );
};

export default AppointmentCalendar;