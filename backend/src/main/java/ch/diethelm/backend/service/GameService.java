package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service-Klasse für die Geschäftslogik der Spieleverwaltung.
 *
 * <p>Kapselt alle fachlichen Operationen rund um {@link ch.diethelm.backend.model.Game}-Objekte
 * und kommuniziert ausschliesslich über das {@link ch.diethelm.backend.repository.GameRepository}
 * mit der Datenbank. Wird vom {@link ch.diethelm.backend.controller.GameController} aufgerufen.</p>
 *
 * <p>Enthaltene Operationen:</p>
 * <ul>
 *   <li>{@link #getAllGames()}                     – gibt alle gespeicherten Spiele zurück</li>
 *   <li>{@link #getGameById(Long)}                 – sucht ein Spiel anhand seiner ID;
 *       wirft {@link java.util.NoSuchElementException} wenn nicht gefunden</li>
 *   <li>{@link #searchByTitle(String)}             – Volltextsuche im Titel (case-insensitive)</li>
 *   <li>{@link #createGame(Game)}                  – legt ein neues Spiel in der Datenbank an</li>
 *   <li>{@link #updateGame(Long, Game)}             – überschreibt alle Felder eines bestehenden Spiels</li>
 *   <li>{@link #deleteGame(Long)}                  – löscht ein Spiel; wirft Exception wenn nicht vorhanden</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;

    public List<Game> getAllGames() {
        return gameRepository.findAll();
    }

    public Game getGameById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Spiel mit ID " + id + " nicht gefunden"));
    }

    public List<Game> searchByTitle(String title) {
        return gameRepository.findByTitleContainingIgnoreCase(title);
    }

    public Game createGame(Game game) {
        return gameRepository.save(game);
    }

    public Game updateGame(Long id, Game updatedGame) {
        Game existing = getGameById(id);
        existing.setTitle(updatedGame.getTitle());
        existing.setDescription(updatedGame.getDescription());
        existing.setImageUrl(updatedGame.getImageUrl());
        existing.setReleaseDate(updatedGame.getReleaseDate());
        return gameRepository.save(existing);
    }

    public void deleteGame(Long id) {
        if (!gameRepository.existsById(id)) {
            throw new NoSuchElementException("Spiel mit ID " + id + " nicht gefunden");
        }
        gameRepository.deleteById(id);
    }
}
