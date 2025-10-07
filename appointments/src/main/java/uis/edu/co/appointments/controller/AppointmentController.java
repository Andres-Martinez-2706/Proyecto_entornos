package uis.edu.co.appointments.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import uis.edu.co.appointments.models.Appointment;
import uis.edu.co.appointments.security.UserDetailsImpl;
import uis.edu.co.appointments.service.AppointmentService;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // 🔹 Admin puede ver todas, usuario solo las suyas
    @GetMapping
    public List<Appointment> getAllAppointments(Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        if ("admin".equalsIgnoreCase(user.getRoleName())) {
            return appointmentService.findAll();
        } else {
            return appointmentService.findByUserId(user.getId());
        }
    }

    @GetMapping("/{id}")
    public Optional<Appointment> getAppointmentById(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Appointment> opt = appointmentService.findById(id);
        if (opt.isEmpty()) return opt;

        Appointment appointment = opt.get();
        if (!"admin".equalsIgnoreCase(user.getRoleName()) && !appointment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No autorizado para ver esta cita.");
        }

        return opt;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('usuario', 'admin')")
    public Appointment createAppointment(@RequestBody Appointment appointment, Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        if (!"admin".equalsIgnoreCase(user.getRoleName())) {
            appointment.getUser().setId(user.getId()); // fuerza a que el usuario común solo cree para sí mismo
        }
        return appointmentService.save(appointment);
    }

    @PutMapping("/{id}")
    public Appointment updateAppointment(@PathVariable Long id, @RequestBody Appointment appointment, Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Appointment> existing = appointmentService.findById(id);
        if (existing.isEmpty()) throw new RuntimeException("Cita no encontrada.");

        if (!"admin".equalsIgnoreCase(user.getRoleName()) && !existing.get().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No autorizado para modificar esta cita.");
        }

        appointment.setId(id);
        return appointmentService.save(appointment);
    }

    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Appointment> existing = appointmentService.findById(id);
        if (existing.isEmpty()) throw new RuntimeException("Cita no encontrada.");

        if (!"admin".equalsIgnoreCase(user.getRoleName()) && !existing.get().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No autorizado para eliminar esta cita.");
        }

        appointmentService.delete(id);
    }
}
