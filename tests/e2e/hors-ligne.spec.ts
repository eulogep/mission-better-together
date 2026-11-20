import { test, expect } from './fixtures';

test('l’application et le carnet fonctionnent hors ligne', async ({ app, context }) => {
  await app.goto('/');
  // Laisse le service worker s'installer et mettre l'application en cache
  await app.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return !!reg.active;
  });
  await app.waitForTimeout(1500);

  await context.setOffline(true);
  await app.goto('/?hors-ligne=1');
  await expect(app.getByRole('button', { name: 'URGENCE', exact: true })).toBeVisible();
  await app.goto('/carnet');
  await expect(app.getByRole('heading', { name: 'Ton carnet protégé' })).toBeVisible();
  await app.goto('/specialistes');
  await expect(app.getByRole('heading', { name: 'Structures d’aide' })).toBeVisible();
  await context.setOffline(false);
});
