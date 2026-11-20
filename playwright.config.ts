import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de parcours sur le build de production (service worker, CSP, chargement différé inclus).
 * Utilise le Google Chrome installé (channel « chrome ») : aucun navigateur à télécharger.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: false } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
