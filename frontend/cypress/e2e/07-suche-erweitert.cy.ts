/// <reference types="cypress" />

/**
 * E2E-Tests: Suche – Randfälle (Edge Cases)
 *
 * WARUM SIND DIESE FÄLLE TESTENSWERT?
 *
 * Die bestehende Suite (`02-search.cy.ts`) deckt nur den "Happy Path" ab:
 * ein normaler Suchbegriff mit Treffer und einer ohne Treffer. Genau an den
 * Rändern der Eingabe brechen Suchfunktionen in der Praxis aber am häufigsten:
 *
 * 1. SONDERZEICHEN (%, _, <, &, Umlaute)
 *    Reale Spieltitel enthalten Sonderzeichen ("Pokémon", "S.T.A.L.K.E.R.",
 *    "Tom Clancy's ..."). Zusätzlich sind `%` und `_` SQL-LIKE-Wildcards und
 *    `<`/`&` HTML-Steuerzeichen. Wenn diese Zeichen nicht sauber escaped bzw.
 *    encodiert werden, drohen falsche Treffermengen, 400/500-Fehler oder im
 *    schlimmsten Fall XSS. Nutzerproblem: "Ich suche mein Spiel mit Umlaut und
 *    bekomme nichts / eine Fehlerseite."
 *
 * 2. SEHR LANGE SUCHBEGRIFFE (> 200 Zeichen)
 *    Entstehen real durch Copy-Paste (ganze Beschreibungstexte) oder durch
 *    fehlerhafte Automatisierung. Zu lange Query-Strings können zu 414/400,
 *    zu Timeouts oder zu einer "hängenden" UI führen, die für immer im
 *    Ladezustand bleibt. Nutzerproblem: "Die App friert nach dem Einfügen
 *    eines langen Textes ein."
 *
 * 3. AUSLÖSEVERHALTEN DER SUCHE (Debounce / Trigger)
 *    Ob pro Tastenanschlag ein Request rausgeht, entscheidet über Serverlast
 *    und über Race Conditions (eine späte Antwort überschreibt eine neuere).
 *    Dieses Verhalten ist nirgends getestet und würde bei einem Refactoring
 *    unbemerkt kippen. Nutzerproblem: "Die Ergebnisliste flackert / zeigt
 *    Treffer zu einem Begriff, den ich gar nicht mehr eingegeben habe."
 *
 * TESTEINORDNUNG: System-/E2E-Tests, Grey-Box (wir kennen die API-Endpunkte
 * und die CSS-Klassen, testen aber ausschliesslich über die UI).
 *
 * UNABHÄNGIGKEIT: Jeder Test erzeugt seine eigenen Daten mit Timestamp und
 * räumt sie in `afterEach` über die API wieder auf.
 *
 * HINWEIS ZUM BEGRIFF "KEIN CRASH": Cypress lässt einen Test bei einer
 * unbehandelten Browser-Exception automatisch fehlschlagen. Zusätzlich prüfen
 * wir aktiv, dass die UI weiterhin bedienbar ist (Suchfeld sichtbar) und
 * entweder Treffer oder der "No Games Found"-Zustand gerendert werden.
 */
describe('Suche – Sonderzeichen, lange Eingaben und Auslöseverhalten', () => {
  const uniqueSuffix = () => Date.now().toString();

  let createdTitles: string[] = [];

  const createGameViaApi = (title: string) => {
    createdTitles.push(title);
    return cy.request({
      method: 'POST',
      url: '/api/games',
      body: {
        title,
        description: 'Testdaten fuer erweiterte Suchtests.',
        imageUrl: 'https://example.com/cover.jpg',
        releaseDate: '2020-05-04',
      },
    });
  };

  beforeEach(() => {
    createdTitles = [];
  });

  afterEach(() => {
    createdTitles.forEach((title) => {
      cy.deleteGameByTitle(title);
    });
    createdTitles = [];
  });

  it('verarbeitet Sonderzeichen und Umlaute, ohne abzustürzen', () => {
    const suffix = uniqueSuffix();
    const specialTitle = `Cypress Söndérzeichen & Ümlaute <b>Test</b> 100% ${suffix}`;

    createGameViaApi(specialTitle);
    cy.visitApp();

    cy.intercept('GET', '/api/games/search*').as('searchSpecial');
    cy.get('.search-bar__input').type(`Söndérzeichen & Ümlaute <b>Test</b> 100% ${suffix}`, {
      delay: 0,
      parseSpecialCharSequences: false,
    });
    cy.get('.search-bar__button').click();
    cy.wait('@searchSpecial').its('response.statusCode').should('eq', 200);

    cy.get('.home-page__error').should('not.exist');
    cy.get('.game-card').should('have.length', 1);
    cy.get('.game-card__title').should('have.text', specialTitle);
    cy.get('.game-card__title').find('b').should('not.exist');

    cy.intercept('GET', '/api/games/search*').as('searchWildcards');
    cy.get('.search-bar__input').clear();
    cy.get('.search-bar__input').type('%_<&>%', {
      delay: 0,
      parseSpecialCharSequences: false,
    });
    cy.get('.search-bar__button').click();
    cy.wait('@searchWildcards').its('response.statusCode').should('eq', 200);

    cy.get('.home-page__error').should('not.exist');
    cy.get('.game-list__status-title').should('contain.text', 'No Games Found');
    cy.get('.search-bar__input').should('be.visible');
  });

  it('verarbeitet einen sehr langen Suchbegriff (> 200 Zeichen) ohne Absturz und ohne hängende Requests', () => {
    const longTerm = new Array(11).join('Suchbegriff-Ohne-Treffer-');

    expect(longTerm.length).to.be.greaterThan(200);

    cy.visitApp();

    cy.intercept('GET', '/api/games/search*').as('longSearch');
    cy.get('.search-bar__input').type(longTerm, {
      delay: 0,
      parseSpecialCharSequences: false,
    });
    cy.get('.search-bar__button').click();

    cy.wait('@longSearch', { timeout: 10000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('@longSearch').its('request.url').should('include', 'title=');
    cy.get('.search-bar__input').should('have.value', longTerm);
    cy.get('@longSearch.all').should('have.length', 1);

    cy.get('.game-list__spinner').should('not.exist');
    cy.get('.game-list__status-title')
      .should('not.contain.text', 'Loading Library...')
      .and('contain.text', 'No Games Found');
    cy.get('.home-page__error').should('not.exist');
    cy.get('.search-bar__button').should('be.enabled');
  });

  it('löst die Suche NICHT bei jedem Tastenanschlag aus, sondern nur per Button-Klick oder Enter', () => {
    const suffix = uniqueSuffix();
    const title = `Cypress Trigger Test ${suffix}`;
    const searchTerm = `Trigger Test ${suffix}`;

    createGameViaApi(title);
    cy.visitApp();

    cy.intercept('GET', '/api/games/search*').as('search');

    cy.get('.search-bar__input').type(searchTerm, { delay: 60 });
    cy.wait(1000);

    // BEOBACHTETES VERHALTEN (Ergebnis dieses Tests, bewusst dokumentiert):
    // Die App verwendet KEINEN Debounce und sucht auch nicht pro Tastenanschlag.
    // Nach dem vollständigen Tippen und einer Wartezeit von 1000 ms ist kein
    // einziger Request an /api/games/search gegangen. Ausgelöst wird die Suche
    // ausschliesslich durch das Absenden des Formulars, also per Enter im
    // Suchfeld oder per Klick auf den Search-Button (SearchBar.tsx: handleSubmit).
    // Einzige Ausnahme: Das Leeren des Feldes ruft onReset() auf und lädt über
    // GET /api/games wieder alle Spiele - nicht über den Such-Endpunkt.
    cy.get('@search.all').should('have.length', 0);
    cy.get('.game-card').its('length').should('be.greaterThan', 0);

    cy.get('.search-bar__input').type('{enter}');
    cy.wait('@search').its('response.statusCode').should('eq', 200);
    cy.get('@search.all').should('have.length', 1);
    cy.get('.game-card').should('have.length', 1);
    cy.get('.game-card__title').should('have.text', title);

    cy.get('.search-bar__button').click();
    cy.get('@search.all').should('have.length', 2);
    cy.get('.game-card__title').should('have.text', title);

    cy.intercept('GET', '/api/games').as('resetAll');
    cy.get('.search-bar__input').clear();
    cy.wait('@resetAll');
    cy.get('@search.all').should('have.length', 2);
    cy.get('.game-card').its('length').should('be.greaterThan', 1);

    cy.forceEmptyResults();
  });
});
