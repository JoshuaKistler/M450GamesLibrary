/// <reference types="cypress" />

/**
 * E2E-Tests: Fehler- und Ladezustände (Netzwerk-/Serverfehler)
 *
 * WARUM DAS SIMULIEREN VON NETZ- UND SERVERFEHLERN KRITISCH IST
 *
 * Im Testlabor läuft das Backend immer, antwortet sofort und liefert immer 200.
 * In der Realität gilt das nie: Das Backend startet gerade neu, die Datenbank-
 * verbindung ist erschöpft, ein Deployment läuft, der Nutzer sitzt im Zug mit
 * schlechtem Empfang oder das WLAN bricht mitten im Speichern weg. Genau diese
 * Pfade sind der am schlechtesten getestete Teil fast jeder Anwendung – obwohl
 * sie darüber entscheiden, ob der Nutzer der App vertraut.
 *
 * Konkret schützen diese Tests vor drei teuren Fehlerbildern:
 *
 * 1. DIE STUMME WEISSE SEITE
 *    Schlägt der initiale Ladevorgang fehl und die App zeigt nur eine leere
 *    Fläche, kann der Nutzer nicht unterscheiden zwischen "meine Bibliothek ist
 *    leer" und "die App ist kaputt". Er legt im schlimmsten Fall Daten erneut
 *    an, die längst existieren. Eine sichtbare Fehlermeldung (.home-page__error)
 *    ist deshalb ein Feature, kein Detail.
 *
 * 2. DER LÜGENDE ERFOLG (falsches optimistisches Update)
 *    Erscheint ein Spiel nach dem Speichern in der Liste, obwohl der Request
 *    nie beim Server ankam, glaubt der Nutzer, seine Daten seien sicher. Nach
 *    dem nächsten Reload sind sie weg – Datenverlust ohne jede Warnung. Der
 *    Test prüft deshalb explizit, dass NICHTS optimistisch angezeigt wird.
 *
 * 3. DER UNSICHTBARE LADEVORGANG (Doppel-Absenden)
 *    Ohne sichtbaren Lade-Indikator hält der Nutzer die App für eingefroren und
 *    klickt erneut. Das erzeugt doppelte Datensätze und Race Conditions, bei
 *    denen eine alte Antwort eine neuere überschreibt.
 *
 * Da echte Ausfälle nicht reproduzierbar herbeigeführt werden können, werden
 * sie hier über `cy.intercept()` deterministisch simuliert (Statuscode 500,
 * `forceNetworkError`, künstliche `delay`). Das macht die Tests schnell,
 * stabil und unabhängig vom tatsächlichen Zustand des Backends.
 *
 * TESTEINORDNUNG: System-/E2E-Tests, Grey-Box (wir kennen die API-Endpunkte und
 * stubben sie gezielt, prüfen das Ergebnis aber ausschliesslich über die UI).
 *
 * TESTISOLATION: Alle Antworten werden pro Test frisch gestubbt; Cypress setzt
 * Intercepts zwischen Tests automatisch zurück. Tests, die echte Daten anlegen
 * könnten, räumen in `afterEach` über die API auf.
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
