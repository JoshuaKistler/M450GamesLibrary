/**
 * API-Schicht für Aufrufe an den Steam-Proxy des Backends.
 *
 * Alle Anfragen gehen an `/api/steam`. Der React Dev-Server
 * leitet sie dank des Proxy-Eintrags in `package.json` automatisch
 * an `http://localhost:8080` weiter.
 */
import axios from 'axios';

const STEAM_BASE_URL = '/api/steam';

/** Ein einzelnes Suchergebnis aus der Steam-Suche */
export interface SteamSearchItem {
  id: number;
  name: string;
  tiny_image: string;
}

/** Steam-Antwortstruktur für ein einzelnes Spiel (appdetails) */
export interface SteamGameData {
  name?: string;
  short_description?: string;
  header_image?: string;
  release_date?: {
    coming_soon: boolean;
    date: string; // z. B. "23 Jun, 2014"
  };
}

/**
 * Sucht Steam-Spiele anhand eines Namens.
 *
 * @param term Suchbegriff (z. B. "Witcher")
 * @returns Liste von Treffern (max. 25 Ergebnisse von Steam)
 */
export const searchSteamGames = async (term: string): Promise<SteamSearchItem[]> => {
  const response = await axios.get<{ total: number; items: SteamSearchItem[] }>(
    `${STEAM_BASE_URL}/search`,
    { params: { term } }
  );
  return response.data.items ?? [];
};

/**
 * Spieldetails von der Steam API über den Backend-Proxy abrufen.
 *
 * @param appId Steam-AppID (z. B. "570")
 * @returns Spieldetails oder null wenn nicht gefunden / Fehler
 */
export const getSteamGameDetails = async (appId: string): Promise<SteamGameData | null> => {
  const response = await axios.get<Record<string, { success: boolean; data: SteamGameData }>>(
    `${STEAM_BASE_URL}/game/${appId}`
  );
  const entry = response.data[appId];
  if (entry?.success) {
    return entry.data;
  }
  return null;
};
