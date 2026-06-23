package ch.diethelm.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entitätsklasse, die ein Spiel in der Datenbank repräsentiert.
 *
 * <p>Wird als JPA-Entity in der Tabelle {@code games} gespeichert.
 * Lombok-Annotationen generieren automatisch Getter, Setter, Konstruktoren
 * und einen Builder, sodass kein Boilerplate-Code notwendig ist.</p>
 *
 * <p>Felder:</p>
 * <ul>
 *   <li>{@code id}          – auto-generierter Primärschlüssel</li>
 *   <li>{@code title}       – Pflichtfeld; darf nicht leer sein</li>
 *   <li>{@code description} – optionale Beschreibung des Spiels</li>
 *   <li>{@code imageUrl}    – optionale URL zu einem Vorschaubild</li>
 *   <li>{@code releaseDate} – Pflichtfeld; Datum darf nicht in der Zukunft liegen</li>
 * </ul>
 *
 * <p>Validierungsregeln werden über Jakarta-Validation-Annotationen definiert
 * und beim Erstellen / Aktualisieren über {@code @Valid} im Controller geprüft.</p>
 */
@Entity
@Table(name = "games")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Titel darf nicht leer sein")
    @Column(nullable = false)
    private String title;

    private String description;

    private String imageUrl;

    @NotNull(message = "Erscheinungsdatum darf nicht leer sein")
    @PastOrPresent(message = "Erscheinungsdatum darf nicht in der Zukunft liegen")
    @Column(nullable = false)
    private LocalDate releaseDate;
}
