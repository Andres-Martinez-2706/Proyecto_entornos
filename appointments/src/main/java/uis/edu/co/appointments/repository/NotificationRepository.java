package uis.edu.co.appointments.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.edu.co.appointments.models.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
