package uis.edu.co.appointments.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
}
