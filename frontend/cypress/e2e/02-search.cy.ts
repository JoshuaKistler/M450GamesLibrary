/// <reference types="cypress" />

/**
 * E2E-Tests: Suche
 *
 * Prüft die Titelsuche über die SearchBar sowie das Zurücksetzen
 * der Suche (Anzeige aller Spiele) bei leerem Suchfeld.
 */
describe('Spiele suchen', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('filtert die Liste nach einem Suchbegriff', () => {
    cy.get('.game-card__title').first().invoke('text').then((firstTitle) => {
      // Ein eindeutiges Teilwort aus dem ersten Titel für die Suche verwenden
      const searchTerm = firstTitle.trim().split(' ')[0];

      cy.intercept('GET', '/api/games/search*').as('search');
      cy.get('.search-bar__input').type(searchTerm);
      cy.get('.search-bar__button').click();
      cy.wait('@search');

      cy.get('.game-card__title').each(($el) => {
        expect($el.text().toLowerCase()).to.include(searchTerm.toLowerCase());
      });
    });
  });

  it('zeigt "No Games Found" bei einem nicht existierenden Suchbegriff', () => {
    cy.intercept('GET', '/api/games/search*').as('search');
    cy.get('.search-bar__input').type('EinSpielDasEsGarantiertNichtGibt12345');
    cy.get('.search-bar__button').click();
    cy.wait('@search');

    cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
  });

  it('setzt die Suche zurück und zeigt wieder alle Spiele, wenn das Feld geleert wird', () => {
    cy.get('.game-card').its('length').then((totalCount) => {
      cy.intercept('GET', '/api/games/search*').as('search');
      cy.get('.search-bar__input').type('EinSpielDasEsGarantiertNichtGibt12345');
      cy.get('.search-bar__button').click();
      cy.wait('@search');
      cy.get('.game-list__status-title').should('contain.text', 'No Games Found');

      cy.intercept('GET', '/api/games').as('getAll');
      cy.get('.search-bar__input').clear();
      cy.wait('@getAll');

      cy.get('.game-card').should('have.length', totalCount);
    });
  });
});
