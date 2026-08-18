import { defineConfig } from 'cypress';

export default defineConfig({
  // Nur E2E-Tests – keine Component-Tests
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      return config;
    },
  },

  // Video-Aufzeichnung aktiviert, damit man den Testläufen zuschauen kann
  video: true,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  videoCompression: false,

  viewportWidth: 1440,
  viewportHeight: 900,

  defaultCommandTimeout: 8000,
  requestTimeout: 8000,

  // Nur Component-Testing-Konfiguration bewusst weggelassen (component: {...})
});
