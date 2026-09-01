package ch.diethelm.backend.service;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameService gameService;

    private Game createSampleGame(Long id, String title) {
        return Game.builder()
                .id(id)
                .title(title)
                .description("Beschreibung von " + title)
                .imageUrl("https://example.com/" + id + ".png")
                .releaseDate(LocalDate.of(2020, 1, 15))
                .build();
    }

    @Test
    @DisplayName("getAllGames() gibt die Liste zurück, die das Repository liefert")
    void getAllGames_returnsListFromRepository() {
        List<Game> expected = List.of(createSampleGame(1L, "Zelda"), createSampleGame(2L, "Mario"));
        when(gameRepository.findAll()).thenReturn(expected);

        List<Game> result = gameService.getAllGames();

        assertEquals(expected, result);
        assertEquals(2, result.size());
        verify(gameRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("getGameById() gibt das Spiel zurück, wenn es existiert")
    void getGameById_returnsGame_whenFound() {
        Game expected = createSampleGame(1L, "Zelda");
        when(gameRepository.findById(1L)).thenReturn(Optional.of(expected));

        Game result = gameService.getGameById(1L);

        assertSame(expected, result);
        assertEquals("Zelda", result.getTitle());
        verify(gameRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("getGameById() wirft NoSuchElementException, wenn die ID nicht existiert")
    void getGameById_throwsException_whenNotFound() {
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        NoSuchElementException exception =
                assertThrows(NoSuchElementException.class, () -> gameService.getGameById(99L));

        assertEquals("Spiel mit ID 99 nicht gefunden", exception.getMessage());
        verify(gameRepository, times(1)).findById(99L);
    }

    @Test
    @DisplayName("createGame() ruft repository.save() auf und gibt das gespeicherte Spiel zurück")
    void createGame_savesAndReturnsGame() {
        Game toCreate = createSampleGame(null, "Neues Spiel");
        Game saved = createSampleGame(5L, "Neues Spiel");
        when(gameRepository.save(toCreate)).thenReturn(saved);

        Game result = gameService.createGame(toCreate);

        assertSame(saved, result);
        assertEquals(5L, result.getId());
        verify(gameRepository, times(1)).save(toCreate);
    }

    @Test
    @DisplayName("updateGame() überschreibt alle Felder des bestehenden Spiels")
    void updateGame_overwritesAllFields() {
        Game existing = createSampleGame(1L, "Alter Titel");
        Game updated = Game.builder()
                .title("Neuer Titel")
                .description("Neue Beschreibung")
                .imageUrl("https://example.com/neu.png")
                .releaseDate(LocalDate.of(2023, 12, 24))
                .build();

        when(gameRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(gameRepository.save(any(Game.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Game result = gameService.updateGame(1L, updated);

        assertEquals(1L, result.getId());
        assertEquals("Neuer Titel", result.getTitle());
        assertEquals("Neue Beschreibung", result.getDescription());
        assertEquals("https://example.com/neu.png", result.getImageUrl());
        assertEquals(LocalDate.of(2023, 12, 24), result.getReleaseDate());
        verify(gameRepository, times(1)).findById(1L);
        verify(gameRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("updateGame() wirft NoSuchElementException, wenn die ID nicht existiert")
    void updateGame_throwsException_whenNotFound() {
        Game updated = createSampleGame(null, "Neuer Titel");
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        NoSuchElementException exception =
                assertThrows(NoSuchElementException.class, () -> gameService.updateGame(99L, updated));

        assertEquals("Spiel mit ID 99 nicht gefunden", exception.getMessage());
        verify(gameRepository, times(1)).findById(99L);
        verify(gameRepository, never()).save(any(Game.class));
    }

    @Test
    @DisplayName("deleteGame() löscht das Spiel, wenn es existiert")
    void deleteGame_deletesGame_whenExists() {
        when(gameRepository.existsById(1L)).thenReturn(true);

        gameService.deleteGame(1L);

        verify(gameRepository, times(1)).existsById(1L);
        verify(gameRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("deleteGame() wirft NoSuchElementException, wenn die ID nicht existiert")
    void deleteGame_throwsException_whenNotFound() {
        when(gameRepository.existsById(99L)).thenReturn(false);

        NoSuchElementException exception =
                assertThrows(NoSuchElementException.class, () -> gameService.deleteGame(99L));

        assertEquals("Spiel mit ID 99 nicht gefunden", exception.getMessage());
        verify(gameRepository, times(1)).existsById(99L);
        verify(gameRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("searchByTitle() delegiert an repository.findByTitleContainingIgnoreCase()")
    void searchByTitle_delegatesToRepository() {
        List<Game> expected = List.of(createSampleGame(1L, "Zelda"));
        when(gameRepository.findByTitleContainingIgnoreCase("zel")).thenReturn(expected);

        List<Game> result = gameService.searchByTitle("zel");

        assertEquals(expected, result);
        assertEquals(1, result.size());
        assertEquals("Zelda", result.get(0).getTitle());
        verify(gameRepository, times(1)).findByTitleContainingIgnoreCase("zel");
    }
}
