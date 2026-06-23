package ch.diethelm.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Globale CORS-Konfiguration für die gesamte Anwendung.
 *
 * <p>Erlaubt dem React-Frontend (standardmässig auf Port 3000) den Zugriff
 * auf alle REST-Endpunkte des Backends. Ohne diese Konfiguration würde der
 * Browser Same-Origin-Policy-Fehler beim Aufruf der API ausgeben.</p>
 *
 * <p>Erlaubte Einstellungen:</p>
 * <ul>
 *   <li>Origin:  {@code http://localhost:3000} (React Dev-Server)</li>
 *   <li>Methoden: GET, POST, PUT, DELETE, OPTIONS</li>
 *   <li>Headers: alle</li>
 *   <li>Credentials: erlaubt</li>
 * </ul>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}

