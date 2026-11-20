import { test, expect } from './fixtures';

test.describe('SOS « maintenir pour appeler »', () => {
  test('appui court : aucun appel ; appui long : écran d’appel 112', async ({ app }) => {
    await app.goto('/');
    const sos = app.getByRole('button', { name: /Appeler le 112 — maintenir appuyé/ }).first();
    await sos.click();
    await expect(app.getByText('Maintiens appuyé pour appeler').filter({ visible: true })).toHaveCSS('opacity', '1');
    await expect(app).toHaveURL(/\/$/);

    await sos.hover();
    await app.mouse.down();
    await app.waitForTimeout(1200);
    await app.mouse.up();
    await expect(app).toHaveURL(/\/appel\/urgence$/);
    await expect(app.getByRole('link', { name: /Appeler le 112/ })).toHaveAttribute('href', 'tel:112');
    await expect(app.getByText(/MBT n’opère aucun service d’urgence/)).toBeVisible();
  });
});

test.describe('Contacts et alerte SMS', () => {
  test('ajouter, modifier, préparer un SMS — position uniquement sur demande', async ({ app, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522, accuracy: 10 });
    await app.addInitScript(() => {
      const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      (window as unknown as { __geoCalls: number }).__geoCalls = 0;
      navigator.geolocation.getCurrentPosition = (...args: Parameters<Geolocation['getCurrentPosition']>) => {
        (window as unknown as { __geoCalls: number }).__geoCalls++;
        return orig(...args);
      };
    });

    await app.goto('/contacts');
    await app.getByRole('button', { name: 'Ajouter un contact' }).click();
    await app.getByPlaceholder(/Prénom/).fill('Mamie');
    await app.getByPlaceholder('Numéro de téléphone').fill('06 11 22 33 44');
    await app.getByRole('button', { name: 'OK' }).click();
    await app.getByRole('button', { name: 'Modifier Mamie' }).click();
    await app.getByPlaceholder(/Prénom/).fill('Mamie Jo');
    await app.getByRole('button', { name: 'OK' }).click();
    await expect(app.getByRole('button', { name: /Appeler Mamie Jo/ })).toBeVisible();

    await app.getByRole('button', { name: /Alerter mes proches/ }).click();
    await expect(app).toHaveURL(/\/alerte$/);
    await app.waitForTimeout(500);
    expect(await app.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);
    await expect(app.locator('textarea')).not.toHaveValue(/maps\.google/);

    await app.getByRole('button', { name: 'Ajouter ma position' }).click();
    await expect(app.locator('textarea')).toHaveValue(/maps\.google\.com\/\?q=48\.856600,2\.352200/);

    const sms = app.getByRole('link', { name: 'Préparer un SMS pour Mamie' });
    await expect(sms).toHaveAttribute('href', /^sms:0611223344\?&?body=/);
    await sms.click();
    await expect(app.getByText(/Message préparé pour Mamie/)).toBeVisible();
    await expect(app.getByText(/Il n’est envoyé que lorsque tu appuies sur « Envoyer »/)).toBeVisible();
  });
});

test.describe('Lieux d’aide', () => {
  test('aucune géolocalisation sans action ; carte réelle après accord', async ({ app, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
    await app.goto('/lieux');
    await expect(app.getByRole('button', { name: 'Utiliser ma position' })).toBeVisible();
    await expect(app.getByText(/non vérifiées par MBT/)).toBeVisible();
    await expect(app.locator('.mbt-pin')).toHaveCount(0);

    await app.getByRole('button', { name: 'Utiliser ma position' }).click();
    await expect(app.getByText('Les plus proches')).toBeVisible({ timeout: 15_000 });
    await expect(app.locator('.mbt-pin')).toHaveCount(3);
    await expect(app.getByRole('link', { name: 'Itinéraire à pied' })).toHaveAttribute('href', /travelmode=walking|dirflg=w/);
  });

  test('recherche par ville sans géolocalisation', async ({ app }) => {
    await app.goto('/lieux');
    await app.getByLabel('Chercher une ville ou une adresse').fill('Lyon');
    await app.getByRole('button', { name: 'Lyon', exact: true }).click();
    await expect(app.getByText('Autour de :')).toBeVisible();
    await expect(app.getByText('Les plus proches')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Sérénité', () => {
  test('préférences sauvegardées (exercice, durée, sans animation, volume)', async ({ app }) => {
    await app.goto('/serenite');
    await app.getByRole('button', { name: '4-7-8 Calme' }).click();
    await app.getByRole('button', { name: '1 min', exact: true }).click();
    await app.getByLabel('Sans animation').check();
    await app.getByRole('button', { name: 'Commencer' }).click();
    await expect(app.getByText(/Temps restant : 0:5\d/)).toBeVisible({ timeout: 4000 });
    await app.getByRole('button', { name: 'Pause' }).click();
    await expect(app.getByRole('button', { name: 'Reprendre' })).toBeVisible();

    await app.getByRole('button', { name: 'Sons' }).click();
    await app.getByLabel('Volume général').fill('0.3');
    await app.reload();
    await expect(app.getByRole('button', { name: '1 min', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(app.getByLabel('Sans animation')).toBeChecked();
    const prefs = await app.evaluate(() => JSON.parse(localStorage.getItem('mbt_preferences_v1') ?? '{}'));
    expect(prefs.serenite.patternId).toBe('478');
    expect(prefs.serenite.masterVolume).toBeCloseTo(0.3);
  });
});

test.describe('S’informer, structures, récits', () => {
  test('bibliothèque : recherche, article daté et sourcé', async ({ app }) => {
    await app.goto('/sinformer');
    await app.getByRole('button', { name: /Comprendre et agir/ }).click();
    await app.getByLabel('Rechercher une fiche').fill('témoin');
    await app.getByRole('button', { name: /Je suis témoin : comment aider/ }).click();
    await expect(app.getByText(/Mis à jour le/)).toBeVisible();
    await expect(app.getByRole('link', { name: /Éducation nationale/ }).first()).toHaveAttribute('href', /^https:\/\/www\.education\.gouv\.fr/);
  });

  test('annuaire : filtres et fiche 3018 sans fausse affiliation', async ({ app }) => {
    await app.goto('/specialistes');
    await app.getByRole('group', { name: 'Type d’aide' }).getByRole('button', { name: 'Urgence', exact: true }).click();
    await expect(app.getByRole('button', { name: /114 — Urgence par SMS/ })).toBeVisible();
    await app.goto('/specialistes/3018');
    await expect(app.getByText('7j/7, de 9h à 23h')).toBeVisible();
    await expect(app.getByText(/MBT n’est pas affilié à cette structure/)).toBeVisible();
    await expect(app.getByRole('link', { name: /Tchat, WhatsApp/ })).toHaveAttribute('href', 'https://e-enfance.org/besoin-daide/');
  });

  test('les récits sont présentés comme fictifs', async ({ app }) => {
    await app.goto('/temoignages');
    await expect(app.getByText('Récits illustratifs.')).toBeVisible();
  });
});

test.describe('Sécurité d’usage', () => {
  test('sortie rapide vers une page neutre', async ({ app }) => {
    await app.goto('/carnet');
    await app.getByRole('button', { name: 'Sortie rapide' }).first().click();
    await expect(app).toHaveURL(/google\.com/);
  });

  test('mode discret : camouflage puis retour', async ({ app }) => {
    await app.goto('/');
    await app.getByRole('button', { name: 'Mode discret' }).click();
    await expect(app.getByRole('heading', { name: 'Mes Révisions' })).toBeVisible();
    await expect(app.getByRole('button', { name: 'URGENCE', exact: true })).toHaveCount(0);
    await app.getByRole('button', { name: 'Revenir à MBT' }).click();
    await expect(app.getByRole('button', { name: 'URGENCE', exact: true })).toBeVisible();
  });

  test('CSP stricte présente en production', async ({ app }) => {
    await app.goto('/');
    const csp = await app.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('fonts.googleapis.com');
  });
});
