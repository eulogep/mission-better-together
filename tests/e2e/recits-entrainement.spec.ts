import { test, expect } from './fixtures';
import { PRACTICE_SCENARIOS } from '../../src/features/practice/scenarios';

test('les filtres gardent les bons récits et le lecteur retrouve le bon retour', async ({ app }) => {
  await app.goto('/temoignages');
  const stories = app.getByRole('list', { name: 'Récits disponibles' });
  const filters = app.getByRole('group', { name: 'Filtrer les récits par situation' });
  await expect(stories.getByRole('listitem')).toHaveCount(8);

  await filters.getByRole('button', { name: 'En ligne' }).click();
  await expect(stories.getByRole('listitem')).toHaveCount(3);
  await stories.getByRole('button', { name: /J’ai écrit à une amie/ }).click();
  await expect(app).toHaveURL(/\/temoignages\/6$/);
  await expect(app.getByRole('heading', { name: 'J’ai écrit à une amie mise à l’écart' })).toBeVisible();
  await app.getByRole('button', { name: /Changer la langue/ }).click();
  await expect(app.getByText(/In our class chat/)).toBeVisible();
  await app.getByRole('button', { name: 'Transcription', exact: true }).click();
  await expect(app.getByText('Transcription (English)')).toBeVisible();
  await app.getByRole('button', { name: 'Fermer la transcription' }).click();

  await app.getByRole('button', { name: /Essayer la situation.*Dans le groupe de classe/ }).click();
  await expect(app).toHaveURL(/\/entrainement\/groupe-de-classe$/);
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(app).toHaveURL(/\/temoignages\/6$/);

  await app.getByRole('button', { name: 'Témoignage suivant' }).click();
  await expect(app).toHaveURL(/\/temoignages\/0$/);
  await app.getByRole('button', { name: /Fiche pratique.*Je suis victime/ }).click();
  await expect(app).toHaveURL(/\/sinformer\/articles\/je-suis-victime$/);
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(app).toHaveURL(/\/temoignages\/0$/);
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(app).toHaveURL(/\/temoignages$/);
  await expect(filters.getByRole('button', { name: 'En ligne' })).toHaveAttribute('aria-pressed', 'true');

  await filters.getByRole('button', { name: 'En stage' }).click();
  await expect(stories.getByRole('listitem')).toHaveCount(1);
  await stories.getByRole('button', { name: /Dire stop au harcèlement/ }).click();
  await expect(app).toHaveURL(/\/temoignages\/5$/);
  await expect(app.getByRole('button', { name: 'Témoignage suivant' })).toBeDisabled();
});

test('les trois situations donnent un retour propre à chaque réponse', async ({ app }) => {
  await app.goto('/');
  await app.getByRole('button', { name: /S’entraîner à réagir/ }).click();
  await expect(app).toHaveURL(/\/entrainement$/);

  for (const scenario of PRACTICE_SCENARIOS) {
    await app.getByRole('button', { name: new RegExp(scenario.title) }).click();
    await expect(app).toHaveURL(new RegExp(`/entrainement/${scenario.id}$`));
    await expect(app.getByRole('heading', { name: scenario.title })).toBeVisible();
    await expect(app.getByRole('link', { name: /Source.*Éducation nationale/ })).toHaveAttribute('href', scenario.sourceUrl);

    const choices = app.getByRole('group', { name: 'Que ferais-tu ?' });
    await expect(choices.getByRole('button', { pressed: true })).toHaveCount(0);
    for (const option of scenario.choices) {
      const button = choices.getByRole('button', { name: option.label });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(choices.getByRole('button', { pressed: true })).toHaveCount(1);
      await expect(app.getByText(option.feedback, { exact: true })).toBeVisible();
    }

    await app.getByRole('button', { name: 'Retour', exact: true }).click();
    await expect(app).toHaveURL(/\/entrainement$/);
  }
});

test('le brouillon éditable peut être copié et disparaît en quittant la situation', async ({ app, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await app.goto('/entrainement/groupe-de-classe');
  const choices = app.getByRole('group', { name: 'Que ferais-tu ?' });
  await choices.getByRole('button').first().click();
  await app.getByRole('button', { name: 'Préparer mes mots' }).click();
  const editor = app.getByRole('textbox', { name: 'À un adulte de confiance' });
  const message = 'Je voudrais parler de ce qui se passe dans le groupe de classe.';
  await editor.fill(message);
  await choices.getByRole('button').nth(1).click();
  await expect(editor).toHaveValue(message);
  await app.getByRole('button', { name: 'Copier le texte' }).click();
  await expect(app.getByRole('status').filter({ hasText: 'Texte copié.' })).toBeVisible();
  expect(await app.evaluate(() => navigator.clipboard.readText())).toBe(message);

  await app.getByRole('button', { name: 'Lire la fiche pratique' }).click();
  await expect(app).toHaveURL(/\/sinformer\/articles\/je-suis-temoin$/);
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(choices.getByRole('button', { pressed: true })).toHaveCount(0);
  await choices.getByRole('button').first().click();
  await app.getByRole('button', { name: 'Préparer mes mots' }).click();
  await expect(editor).toHaveValue(PRACTICE_SCENARIOS[0].starter);
});

test('le brouillon reste sélectionnable quand le navigateur refuse la copie', async ({ app, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new DOMException('Accès refusé', 'NotAllowedError')) },
    });
  });
  await app.goto('/entrainement/apres-le-cours');
  await app.getByRole('group', { name: 'Que ferais-tu ?' }).getByRole('button').first().click();
  await app.getByRole('button', { name: 'Préparer mes mots' }).click();
  await app.getByRole('button', { name: 'Copier le texte' }).click();
  await expect(app.getByRole('status').filter({ hasText: 'Copie automatique indisponible' })).toBeVisible();
  const editor = app.getByRole('textbox', { name: 'À une personne de confiance' });
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart))
    .toBe(PRACTICE_SCENARIOS[1].starter.length);
});

test('les nouvelles photos, l’atelier et la fiche sont accessibles hors ligne à froid', async ({ app, context }) => {
  await app.goto('/');
  await app.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await app.goto('/temoignages/7');
  await expect(app.getByRole('heading', { name: 'Quand les moqueries visent ton accent' })).toBeVisible();
  await expect.poll(() => app.locator('img[src$="/samir.webp"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await app.goto('/entrainement/groupe-de-classe');
  await expect(app.getByRole('heading', { name: 'Dans le groupe de classe' })).toBeVisible();
  await expect.poll(() => app.locator('img[src$="/ines.webp"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await app.getByRole('group', { name: 'Que ferais-tu ?' }).getByRole('button').first().click();
  await app.getByRole('button', { name: 'Lire la fiche pratique' }).click();
  await expect(app.getByRole('heading', { name: 'Je suis témoin : comment aider ?' })).toBeVisible();
});
