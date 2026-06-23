/**
 * API-Schicht für alle HTTP-Aufrufe an das Spring-Boot-Backend.
 *
 * Alle Anfragen gehen an `/api/games`. Der React Dev-Server
 * leitet sie dank des Proxy-Eintrags in `package.json` automatisch
 * an `http://localhost:8080` weiter.
 */
import axios from 'axios';
import { Game } from '../types/Game';

const BASE_URL = '/api/games';

/** Alle Spiele abrufen */
export const getAllGames = (): Promise<Game[]> =>
  axios.get<Game[]>(BASE_URL).then((res) => res.data);

/** Ein einzelnes Spiel per ID abrufen */
export const getGameById = (id: number): Promise<Game> =>
  axios.get<Game>(`${BASE_URL}/${id}`).then((res) => res.data);

/** Spiele nach Titel suchen */
export const searchGames = (title: string): Promise<Game[]> =>
  axios.get<Game[]>(`${BASE_URL}/search`, { params: { title } }).then((res) => res.data);

/** Neues Spiel anlegen */
export const createGame = (game: Game): Promise<Game> =>
  axios.post<Game>(BASE_URL, game).then((res) => res.data);

/** Bestehendes Spiel aktualisieren */
export const updateGame = (id: number, game: Game): Promise<Game> =>
  axios.put<Game>(`${BASE_URL}/${id}`, game).then((res) => res.data);

/** Spiel löschen */
export const deleteGame = (id: number): Promise<void> =>
  axios.delete(`${BASE_URL}/${id}`).then(() => undefined);

