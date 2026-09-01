/// <reference types="cypress" />

/**
 * WARUM TESTENSWERT:
 * Schützt vor ungewolltem Datenverlust und UI-Fehlern. Bricht ein Nutzer das Editieren ab,
 * dürfen keine Teileingaben im Speicher verbleiben. Zudem kommen im Web häufig defekte oder
 * fehlende Bild-URLs vor – ein visueller Fallback ("No Image") verhindert, dass kaputte
 * HTML-Icons das Layout der Anwendung zerstören.
 */
describe('Formular-Abbruch und Darstellungs-Randfälle', () => {
  const uniqueSuffix = () => Date.now().toString();

  let createdTitles: string[] = [];

  const createGameViaApi = (game: {
    title: string;
    description?: string;
    imageUrl?: string;
    releaseDate?: string;
  }) => {
    createdTitles.push(game.title);
    return cy.request({
      method: 'POST',
      url: '/api/games',
      body: {
        title: game.title,
        description: game.description ?? '',
        imageUrl: game.imageUrl ?? '',
        releaseDate: game.releaseDate ?? '2020-05-04',
      },
    });
  };

  /**
   * Native Tab-Navigation als Ersatz für `cy.tab()`.
   *
   * `cypress-plugin-tab` ist in diesem Projekt NICHT installiert (siehe
   * devDependencies in package.json). Statt eine fehlende Abhängigkeit
   * vorauszusetzen, wird die Tab-Reihenfolge nativ nachgebildet: Alle
   * fokussierbaren Elemente werden in DOM-Reihenfolge ermittelt (deaktivierte
   * und unsichtbare Elemente werden wie im Browser übersprungen) und der Fokus
   * wandert zum jeweils nächsten Element. Da das Formular keine positiven
   * `tabindex`-Werte verwendet, entspricht die DOM-Reihenfolge exakt der
   * echten Tab-Reihenfolge des Browsers.
   */
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const pressTab = () => {
    cy.document().then((doc) => {
      const all = Array.prototype.slice.call(
        doc.querySelectorAll(FOCUSABLE_SELECTOR)
      ) as HTMLElement[];

      const tabbables = all.filter((el) => el.getClientRects().length > 0);
      const currentIndex = tabbables.indexOf(doc.activeElement as HTMLElement);
      const next = tabbables[(currentIndex + 1) % tabbables.length];

      expect(next, 'nächstes per Tab erreichbares Element').to.exist;
      next.focus();
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

  it('verwirft Änderungen beim Abbrechen des Bearbeitens vollständig', () => {
    const suffix = uniqueSuffix();
    const originalTitle = `Cypress Cancel Original ${suffix}`;
    const originalDescription = `Originalbeschreibung ${suffix}`;
    const originalDate = '2018-09-12';
    const verworfenerTitel = `Cypress Cancel Verworfen ${suffix}`;
    const verworfeneBeschreibung = `Diese Beschreibung darf NIE gespeichert werden ${suffix}`;

    createGameViaApi({
      title: originalTitle,
      description: originalDescription,
      releaseDate: originalDate,
    });
    cy.visitApp();

    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__btn--edit').click();
    });
    cy.get('.game-form__title').should('contain.text', 'Edit Game');
    cy.get('.game-form input[name="title"]').should('have.value', originalTitle);

    cy.fillGameForm({
      title: verworfenerTitel,
      description: verworfeneBeschreibung,
    });
    cy.get('.game-form input[name="title"]').should('have.value', verworfenerTitel);

    cy.intercept('PUT', '/api/games/*').as('updateGame');
    cy.get('.game-form__btn--cancel').click();
    cy.get('.game-form').should('not.exist');

    cy.contains('.game-card', originalTitle).should('be.visible');
    cy.contains('.game-card', originalTitle).within(() => {
      cy.get('.game-card__title').should('have.text', originalTitle);
      cy.get('.game-card__description').should('have.text', originalDescription);
    });

    cy.contains('.game-card__title', verworfenerTitel).should('not.exist');
    cy.contains('.game-card__description', verworfeneBeschreibung).should('not.exist');
    cy.get('@updateGame.all').should('have.length', 0);

    cy.request('GET', '/api/games').then((res) => {
      const games = res.body as Array<{
        title: string;
        description: string;
        releaseDate: string;
      }>;
      const persisted = games.find((g) => g.title === originalTitle);

      expect(persisted, 'Originalspiel existiert weiterhin im Backend').to.exist;
      expect(persisted!.description).to.eq(originalDescription);
      expect(persisted!.releaseDate).to.eq(originalDate);
      expect(games.some((g) => g.title === verworfenerTitel)).to.eq(false);
    });
  });

  it('zeigt den "No Image"-Fallback, wenn die Bild-URL kaputt ist (onError)', () => {
    const suffix = uniqueSuffix();
    const title = `Cypress Kaputtes Bild ${suffix}`;
    const brokenImageUrl = `http://localhost:3000/kaputtes-cover-${suffix}.jpg`;

    createGameViaApi({
      title,
      description: `Beschreibung ${suffix}`,
      imageUrl: brokenImageUrl,
    });

    cy.intercept('GET', `**/kaputtes-cover-${suffix}.jpg`, {
      statusCode: 404,
      body: '',
    }).as('brokenImage');

    cy.visitApp();

    cy.contains('.game-card', title).should('be.visible');
    cy.wait('@brokenImage');

    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('be.visible');
      cy.get('.game-card__no-image').should('contain.text', 'No Image');
      cy.get('img').should('not.exist');
      cy.get(`img[src="${brokenImageUrl}"]`).should('not.exist');
      cy.get('.game-card__title').should('have.text', title);
      cy.get('.game-card__btn--edit').should('be.visible');
    });

    cy.get('.home-page__error').should('not.exist');
  });

  it('zeigt den "No Image"-Platzhalter, wenn gar keine Bild-URL gesetzt ist', () => {
    const suffix = uniqueSuffix();
    const title = `Cypress Ohne Bild ${suffix}`;

    createGameViaApi({
      title,
      description: `Beschreibung ${suffix}`,
      imageUrl: '',
    });
    cy.visitApp();

    cy.contains('.game-card', title).should('be.visible');
    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__no-image').should('be.visible');
      cy.get('.game-card__no-image').should('contain.text', 'No Image');
      cy.get('img').should('not.exist');
      cy.get('.game-card__badge').should('be.visible');
      cy.get('.game-card__btn--delete').should('be.visible');
    });
  });

  it('erlaubt das vollständige Ausfüllen und Absenden des Formulars nur mit der Tastatur', () => {
    const suffix = uniqueSuffix();
    const title = `Cypress Tastatur ${suffix}`;
    const description = `Per Tastatur erfasst ${suffix}`;
    const imageUrl = 'https://example.com/cover.jpg';
    const releaseDate = '2017-04-21';

    createdTitles.push(title);

    cy.visitApp();
    cy.openAddGameForm();

    cy.get('.game-form__close').focus();
    cy.focused().should('have.class', 'game-form__close');

    pressTab();
    cy.focused().should('have.class', 'game-form__steam-input');

    // Der Steam-Search-Button wird übersprungen, weil er bei leerem
    // Steam-Suchfeld `disabled` ist - genau wie im echten Browser.
    pressTab();
    cy.focused().should('have.attr', 'name', 'title');
    cy.focused().type(title);

    pressTab();
    cy.focused().should('have.attr', 'name', 'description');
    cy.focused().type(description);

    pressTab();
    cy.focused().should('have.attr', 'name', 'imageUrl');
    cy.focused().type(imageUrl);

    pressTab();
    cy.focused().should('have.attr', 'name', 'releaseDate');
    cy.focused().type(releaseDate);

    pressTab();
    cy.focused().should('have.class', 'game-form__btn--cancel');
    pressTab();
    cy.focused().should('have.class', 'game-form__btn--submit');

    cy.get('.game-form input[name="title"]').should('have.value', title);
    cy.get('.game-form textarea[name="description"]').should('have.value', description);
    cy.get('.game-form input[name="imageUrl"]').should('have.value', imageUrl);
    cy.get('.game-form input[name="releaseDate"]').should('have.value', releaseDate);

    cy.intercept('POST', '/api/games').as('createGame');
    cy.get('.game-form input[name="title"]').focus().type('{enter}');
    cy.wait('@createGame').its('response.statusCode').should('eq', 201);

    cy.get('.game-form').should('not.exist');
    cy.get('.game-form__error').should('not.exist');
    cy.contains('.game-card', title).within(() => {
      cy.get('.game-card__title').should('have.text', title);
      cy.get('.game-card__description').should('have.text', description);
    });
  });
});
