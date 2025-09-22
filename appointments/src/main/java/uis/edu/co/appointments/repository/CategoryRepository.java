package uis.edu.co.appointments.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}
