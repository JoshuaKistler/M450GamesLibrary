/// <reference types="cypress" />

/**
 * E2E-Tests: Spieleliste anzeigen
 *
 * Prüft, dass die Startseite lädt, die Spiele des Backends
 * angezeigt werden und der Grundaufbau der Seite stimmt.
 */
describe('Spieleliste anzeigen', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it('zeigt den Header mit Titel und Tagline an', () => {
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
    cy.get('.home-page__tagline').should('contain.text', 'Your Personal Gaming Universe');
  });

  it('zeigt geladene Spiele als Karten an', () => {
    cy.get('.game-list').should('exist');
    cy.get('.game-card').its('length').should('be.greaterThan', 0);
  });

  it('zeigt die korrekte Anzahl Spiele in der Statistik an', () => {
    cy.get('.game-card').then(($cards) => {
      cy.get('.home-page__stat-value').first().should('contain.text', String($cards.length));
    });
  });

  it('zeigt für jede Spielkarte Titel, Datum und Aktionen an', () => {
    cy.get('.game-card').first().within(() => {
      cy.get('.game-card__title').should('not.be.empty');
      cy.get('.game-card__badge').should('exist');
      cy.get('.game-card__btn--edit').should('contain.text', 'Edit');
      cy.get('.game-card__btn--delete').should('contain.text', 'Delete');
    });
  });
});
