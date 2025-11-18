package uis.edu.co.appointments.security;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers("/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                
                // === APPOINTMENTS - ORDEN ESPECÍFICO A GENERAL ===
                .requestMatchers(HttpMethod.POST, "/api/appointments/*/complete").hasAuthority("OPERARIO")
                .requestMatchers(HttpMethod.POST, "/api/appointments/*/cancel").hasAnyAuthority("OPERARIO", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/appointments/*/rate-operator").hasAuthority("USUARIO")
                .requestMatchers(HttpMethod.GET, "/api/appointments/operator-stats/**").hasAnyAuthority("OPERARIO", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/appointments/user-stats/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/appointments/pending-completion").hasAuthority("OPERARIO")
                .requestMatchers(HttpMethod.GET, "/api/appointments/available-operators").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/appointments/operator/**").hasAnyAuthority("OPERARIO", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/appointments/search").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/appointments/dashboard/stats").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/appointments/upcoming").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/appointments").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/appointments/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/appointments/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/appointments/**").authenticated()
                
                .requestMatchers(HttpMethod.GET, "/api/operator-schedules/operator/**").hasAnyAuthority("OPERARIO", "ADMIN")
                .requestMatchers("/api/operator-schedules/**").hasAuthority("OPERARIO")
                
                // Gestión de categorías - crear/editar solo admin, leer todos
                .requestMatchers(HttpMethod.GET, "/api/categories/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAuthority("ADMIN")
                
                // Gestión de usuarios - endpoints de admin
                .requestMatchers("/api/users/stats/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/users/*/categories").hasAnyAuthority("ADMIN", "OPERARIO")
                .requestMatchers(HttpMethod.PATCH, "/api/users/*/active-status").hasAuthority("ADMIN")
                
                // Listar operarios - todos los autenticados pueden ver
                .requestMatchers(HttpMethod.GET, "/api/users/operators/**").authenticated()
                
                // Notificaciones - accesibles para todos los autenticados
                .requestMatchers(HttpMethod.GET, "/api/notifications/me/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/notifications/me/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/notifications/*/read").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/notifications/**").authenticated()
                
                // Resto de endpoints - requieren autenticación
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    @SuppressWarnings("unused")
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5500",  // Live Server (VSCode)
            "http://127.0.0.1:5500",  // Alternativa local
            "http://localhost:5173",   // Si llegas a usar Vite o similar
            "null"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
