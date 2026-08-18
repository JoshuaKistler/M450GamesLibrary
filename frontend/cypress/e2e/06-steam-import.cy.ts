/// <reference types="cypress" />

/**
 * E2E-Tests: Steam-Import im Formular
 *
 * Die externe Steam-API wird via cy.intercept gestubbt, damit die
 * Tests deterministisch und unabhängig von Drittanbieter-Verfügbarkeit
 * laufen. Getestet wird ausschliesslich das Verhalten der eigenen
 * Anwendung (Suche, Trefferliste, Übernahme der Daten ins Formular).
 */
describe('Spiel per Steam-Suche importieren', () => {
  beforeEach(() => {
    cy.visitApp();
    cy.openAddGameForm();
  });

  it('sucht ein Spiel auf Steam und übernimmt die Daten ins Formular', () => {
    cy.intercept('GET', '/api/steam/search*', { fixture: 'steam-search.json' }).as('steamSearch');
    cy.intercept('GET', '/api/steam/game/*', { fixture: 'steam-details.json' }).as('steamDetails');

    cy.get('.game-form__steam-input').type('Witcher');
    cy.get('.game-form__btn--steam').click();
    cy.wait('@steamSearch');

    cy.get('.game-form__steam-result').should('have.length', 1);
    cy.get('.game-form__steam-result-name').should('contain.text', 'The Witcher 3: Wild Hunt');

    cy.get('.game-form__steam-result').click();
    cy.wait('@steamDetails');

    cy.get('.game-form input[name="title"]').should('have.value', 'The Witcher 3: Wild Hunt');
    cy.get('.game-form textarea[name="description"]').should(
      'have.value',
      'As war rages on throughout the Northern Realms, you take on the greatest contract of your life.'
    );
    cy.get('.game-form input[name="imageUrl"]').should(
      'have.value',
      'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg'
    );
    // Die App wandelt das Steam-Datum ("18 May, 2015") lokal via `new Date().toISOString()`
    // um, was je nach Zeitzone der Testumgebung zum Vor- oder Folgetag führen kann.
    // Deshalb wird der Erwartungswert mit derselben Logik berechnet statt hartkodiert.
    const expectedDate = new Date('18 May, 2015').toISOString().split('T')[0];
    cy.get('.game-form input[name="releaseDate"]').should('have.value', expectedDate);
  });

  it('zeigt eine Fehlermeldung, wenn kein Steam-Spiel gefunden wird', () => {
    cy.intercept('GET', '/api/steam/search*', { total: 0, items: [] }).as('steamSearchEmpty');

    cy.get('.game-form__steam-input').type('EinSpielDasAufSteamNichtExistiert');
    cy.get('.game-form__btn--steam').click();
    cy.wait('@steamSearchEmpty');

    cy.contains('.game-form__error', 'Kein Spiel gefunden.').should('be.visible');
  });

  it('zeigt eine Fehlermeldung bei einem Steam-API-Fehler', () => {
    cy.intercept('GET', '/api/steam/search*', { statusCode: 500, body: {} }).as('steamSearchError');

    cy.get('.game-form__steam-input').type('Witcher');
    cy.get('.game-form__btn--steam').click();
    cy.wait('@steamSearchError');

    cy.contains('.game-form__error', 'Fehler bei der Steam-Suche.').should('be.visible');
  });

  it('schliesst die Trefferliste bei einem Klick ausserhalb', () => {
    cy.intercept('GET', '/api/steam/search*', { fixture: 'steam-search.json' }).as('steamSearch');

    cy.get('.game-form__steam-input').type('Witcher');
    cy.get('.game-form__btn--steam').click();
    cy.wait('@steamSearch');
    cy.get('.game-form__steam-results').should('be.visible');

    cy.get('.game-form__label').first().click();
    cy.get('.game-form__steam-results').should('not.exist');
  });
});
