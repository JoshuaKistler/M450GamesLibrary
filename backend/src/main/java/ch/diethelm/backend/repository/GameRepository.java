package ch.diethelm.backend.repository;

import ch.diethelm.backend.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository-Interface für den Datenbankzugriff auf {@link ch.diethelm.backend.model.Game}-Objekte.
 *
 * <p>Erweitert {@link org.springframework.data.jpa.repository.JpaRepository} und erbt dadurch
 * alle Standard-CRUD-Methoden (z. B. {@code findAll()}, {@code findById()}, {@code save()},
 * {@code deleteById()}) ohne eigene Implementierung.</p>
 *
 * <p>Zusätzlich definierte Methoden:</p>
 * <ul>
 *   <li>{@link #findByTitleContainingIgnoreCase(String)} – durchsucht alle Spiele nach einem
 *       Teilstring im Titel, unabhängig von Gross-/Kleinschreibung.
 *       Spring Data JPA leitet die SQL-Abfrage automatisch aus dem Methodennamen ab.</li>
 * </ul>
 */
@Repository

public interface GameRepository extends JpaRepository<Game, Long> {

    // Suche nach Titeln, die den Suchbegriff enthalten (case-insensitive)
    List<Game> findByTitleContainingIgnoreCase(String title);

}
