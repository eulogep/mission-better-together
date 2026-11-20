import { defineConfig } from 'vitest/config';

// Tests unitaires de la logique métier (sans navigateur) : chiffrement, carnet, routes, contenus…
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    testTimeout: 30_000,
  },
});
