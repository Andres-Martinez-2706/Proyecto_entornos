package uis.edu.co.appointments.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT c FROM Category c WHERE LOWER(c.name) = LOWER(:name)")
    Optional<Category> findByNameIgnoreCase(@Param("name") String name);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.category.id = :categoryId AND a.deleted = false")
    long countAppointmentsByCategoryId(@Param("categoryId") Long categoryId);

}