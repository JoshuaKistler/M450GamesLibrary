package ch.diethelm.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

/**
 * REST-Controller, der als Proxy zur Steam Store API dient.
 *
 * <p>Leitet Anfragen an die offizielle Steam-API weiter und gibt die
 * JSON-Antwort unverändert an das Frontend zurück. Dadurch umgeht das
 * Frontend CORS-Einschränkungen beim direkten Zugriff auf externe APIs.</p>
 *
 * <ul>
 *   <li>{@code GET /api/steam/search?term=…}   – Spiele nach Name suchen</li>
 *   <li>{@code GET /api/steam/game/{appId}}     – Spieldetails per Steam-AppID abrufen</li>
 * </ul>
 *
 * <p>Die globale {@link ch.diethelm.backend.config.CorsConfig} erlaubt bereits
 * alle {@code /api/**}-Endpunkte für das React-Frontend – eine zusätzliche
 * {@code @CrossOrigin}-Annotation ist daher nicht notwendig.</p>
 */
@RestController
@RequestMapping("/api/steam")
public class SteamController {

    private final RestClient restClient = RestClient.create();

    /**
     * Sucht Spiele auf Steam anhand eines Namens.
     *
     * @param term Suchbegriff (z. B. "Witcher")
     * @return JSON-Antwort der Steam-Suchfunktion mit einer Liste von Treffern
     */
    @GetMapping("/search")
    public ResponseEntity<String> searchGames(@RequestParam String term) {
        try {
            String response = restClient.get()
                    .uri("https://store.steampowered.com/api/storesearch/",
                            uriBuilder -> uriBuilder
                                    .queryParam("term", term)
                                    .queryParam("l", "english")
                                    .queryParam("cc", "US")
                                    .build())
                    .retrieve()
                    .body(String.class);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Fehler bei der Steam-Suche\"}");
        }
    }

    /**
     * Ruft Spieldetails von der Steam Store API ab.
     *
     * @param appId Steam-AppID des Spiels (z. B. "570" für Dota 2)
     * @return JSON-Antwort der Steam-API oder eine Fehlermeldung
     */
    @GetMapping("/game/{appId}")
    public ResponseEntity<String> getGameDetails(@PathVariable String appId) {
        try {
            String response = restClient.get()
                    .uri("https://store.steampowered.com/api/appdetails",
                            uriBuilder -> uriBuilder
                                    .queryParam("appids", appId)
                                    .build())
                    .retrieve()
                    .body(String.class);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Fehler beim Abrufen der Steam-Daten\"}");
        }
    }
}

