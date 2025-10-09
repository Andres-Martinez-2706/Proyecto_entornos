package uis.edu.co.appointments.service;

import java.util.Map;

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
    public void sendHtmlEmail(String to, String subject, Map<String, Object> templateVariables) {
        if (to == null || to.isBlank()) return;

        try {
            // Procesar plantilla con Thymeleaf
            Context context = new Context();
            context.setVariables(templateVariables);
            String htmlContent = templateEngine.process("appointment-notification", context);

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
    public void sendAppointmentEmail(
            String to,
            String subject,
            String userName,
            String appointmentTitle,
            String date,
            String time,
            String mainMessage,
            String observation,
            String emailType // "created", "modified", "cancelled", "reminder"
    ) {
        Map<String, Object> variables = Map.of(
            "nombre", userName,
            "titulo", subject,
            "tituloEmoji", getEmojiForType(emailType),
            "headerColor", getColorForType(emailType),
            "mensajePrincipal", mainMessage,
            "tituloCita", appointmentTitle,
            "fecha", date,
            "hora", time,
            "observacion", observation != null ? observation : "Sin observaciones"

        );

        sendHtmlEmail(to, subject, variables);
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