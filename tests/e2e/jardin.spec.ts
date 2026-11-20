import { test, expect } from './fixtures';

test('la météo de l’accueil et l’arbre partagent le ressenti choisi', async ({ app }) => {
  await app.goto('/');
  await app.getByRole('radio', { name: 'Pas top', exact: true }).click();
  const sheet = app.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Voir mon arbre intérieur' }).click();
  await expect(app).toHaveURL(/\/jardin$/);
  const scene = app.getByRole('figure', { name: 'L’arbre du jardin' });
  await expect(scene).toHaveAttribute('data-weather', 'pluie');
  await expect(app.getByRole('radio', { name: 'Pas top', exact: true })).toBeChecked();

  await app.getByText('Super', { exact: true }).click();
  await expect(scene).toHaveAttribute('data-weather', 'soleil');
  await app.reload();
  await expect(scene).toHaveAttribute('data-weather', 'soleil');
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(app.getByRole('radio', { name: 'Super', exact: true })).toBeChecked();
  await expect(app.getByRole('dialog')).toHaveCount(0);
});

test('les quatre humeurs changent le ciel et le feuillage, à taille stable', async ({ app, context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('mbt_jardin_v1', JSON.stringify({ counts: { pause: 60, parole: 10 }, last: 'pause' }));
  });
  await app.goto('/jardin');
  const scene = app.getByRole('figure', { name: 'L’arbre du jardin' });
  const tree = scene.getByRole('img');
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
  await expect(app.getByRole('radio', { checked: true })).toHaveCount(0);
  const dimensions = () => scene.evaluate((element: HTMLElement) => [element.offsetWidth, element.offsetHeight, element.offsetTop]);
  const initialDimensions = await dimensions();

  const skies = new Set<string>();
  for (const [choice, weather, filename] of [
    ['Super', 'soleil', 'floraison'],
    ['Bof', 'nuage', 'ramure'],
    ['Pas top', 'pluie', 'pluie'],
    ['Très mal', 'orage', 'orage'],
  ]) {
    await app.getByRole('radio', { name: choice, exact: true }).press('Space');
    await expect(scene).toHaveAttribute('data-weather', weather);
    await expect(tree).toHaveAttribute('src', `/assets/jardin/${filename}.webp`);
    await expect.poll(() => tree.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    expect(await dimensions()).toEqual(initialDimensions);
    skies.add(await scene.evaluate((element) => getComputedStyle(element).backgroundImage));
  }
  expect(skies.size).toBe(4);
  await app.getByRole('button', { name: 'Trouver du soutien' }).click();
  await expect(app).toHaveURL(/\/specialistes$/);
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(scene).toHaveAttribute('data-weather', 'orage');
});

test('le choix peut être effacé et le mode discret efface aussi le ressenti', async ({ app, context }) => {
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('jardin_test_initialized')) {
      sessionStorage.setItem('mbt_mood_v1', 'ancienne-valeur-inconnue');
      sessionStorage.setItem('jardin_test_initialized', '1');
    }
  });
  await app.goto('/jardin');
  const scene = app.getByRole('figure', { name: 'L’arbre du jardin' });
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
  await app.getByText('Bof', { exact: true }).click();
  await expect(scene).toHaveAttribute('data-weather', 'nuage');
  await app.getByRole('button', { name: 'Effacer mon humeur' }).click();
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
  await app.reload();
  await expect(app.getByRole('radio', { checked: true })).toHaveCount(0);
  await app.getByText('Pas top', { exact: true }).click();
  await app.getByRole('button', { name: 'Mode discret' }).click();
  await app.getByRole('button', { name: 'Revenir à MBT' }).click();
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
  expect(await app.evaluate(() => sessionStorage.getItem('mbt_mood_v1'))).toBeNull();
});

test('la météo et la pause fonctionnent hors ligne avec mouvement réduit', async ({ app, context }) => {
  await app.emulateMedia({ reducedMotion: 'reduce' });
  await app.goto('/');
  await app.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await app.goto('/serenite');
  await app.getByRole('button', { name: 'Voir mon arbre intérieur' }).click();
  const scene = app.getByRole('figure', { name: 'L’arbre du jardin' });
  await app.getByText('Très mal', { exact: true }).click();
  await expect(scene).toHaveAttribute('data-weather', 'orage');
  const tree = scene.getByRole('img');
  await expect.poll(() => tree.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(tree).toHaveCSS('transform', 'none');

  await app.getByRole('button', { name: 'Observer mon arbre' }).click();
  await expect(app.getByRole('heading', { name: 'Une pause au jardin' })).toBeVisible();
  const initialBackground = await scene.evaluate((element) => getComputedStyle(element).backgroundImage);
  await app.getByRole('button', { name: 'Crépuscule' }).click();
  expect(await scene.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe(initialBackground);
  await expect(scene).toHaveAttribute('data-weather', 'orage');
  await app.getByRole('button', { name: 'Revenir à mon arbre' }).click();
  await expect(app.getByRole('radio', { name: 'Très mal', exact: true })).toBeChecked();
  const assetTypes = await app.evaluate(async () => {
    const paths = ['ramure', 'floraison', 'pluie', 'orage'];
    return Promise.all(paths.map(async (weather) => (await caches.match(`/assets/jardin/${weather}.webp`))?.headers.get('Content-Type')));
  });
  expect(assetTypes).toEqual(Array(4).fill('image/webp'));
});

test('le ressenti détaillé combine valence et activation hors ligne', async ({ app, context }) => {
  await app.goto('/');
  await app.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await app.goto('/jardin');
  const scene = app.getByRole('figure', { name: 'L’arbre du jardin' });
  const apply = app.getByRole('button', { name: 'Appliquer à mon arbre' });
  await app.getByRole('button', { name: 'Préciser mon ressenti' }).click();
  await expect(apply).toBeDisabled();
  await app.getByLabel('Ton ressenti est plutôt…').selectOption({ label: 'Plutôt désagréable' });
  await expect(apply).toBeDisabled();
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
  await app.getByLabel('Tu te sens calme ou animé·e ?').selectOption({ label: 'Très calme' });
  await apply.click();
  await expect(scene).toHaveAttribute('data-weather', 'pluie');
  await expect(scene).toHaveAttribute('data-breeze', '0');
  await expect(app.getByText('Plutôt désagréable · Très calme')).toBeVisible();

  await app.getByRole('button', { name: 'Ajuster mon ressenti' }).click();
  await expect(app.getByLabel('Ton ressenti est plutôt…')).toHaveValue('-1');
  await app.getByLabel('Tu te sens calme ou animé·e ?').selectOption({ label: 'Très animé' });
  await apply.click();
  await expect(scene).toHaveAttribute('data-weather', 'orage');
  await expect(scene).toHaveAttribute('data-breeze', '4');
  await expect(app.getByRole('radio', { name: 'Très mal' })).not.toBeChecked();

  await app.getByRole('button', { name: 'Ajuster mon ressenti' }).click();
  await app.getByLabel('Ton ressenti est plutôt…').selectOption({ label: 'À la fois agréable et désagréable' });
  await apply.click();
  await expect(scene).toHaveAttribute('data-weather', 'melange');
  await expect(scene.getByText('Entre pluie et éclaircies')).toBeVisible();
  await app.reload();
  await expect(scene).toHaveAttribute('data-weather', 'melange');
  await app.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(app.getByText('Ton ressenti détaillé', { exact: true })).toBeVisible();
  await app.getByRole('button', { name: /Mon arbre intérieur/ }).click();
  await app.getByRole('button', { name: 'Mode discret' }).click();
  await app.getByRole('button', { name: 'Revenir à MBT' }).click();
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
});

test('la grille du ressenti fonctionne au clavier et au pointeur', async ({ app }) => {
  await app.goto('/jardin');
  const edit = app.getByRole('button', { name: 'Préciser mon ressenti' });
  await edit.click();
  const grid = app.getByRole('radiogroup', { name: 'Place ton ressenti' });
  await expect(grid.getByRole('radio')).toHaveCount(25);
  await expect(grid.getByRole('radio', { checked: true })).toHaveCount(0);
  await edit.press('Tab');
  const centre = grid.getByRole('radio', { name: 'Ni agréable ni désagréable · Entre calme et animé' });
  await expect(centre).toBeFocused();
  await centre.press('ArrowLeft');
  const left = grid.getByRole('radio', { name: 'Plutôt désagréable · Entre calme et animé' });
  await expect(left).toBeFocused();
  await expect(left).toBeChecked();
  await left.press('ArrowUp');
  await expect(grid.getByRole('radio', { name: 'Plutôt désagréable · Plutôt animé' })).toBeChecked();
  await expect(app.getByLabel('Ton ressenti est plutôt…')).toHaveValue('-1');
  await expect(app.getByLabel('Tu te sens calme ou animé·e ?')).toHaveValue('1');

  const scene = app.getByRole('figure', { name: 'L’arbre du jardin' });
  await expect(scene).toHaveAttribute('data-weather', 'neutre');
  const warm = grid.getByRole('radio', { name: 'Très agréable · Très calme' });
  await warm.click();
  await expect(warm).toBeChecked();
  await app.getByRole('button', { name: 'Appliquer à mon arbre' }).click();
  await expect(scene).toHaveAttribute('data-weather', 'soleil');
  await expect(scene).toHaveAttribute('data-breeze', '0');
  await app.getByRole('button', { name: 'Ajuster mon ressenti' }).click();
  await expect(warm).toBeChecked();
  await app.getByLabel('Ton ressenti est plutôt…').selectOption('melange');
  await expect(grid.getByRole('radio', { checked: true })).toHaveCount(0);
});
