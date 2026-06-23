package ch.diethelm.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Einstiegspunkt der Spring-Boot-Anwendung.
 *
 * <p>Diese Klasse enthält die {@code main}-Methode und startet den eingebetteten
 * Webserver (standardmässig Tomcat). Durch {@link org.springframework.boot.autoconfigure.SpringBootApplication}
 * werden automatisch alle Komponenten im Paket {@code ch.diethelm.backend} erkannt
 * und im Spring-ApplicationContext registriert (Component Scan, Auto-Configuration,
 * JPA-Setup usw.).</p>
 */
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
