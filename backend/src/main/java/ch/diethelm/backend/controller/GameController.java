package ch.diethelm.backend.controller;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST-Controller für die Spieleverwaltung.
 *
 * <p>Stellt alle HTTP-Endpunkte unter dem Basispfad {@code /api/games} bereit.
 * Unterstützt die vollständigen CRUD-Operationen (Create, Read, Update, Delete)
 * sowie eine Titelsuche. Alle Anfragen werden an den {@link ch.diethelm.backend.service.GameService}
 * delegiert, der die eigentliche Geschäftslogik enthält.</p>
 *
 * <ul>
 *   <li>{@code GET    /api/games}           – alle Spiele abrufen</li>
 *   <li>{@code GET    /api/games/{id}}       – einzelnes Spiel per ID abrufen</li>
 *   <li>{@code GET    /api/games/search}     – Spiele nach Titel suchen</li>
 *   <li>{@code POST   /api/games}           – neues Spiel anlegen</li>
 *   <li>{@code PUT    /api/games/{id}}       – bestehendes Spiel aktualisieren</li>
 *   <li>{@code DELETE /api/games/{id}}       – Spiel löschen</li>
 * </ul>
 *
 * <p>Eingehende Anfrage-Bodies werden mit {@code @Valid} automatisch validiert.
 * Fehler werden zentral vom {@link ch.diethelm.backend.config.GlobalExceptionHandler} behandelt.</p>
 */
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    // GET /api/games
    @GetMapping
    public ResponseEntity<List<Game>> getAllGames() {
        return ResponseEntity.ok(gameService.getAllGames());
    }

    // GET /api/games/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Game> getGameById(@PathVariable Long id) {
        return ResponseEntity.ok(gameService.getGameById(id));
    }

    // GET /api/games/search?title=...
    @GetMapping("/search")
    public ResponseEntity<List<Game>> searchByTitle(@RequestParam String title) {
        return ResponseEntity.ok(gameService.searchByTitle(title));
    }

    // POST /api/games
    @PostMapping
    public ResponseEntity<Game> createGame(@Valid @RequestBody Game game) {
        Game created = gameService.createGame(game);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/games/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Game> updateGame(@PathVariable Long id,
                                           @Valid @RequestBody Game game) {
        return ResponseEntity.ok(gameService.updateGame(id, game));
    }

    // DELETE /api/games/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        gameService.deleteGame(id);
        return ResponseEntity.noContent().build();
    }
}
