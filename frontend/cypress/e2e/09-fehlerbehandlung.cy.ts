/// <reference types="cypress" />

/**
 * WARUM TESTENSWERT:
 * Netzwerke und Server-Backends sind nicht 100% zuverlässig. Bei 500er-Serverfehlern oder
 * Verbindungsabbrüchen muss dem Nutzer klares Feedback über Fehlermeldungen gegeben werden,
 * damit dieser nicht verwirrt auf einer eingefrorenen Seite verharrt oder Formulare
 * mehrfach fälschlicherweise absendet.
 */
describe('Fehlerbehandlung bei Server- und Netzwerkproblemen', () => {
  const uniqueSuffix = () => Date.now().toString();

  let createdTitles: string[] = [];

  beforeEach(() => {
    createdTitles = [];
  });

  afterEach(() => {
    createdTitles.forEach((title) => {
      cy.deleteGameByTitle(title);
    });
    createdTitles = [];
  });

  it('zeigt eine Fehlermeldung, wenn das initiale Laden mit 500 fehlschlägt', () => {
    cy.intercept('GET', '/api/games', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('getGamesError');

    cy.visit('/');
    cy.wait('@getGamesError').its('response.statusCode').should('eq', 500);

    cy.get('.home-page__error')
      .should('be.visible')
      .and('contain.text', 'Fehler beim Laden der Spiele.');

    cy.get('.game-list__spinner').should('not.exist');
    cy.get('.home-page__headline').should('contain.text', 'Games Library');
    cy.get('.search-bar__input').should('be.visible');
    cy.get('.home-page__add-btn').should('be.enabled');

    cy.get('.game-card').should('not.exist');
    cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
  });

  it('zeigt eine verständliche Fehlermeldung, wenn die Suche mit 500 fehlschlägt', () => {
    cy.visitApp();
    cy.get('.game-card').its('length').should('be.greaterThan', 0);

    cy.get('.game-card').its('length').then((countBeforeSearch) => {
      cy.intercept('GET', '/api/games/search*', {
        statusCode: 500,
        body: { message: 'Internal Server Error' },
      }).as('searchError');

      cy.get('.search-bar__input').type('Zelda');
      cy.get('.search-bar__button').click();
      cy.wait('@searchError').its('response.statusCode').should('eq', 500);

      cy.get('.home-page__error')
        .should('be.visible')
        .and('contain.text', 'Fehler bei der Suche.');

      cy.get('.game-list__spinner').should('not.exist');
      cy.get('.game-card').should('have.length', countBeforeSearch);
      cy.get('.search-bar__input').should('have.value', 'Zelda');
      cy.get('.search-bar__button').should('be.enabled');
    });
  });

  it('zeigt beim Anlegen trotz Netzwerkfehler kein optimistisches Spiel in der Liste', () => {
    const suffix = uniqueSuffix();
    const title = `Cypress Netzwerkfehler ${suffix}`;

    createdTitles.push(title);

    cy.visitApp();
    cy.get('.game-card').its('length').should('be.greaterThan', 0);

    cy.get('.game-card').its('length').then((countBefore) => {
      cy.intercept('POST', '/api/games', { forceNetworkError: true }).as('createFailed');

      cy.openAddGameForm();
      cy.fillGameForm({
        title,
        description: 'Darf niemals in der Liste erscheinen.',
        releaseDate: '2016-08-08',
      });
      cy.get('.game-form__btn--submit').click();
      cy.wait('@createFailed');

      // BEOBACHTETES VERHALTEN (Ergebnis dieses Tests, bewusst dokumentiert):
      //
      // a) Das Formular SCHLIESST sich trotz des Fehlers. Ursache:
      //    HomePage.handleFormSubmit ruft `await addGame(game)` auf und führt
      //    danach immer `setShowForm(false)` aus. useGames.addGame fängt den
      //    Fehler intern per try/catch ab und wirft ihn nicht weiter, der
      //    Aufrufer kann das Scheitern also gar nicht erkennen.
      //
      // b) Bewertung: Aus UX-Sicht unglücklich, weil die eingegebenen Daten
      //    beim Schliessen verloren gehen und komplett neu erfasst werden
      //    müssen. Besser wäre, das Formular mit den Eingaben offen zu lassen
      //    und einen Retry anzubieten.
      //
      // c) Entscheidend und korrekt ist jedoch: Es findet KEIN optimistisches
      //    Update statt. setGames wird im Fehlerfall nicht aufgerufen, das
      //    Spiel erscheint nicht in der Liste und der Nutzer bekommt eine
      //    Fehlermeldung. Es wird also kein Erfolg vorgetäuscht.
      cy.get('.game-form').should('not.exist');

      cy.get('.home-page__error')
        .should('be.visible')
        .and('contain.text', 'Fehler beim Erstellen des Spiels.');

      cy.contains('.game-card__title', title).should('not.exist');
      cy.get('.game-card').should('have.length', countBefore);

      cy.request('GET', '/api/games').then((res) => {
        const games = res.body as Array<{ title: string }>;
        expect(games.some((g) => g.title === title)).to.eq(false);
      });
    });
  });

  it('zeigt während einer sehr langsamen Antwort einen Ladezustand an', () => {
    cy.visitApp();

    cy.intercept('GET', '/api/games/search*', (req) => {
      req.reply({
        statusCode: 200,
        body: [],
        delay: 3000,
      });
    }).as('slowSearch');

    cy.get('.search-bar__input').type('Langsame Suche');
    cy.get('.search-bar__button').click();

    cy.get('.game-list__spinner').should('be.visible');
    cy.get('.game-list__status-title').should('contain.text', 'Loading Library...');
    cy.get('.home-page__stat-value').first().should('have.text', '–');

    cy.wait('@slowSearch');
    cy.get('.game-list__spinner').should('not.exist');
    cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
    cy.get('.home-page__error').should('not.exist');
    cy.get('@slowSearch.all').should('have.length', 1);

    // BEFUND: Der Such-Button wird während des Ladens NICHT deaktiviert, ein
    // ungeduldiger Nutzer kann also parallele Requests auslösen. Im
    // Steam-Import ist der Doppelklick-Schutz dagegen umgesetzt
    // (disabled={steamLoading}) und wird nachfolgend geprüft.
    cy.intercept('GET', '/api/steam/search*', (req) => {
      req.reply({
        fixture: 'steam-search.json',
        delay: 3000,
      });
    }).as('slowSteamSearch');

    cy.openAddGameForm();
    cy.get('.game-form__steam-input').type('Witcher');
    cy.get('.game-form__btn--steam').should('be.enabled').click();

    cy.get('.game-form__btn--steam').should('be.disabled');
    cy.get('.game-form__btn--steam').should('contain.text', 'Loading');
    cy.get('.game-form__steam-spinner').should('be.visible');
    cy.get('.game-form__steam-input').should('be.disabled');

    cy.wait('@slowSteamSearch');

    cy.get('.game-form__btn--steam').should('be.enabled');
    cy.get('.game-form__steam-input').should('be.enabled');
    cy.get('.game-form__steam-result').should('have.length', 1);
    cy.get('@slowSteamSearch.all').should('have.length', 1);

    cy.get('.game-form__btn--cancel').click();
    cy.get('.game-form').should('not.exist');
  });
});
