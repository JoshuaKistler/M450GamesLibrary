/**
 * GameList-Komponente
 *
 * Rendert eine responsive Rasteransicht aller übergebenen Spiele.
 * Zeigt Lade- und Leer-Zustände an.
 */
import React from 'react';
import { Game } from '../../types/Game';
import GameCard from '../GameCard/GameCard';
import './GameList.css';

interface Props {
  games: Game[];
  loading: boolean;
  onEdit: (game: Game) => void;
  onDelete: (id: number) => void;
}

const GameList: React.FC<Props> = ({ games, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="game-list__status">
        <div className="game-list__spinner" />
        <span className="game-list__status-title">Loading Library...</span>
        <span className="game-list__status-sub">Fetching your games from the server</span>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="game-list__status">
        <div className="game-list__status-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8m-4-4v4"/>
            <path d="M9 9h.01M15 9h.01M12 12v.01"/>
          </svg>
        </div>
        <span className="game-list__status-title">No Games Found</span>
        <span className="game-list__status-sub">
          Your library is empty. Add your first game to get started!
        </span>
      </div>
    );
  }

  return (
    <div className="game-list">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default GameList;
