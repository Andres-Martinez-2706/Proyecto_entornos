package uis.edu.co.appointments.service;

import java.util.Map;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String from;


    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    /**
     * Enviar email simple (texto plano) - DEPRECADO, usar sendHtmlEmail
     */
    @Deprecated
    public void sendEmail(String to, String subject, String text) {
        if (to == null || to.isBlank()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            if (from != null && !from.isBlank()) helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, false);
            
            mailSender.send(message);
            logger.info("Email enviado exitosamente a: {}", to);
        } catch (MailException | MessagingException e) {
            logger.error("Error al enviar email a {}: {}", to, e.getMessage());
            throw new RuntimeException("Error al enviar email: " + e.getMessage(), e);
        }
    }

    /**
     * Enviar email con plantilla HTML
     */
    /**
     * Enviar email con plantilla HTML
     */
    public void sendHtmlEmail(String to, String subject, Map<String, Object> templateVariables) {
        sendHtmlEmail(to, subject, "appointment-notification", templateVariables);
    }
    
    /**
     * Enviar email con plantilla HTML específica
     */
    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> templateVariables) {
        if (to == null || to.isBlank()) return;

        try {
            // Procesar plantilla con Thymeleaf
            Context context = new Context();
            context.setVariables(templateVariables);
            String htmlContent = templateEngine.process(templateName, context);

            // Crear mensaje
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            if (from != null && !from.isBlank()) helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = es HTML
            
            mailSender.send(message);
            logger.info("Email HTML enviado exitosamente a: {}", to);
        } catch (MailException | MessagingException e) {
            logger.error("Error al enviar email HTML a {}: {}", to, e.getMessage());
            throw new RuntimeException("Error al enviar email: " + e.getMessage(), e);
        }
    }

    /**
     * Método helper para crear emails de citas con la plantilla
     */
   /**
     * Método helper para crear emails de citas con la plantilla
     */
    /**
     * Método helper con nombre de operario
     */
    public void sendAppointmentEmail(
            String to,
            String subject,
            String userName,
            String appointmentTitle,
            String date,
            String time,
            String mainMessage,
            String observation,
            String operatorName,
            String emailType
    ) {
        Map<String, Object> variables = new java.util.HashMap<>();
        variables.put("nombre", userName);
        variables.put("titulo", subject);
        variables.put("tituloEmoji", getEmojiForType(emailType));
        variables.put("headerColor", getColorForType(emailType));
        variables.put("mensajePrincipal", mainMessage);
        variables.put("tituloCita", appointmentTitle);
        variables.put("fecha", date);
        variables.put("hora", time);
        variables.put("observacion", observation != null ? observation : "");
        variables.put("operatorName", operatorName != null ? operatorName : "");

        sendHtmlEmail(to, subject, "appointment-notification", variables);
    }

    /**
     * Enviar email de asignación de operario
     */
    public void sendOperatorAssignmentEmail(
            String operatorEmail,
            String operatorName,
            String appointmentTitle,
            String userName,
            String date,
            String time,
            String category,
            String description
    ) {
        Map<String, Object> variables = new java.util.HashMap<>();
        variables.put("operatorName", operatorName);
        variables.put("appointmentTitle", appointmentTitle);
        variables.put("userName", userName);
        variables.put("date", date);
        variables.put("time", time);
        variables.put("category", category != null ? category : "");
        variables.put("description", description != null ? description : "");

        sendHtmlEmail(operatorEmail, "Nueva cita asignada", "operator-assignment", variables);
    }

    /**
     * Enviar recordatorio de completar citas
     */
    public void sendCompletionReminderEmail(
            String operatorEmail,
            String operatorName,
            List<Map<String, String>> pendingAppointments
    ) {
        Map<String, Object> variables = new java.util.HashMap<>();
        variables.put("operatorName", operatorName);
        variables.put("pendingCount", pendingAppointments.size());
        variables.put("appointments", pendingAppointments);

        sendHtmlEmail(
            operatorEmail, 
            "Recordatorio: Citas pendientes de completar", 
            "completion-reminder", 
            variables
        );
    }

    /**
     * Enviar notificación de calificación recibida
     */
    public void sendRatingReceivedEmail(
            String operatorEmail,
            String operatorName,
            int rating,
            String appointmentTitle,
            String date,
            String userName,
            String observation
    ) {
        Map<String, Object> variables = new java.util.HashMap<>();
        variables.put("operatorName", operatorName);
        variables.put("rating", rating);
        variables.put("appointmentTitle", appointmentTitle);
        variables.put("date", date);
        variables.put("userName", userName);
        variables.put("observation", observation != null ? observation : "");

        sendHtmlEmail(
            operatorEmail, 
            "Has recibido una calificación", 
            "rating-received", 
            variables
        );
    }

    /**
     * Obtener emoji según el tipo de notificación
     */
    private String getEmojiForType(String type) {
        return switch (type) {
            case "created" -> "📅";
            case "modified" -> "✏️";
            case "cancelled" -> "❌";
            case "reminder" -> "⏰";
            default -> "📧";
        };
    }

    /**
     * Obtener color según el tipo de notificación
     */
    private String getColorForType(String type) {
        return switch (type) {
            case "created" -> "#10b981"; // Verde
            case "modified" -> "#f59e0b"; // Naranja
            case "cancelled" -> "#ef4444"; // Rojo
            case "reminder" -> "#3b82f6"; // Azul
            default -> "#6366f1"; // Índigo
        };
    }
}