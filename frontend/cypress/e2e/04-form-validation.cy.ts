/// <reference types="cypress" />

/**
 * E2E-Tests: Formularvalidierung
 *
 * Prüft die clientseitige Validierung im GameForm:
 * Pflichtfelder (Titel, Release-Datum) und die Regel,
 * dass das Release-Datum nicht in der Zukunft liegen darf.
 */
describe('Formularvalidierung beim Hinzufügen', () => {
  beforeEach(() => {
    cy.visitApp();
    cy.openAddGameForm();
  });

  afterEach(() => {
    // Formular schliessen, falls ein Test es offen lässt
    cy.get('body').then(($body) => {
      if ($body.find('.game-form__close').length) {
        cy.get('.game-form__close').click();
      }
    });
  });

  it('zeigt einen Fehler, wenn der Titel fehlt', () => {
    cy.fillGameForm({ releaseDate: '2020-01-01' });
    cy.get('.game-form').submit();
    cy.get('.game-form__label').first().find('.game-form__error').should('contain.text', 'Title is required.');
  });

  it('zeigt einen Fehler, wenn das Release-Datum fehlt', () => {
    cy.fillGameForm({ title: 'Testspiel ohne Datum' });
    cy.get('.game-form').submit();
    cy.contains('.game-form__error', 'Release date is required.').should('be.visible');
  });

  it('zeigt einen Fehler, wenn das Release-Datum in der Zukunft liegt', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    cy.fillGameForm({ title: 'Testspiel Zukunft' });
    cy.get('.game-form input[name="releaseDate"]').clear().type(futureDateStr);
    cy.get('.game-form').submit();
    cy.contains('.game-form__error', 'Date cannot be in the future.').should('be.visible');
  });

  it('schliesst das Formular per Cancel-Button ohne zu speichern', () => {
    cy.fillGameForm({ title: 'Wird abgebrochen', releaseDate: '2020-01-01' });
    cy.get('.game-form__btn--cancel').click();
    cy.get('.game-form').should('not.exist');
    cy.contains('.game-card__title', 'Wird abgebrochen').should('not.exist');
  });

  it('schliesst das Formular per X-Button ohne zu speichern', () => {
    cy.get('.game-form__close').click();
    cy.get('.game-form').should('not.exist');
  });
});
