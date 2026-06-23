/**
 * SearchBar-Komponente
 *
 * Zeigt ein Texteingabefeld mit einem Such-Button.
 * Bei leerem Feld wird `onReset` aufgerufen, um alle Spiele wieder anzuzeigen.
 */
import React, { useState } from 'react';
import './SearchBar.css';

interface Props {
  onSearch: (title: string) => void;
  onReset: () => void;
}

const SearchBar: React.FC<Props> = ({ onSearch, onReset }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    } else {
      onReset();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (e.target.value === '') {
      onReset();
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__input-wrapper">
        <svg className="search-bar__icon" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search games..."
          value={value}
          onChange={handleChange}
          className="search-bar__input"
        />
      </div>
      <button type="submit" className="search-bar__button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        Search
      </button>
    </form>
  );
};

export default SearchBar;
