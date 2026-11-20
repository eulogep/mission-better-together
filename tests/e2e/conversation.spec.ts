import { test, expect } from './fixtures';

test('préparer, répéter et montrer les mêmes mots', async ({ app, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await app.goto('/');
  await app.getByRole('button', { name: /Préparer une conversation/ }).click();
  await expect(app).toHaveURL(/\/preparer-conversation$/);

  await app.getByRole('radio', { name: 'Je l’ai vu' }).check();
  await app.getByRole('radio', { name: 'Un adulte de l’établissement' }).check();
  await app.getByRole('radio', { name: 'Demander un rendez-vous' }).check();
  await app.getByRole('textbox', { name: 'Ce que tu veux expliquer' }).fill('  Des moqueries ont recommencé mardi dans la cour.  ');
  await app.getByRole('button', { name: 'Voir mon brouillon' }).click();
  const editor = app.getByRole('textbox', { name: 'Tes mots' });
  await expect(editor).toHaveValue([
    'Bonjour, est-ce que vous auriez un moment pour me parler en privé ?',
    'J’ai été témoin d’une situation qui m’inquiète.',
    'Des moqueries ont recommencé mardi dans la cour.',
    'Pourrions-nous convenir d’un rendez-vous pour en discuter et voir quelles suites sont possibles ?',
  ].join('\n\n'));

  const draft = ['Bonjour, j’aimerais vous parler.', 'Est-ce qu’on peut prévoir un moment en privé ?'].join('\n\n');
  await editor.fill(draft);
  await app.getByRole('button', { name: 'Répéter par étapes' }).click();
  await expect(app.getByText('Partie 1 sur 2')).toBeVisible();
  await expect(app.getByText('Bonjour, j’aimerais vous parler.')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Précédente' })).toBeDisabled();
  await app.getByRole('button', { name: 'Suivante' }).click();
  await expect(app.getByText('Partie 2 sur 2')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Suivante' })).toBeDisabled();
  await app.getByRole('button', { name: 'Revenir au brouillon' }).click();

  await app.getByRole('button', { name: 'Afficher en grand' }).click();
  await expect(app.getByRole('heading', { name: 'Carte à montrer' })).toBeFocused();
  await expect(app.getByText(draft, { exact: true })).toBeVisible();
  await expect(editor).toHaveCount(0);
  await app.getByRole('button', { name: 'Quitter le grand affichage' }).click();
  await expect(editor).toHaveValue(draft);
  await app.getByRole('button', { name: 'Copier le texte' }).click();
  await expect(app.getByRole('status').filter({ hasText: 'Texte copié.' })).toBeVisible();
  expect(await app.evaluate(() => navigator.clipboard.readText())).toBe(draft);

  await app.getByRole('button', { name: 'Revenir aux choix' }).click();
  await app.getByRole('button', { name: 'Reprendre mon brouillon' }).click();
  await expect(editor).toHaveValue(draft);

  await app.getByRole('button', { name: 'Revenir aux choix' }).click();
  await app.getByRole('radio', { name: 'Une personne proche' }).check();
  await app.getByRole('button', { name: 'Créer un nouveau brouillon' }).click();
  await expect(editor).toHaveValue(/^Est-ce qu’on peut prendre un moment/);
});

test('la préparation hors ligne efface les mots lors du passage en mode discret', async ({ app, context }) => {
  await app.goto('/');
  await app.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await app.goto('/entrainement');
  await app.getByRole('button', { name: 'Préparer une conversation' }).click();
  await app.getByRole('radio', { name: 'Je suis parent' }).check();
  const fact = 'Fait fictif privé hors ligne.';
  await app.getByRole('textbox', { name: 'Ce que tu veux expliquer' }).fill(fact);
  await app.getByRole('button', { name: 'Voir mon brouillon' }).click();
  await expect(app.getByRole('textbox', { name: 'Tes mots' })).toHaveValue(new RegExp(`mon enfant.*${fact}`, 's'));
  await app.getByRole('button', { name: 'Afficher en grand' }).click();
  expect(await app.evaluate((marker) => {
    return [location.href, JSON.stringify(history.state), JSON.stringify(localStorage), JSON.stringify(sessionStorage)]
      .some((value) => value.includes(marker));
  }, fact)).toBe(false);

  await app.getByRole('button', { name: 'Mode discret' }).click();
  await expect(app.getByText(fact, { exact: false })).toHaveCount(0);
  await app.getByRole('button', { name: 'Revenir à MBT' }).click();
  await expect(app.getByRole('heading', { name: 'Préparer une conversation' })).toBeVisible();
  await expect(app.getByRole('textbox', { name: 'Ce que tu veux expliquer' })).toHaveValue('');
  await expect(app.getByRole('radio', { name: 'Je le vis' })).toBeChecked();
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(app).toHaveURL(/\/entrainement$/);
});
