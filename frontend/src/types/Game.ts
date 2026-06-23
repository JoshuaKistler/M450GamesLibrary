/**
 * TypeScript-Interface für ein Spiel.
 * Spiegelt das Java-Modell `Game` des Backends exakt wider.
 */
export interface Game {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  releaseDate: string; // Format: YYYY-MM-DD
}

