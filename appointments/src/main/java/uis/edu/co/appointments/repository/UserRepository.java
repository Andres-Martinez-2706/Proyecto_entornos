package uis.edu.co.appointments.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);


    @Query("SELECT u FROM User u WHERE u.role.name = 'usuario'")
    List<User> findAllRegularUsers();


    @Query("SELECT u FROM User u WHERE u.role.name = 'admin'")
    List<User> findAllAdmins();


    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);


    @Query("SELECT COUNT(u) > 0 FROM User u WHERE " +
           "LOWER(u.email) = LOWER(:email) AND u.id != :userId")
    boolean existsByEmailAndNotUserId(
        @Param("email") String email,
        @Param("userId") Long userId
    );


    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.appointments a " +
           "WHERE a.deleted = false " +
           "AND a.date >= CURRENT_DATE " +
           "AND a.date <= :endDate")
    List<User> findUsersWithUpcomingAppointments(@Param("endDate") java.time.LocalDate endDate);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);
}