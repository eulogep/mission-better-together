import { test, expect, isDesktop } from './fixtures';

test.describe('Application réelle, sans démo', () => {
  test('aucun élément de prototype (faux téléphone, panneau « Explorer les écrans »)', async ({ app }) => {
    await app.goto('/');
    await expect(app.getByRole('button', { name: 'URGENCE', exact: true })).toBeVisible();
    await expect(app.getByText('Explorer les écrans')).toHaveCount(0);
    await expect(app.getByText('Cadre mobile')).toHaveCount(0);
    // L'application occupe toute la largeur de la fenêtre (pas de cadre de 390 px sur ordinateur)
    const width = await app.locator('main').evaluate((el) => el.getBoundingClientRect().width);
    if (isDesktop(app)) expect(width).toBeGreaterThan(600);
  });

  test('navigation adaptée : onglets sur mobile, barre latérale sur ordinateur', async ({ app }) => {
    await app.goto('/');
    const nav = app.getByRole('navigation', { name: 'Navigation principale' });
    if (isDesktop(app)) {
      await expect(nav.getByRole('button', { name: 'Structures d’aide' })).toBeVisible();
      await nav.getByRole('button', { name: 'Carnet' }).click();
    } else {
      await expect(nav.getByRole('button', { name: 'Accueil' })).toBeVisible();
      await nav.getByRole('button', { name: 'Carnet' }).click();
    }
    await expect(app).toHaveURL(/\/carnet$/);
    await expect(app.getByRole('heading', { name: 'Ton carnet protégé' })).toBeVisible();
  });

  test('chaque écran a une adresse : lien profond, rechargement, retour', async ({ app }) => {
    await app.goto('/sinformer/articles/garder-des-preuves');
    await expect(app.getByRole('heading', { name: 'Comment conserver des preuves ?' })).toBeVisible();
    await app.reload();
    await expect(app.getByRole('heading', { name: 'Comment conserver des preuves ?' })).toBeVisible();
    await app.goBack();
    await expect(app.getByRole('button', { name: 'URGENCE', exact: true })).toBeVisible();
    await expect(app).toHaveURL(/\/$/);
  });

  test('adresse inconnue → accueil', async ({ app }) => {
    await app.goto('/page-qui-n-existe-pas');
    await expect(app.getByRole('button', { name: 'URGENCE', exact: true })).toBeVisible();
  });

  test('parcours urgence témoin jusqu’à l’appel des secours', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'URGENCE', exact: true }).click();
    await app.getByRole('button', { name: 'TEMOIN', exact: true }).click();
    await expect(app.getByText('1/3')).toBeVisible();
    await app.getByRole('button', { name: 'OUI', exact: true }).click();
    await expect(app.getByText('Appelez les secours.')).toBeVisible();
  });

  test('premier lancement : accueil en 3 étapes, avec accès urgence', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Ici, tu n’es jamais seul·e.')).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Ton espace reste secret.')).toBeVisible();
    await page.getByRole('button', { name: 'Urgence' }).click();
    await expect(page).toHaveURL(/\/urgence$/);
  });
});

test.describe('responsive', () => {
  for (const width of [320, 768]) {
    test(`pas de défilement horizontal à ${width} px`, async ({ app }) => {
      await app.setViewportSize({ width, height: 800 });
      for (const path of ['/', '/carnet', '/sinformer', '/specialistes', '/serenite', '/lieux', '/alerte', '/contacts', '/a-propos']) {
        await app.goto(path);
        await app.waitForTimeout(250);
        const overflow = await app.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, path).toBeLessThanOrEqual(0);
      }
    });
  }
});
