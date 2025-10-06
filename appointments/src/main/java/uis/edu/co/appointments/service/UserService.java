package uis.edu.co.appointments.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uis.edu.co.appointments.models.Role;
import uis.edu.co.appointments.models.User;
import uis.edu.co.appointments.repository.RoleRepository;
import uis.edu.co.appointments.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // Método general de guardado (no toca el hash) - útil para admin o actualizaciones controladas
    public User save(User user) {
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    // Registro público — valida email, asigna rol 'usuario' y hace hash de la contraseña
    @Transactional
    public User register(User user) {
        if (user.getEmail() == null || user.getPasswordHash() == null) {
            throw new IllegalArgumentException("Email y contraseña son obligatorios");
        }

        if (existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }

        // Buscar rol por nombre (debe existir en la tabla roles)
        Role defaultRole = roleRepository.findByName("usuario")
                .orElseThrow(() -> new IllegalStateException("Rol por defecto 'usuario' no encontrado. Ejecuta seed de roles."));

        // Hashear la contraseña (user.passwordHash contiene la contraseña en texto plano al registrar)
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setRole(defaultRole);

        return userRepository.save(user);
    }
}
