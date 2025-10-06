package uis.edu.co.appointments.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Ejemplo: Optional<User> findByEmail(String email);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
