package uis.edu.co.appointments.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.repository.AppointmentRepository;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public List<Appointment> findAll() {
        return appointmentRepository.findAll();
    }

    public Optional<Appointment> findById(Long id) {
        return appointmentRepository.findById(id);
    }

    @Transactional
    public Appointment save(Appointment appointment) {
        validateAppointment(appointment);

        // Actualizar fecha de modificación
        appointment.setUpdatedAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    public void delete(Long id) {
        appointmentRepository.deleteById(id);
    }

    // --- Validaciones de horario y duración mínima ---
    private void validateAppointment(Appointment newAppointment) {
        LocalTime start = newAppointment.getStartTime();
        LocalTime end = newAppointment.getEndTime();

        // Validar duración mínima de 5 minutos
        if (end.isBefore(start.plusMinutes(5))) {
            throw new IllegalArgumentException("La cita debe durar al menos 5 minutos.");
        }

        // Validar conflictos de horario
        Long userId = newAppointment.getUser().getId();
        LocalDate date = newAppointment.getDate();

        List<Appointment> sameDayAppointments = appointmentRepository.findByUserIdAndDate(userId, date);

        for (Appointment existing : sameDayAppointments) {
            if (newAppointment.getId() != null && existing.getId().equals(newAppointment.getId())) {
                continue; // ignorar la misma cita si se está editando
            }

            boolean overlap = start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime());
            if (overlap) {
                throw new IllegalArgumentException("Conflicto: ya existe una cita en ese rango horario.");
            }
        }
    }
}
