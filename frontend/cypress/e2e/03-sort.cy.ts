/// <reference types="cypress" />

/**
 * E2E-Tests: Sortierung nach Release-Datum
 *
 * Prüft das Umschalten des Sortier-Buttons durch die drei Zustände:
 * unsortiert -> neueste zuerst (desc) -> älteste zuerst (asc) -> unsortiert.
 */
describe('Spiele nach Datum sortieren', () => {
  beforeEach(() => {
    cy.visitApp();
  });

  const readDatesFromCards = (): Cypress.Chainable<number[]> =>
    cy.get('.game-card__badge').then(($badges) => {
      return Cypress._.map($badges.toArray(), (el) => {
        const text = el.textContent?.trim() ?? '';
        // Format ist de-CH, z.B. "18.05.2015" -> in Date parsbares Format umwandeln
        const [day, month, year] = text.split('.').map((s) => s.trim());
        return new Date(`${year}-${month}-${day}`).getTime();
      });
    });

  it('sortiert absteigend (neueste zuerst) nach dem ersten Klick', () => {
    cy.get('.home-page__sort-btn').click();
    cy.get('.home-page__sort-btn').should('have.class', 'home-page__sort-btn--active');
    cy.get('.home-page__sort-label').should('contain.text', 'Newest');

    readDatesFromCards().then((dates) => {
      const sorted = [...dates].sort((a, b) => b - a);
      expect(dates).to.deep.equal(sorted);
    });
  });

  it('sortiert aufsteigend (älteste zuerst) nach dem zweiten Klick', () => {
    cy.get('.home-page__sort-btn').click();
    cy.get('.home-page__sort-btn').click();
    cy.get('.home-page__sort-label').should('contain.text', 'Oldest');

    readDatesFromCards().then((dates) => {
      const sorted = [...dates].sort((a, b) => a - b);
      expect(dates).to.deep.equal(sorted);
    });
  });

  it('hebt die Sortierung nach dem dritten Klick wieder auf', () => {
    cy.get('.home-page__sort-btn').click();
    cy.get('.home-page__sort-btn').click();
    cy.get('.home-page__sort-btn').click();

    cy.get('.home-page__sort-btn').should('not.have.class', 'home-page__sort-btn--active');
    cy.get('.home-page__sort-label').should('contain.text', 'Date');
  });
});
