package uis.edu.co.appointments.dto;

/**
 * DTO genérico para respuestas de la API
 * Proporciona un formato estándar para todas las respuestas HTTP
 */
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
    
    /**
     * Constructor completo
     */
    public ApiResponse(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
    
    /**
     * Constructor sin data
     */
    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.data = null;
    }
    
    /**
     * Método estático para crear respuesta exitosa sin data
     */
    public static ApiResponse success(String message) {
        return new ApiResponse(true, message, null);
    }
    
    /**
     * Método estático para crear respuesta exitosa con data
     */
    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(true, message, data);
    }
    
    /**
     * Método estático para crear respuesta de error
     */
    public static ApiResponse error(String message) {
        return new ApiResponse(false, message, null);
    }
    
    /**
     * Método estático para crear respuesta de error con data adicional
     */
    public static ApiResponse error(String message, Object data) {
        return new ApiResponse(false, message, data);
    }
    
    // ==================== GETTERS Y SETTERS ====================
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Object getData() {
        return data;
    }
    
    public void setData(Object data) {
        this.data = data;
    }
    
    @Override
    public String toString() {
        return "ApiResponse{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", data=" + data +
                '}';
    }
}