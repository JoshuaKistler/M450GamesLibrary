/// <reference types="cypress" />

/**
 * E2E-Tests: CRUD-Workflow (Erstellen, Bearbeiten, Löschen)
 *
 * Deckt den kompletten Lebenszyklus eines Spiels über die UI ab.
 * Jeder Test verwendet einen eindeutigen Titel (Timestamp), damit
 * Tests unabhängig voneinander und wiederholbar laufen. Nach jedem
 * Test wird über die API aufgeräumt, falls die UI-Aktion es nicht
 * selbst schon erledigt hat.
 */
describe('Spiele erstellen, bearbeiten und löschen', () => {
  const uniqueSuffix = () => Date.now().toString();

  beforeEach(() => {
    cy.visitApp();
  });

  it('erstellt ein neues Spiel manuell und zeigt es in der Liste an', () => {
    const title = `Cypress Testspiel ${uniqueSuffix()}`;

    cy.openAddGameForm();
    cy.fillGameForm({
      title,
      description: 'Ein von Cypress erstelltes Testspiel.',
      imageUrl: 'https://example.com/cover.jpg',
      releaseDate: '2022-06-15',
    });

    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame').its('response.statusCode').should('eq', 201);

    cy.get('.game-form').should('not.exist');
    cy.contains('.game-card__title', title).should('be.visible');
    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__description').should('contain.text', 'Ein von Cypress erstelltes Testspiel.');
    });

    cy.deleteGameByTitle(title);
  });

  it('bearbeitet ein bestehendes Spiel und speichert die Änderungen', () => {
    const suffix = uniqueSuffix();
    const originalTitle = `Cypress Bearbeiten Original ${suffix}`;
    // Bewusst ein völlig anderer Titel (kein Substring des Originals),
    // damit "should not exist"-Prüfungen unten eindeutig sind.
    const updatedTitle = `Cypress Bearbeiten Aktualisiert ${suffix}`;

    // Vorbereitung: Spiel über die UI anlegen
    cy.openAddGameForm();
    cy.fillGameForm({ title: originalTitle, releaseDate: '2021-03-10' });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    // Bearbeiten über den Edit-Button der Karte
    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__btn--edit').click();
    });
    cy.get('.game-form__title').should('contain.text', 'Edit Game');
    cy.get('.game-form input[name="title"]').should('have.value', originalTitle);

    cy.fillGameForm({ title: updatedTitle, description: 'Aktualisierte Beschreibung' });

    cy.intercept('PUT', '/api/games/*').as('updateGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@updateGame').its('response.statusCode').should('eq', 200);

    cy.get('.game-form').should('not.exist');
    cy.contains('.game-card__title', updatedTitle).should('be.visible');
    cy.contains('.game-card__title', originalTitle).should('not.exist');

    cy.deleteGameByTitle(updatedTitle);
  });

  it('löscht ein Spiel über den Delete-Button', () => {
    const title = `Cypress Löschen ${uniqueSuffix()}`;

    cy.openAddGameForm();
    cy.fillGameForm({ title, releaseDate: '2019-11-01' });
    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form__btn--submit').click();
    cy.wait('@createGame');

    cy.contains('.game-card__title', title).should('be.visible');

    cy.intercept('DELETE', '/api/games/*').as('deleteGame');
    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__btn--delete').click();
    });
    cy.wait('@deleteGame').its('response.statusCode').should('eq', 204);

    cy.contains('.game-card__title', title).should('not.exist');
  });
});
