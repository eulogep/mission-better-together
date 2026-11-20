import { test, expect } from './fixtures';

const PIN = 'nuage violet 42';

async function createCarnet(page: import('@playwright/test').Page) {
  await page.goto('/carnet');
  await page.getByLabel(/Choisis un code/).fill(PIN);
  await page.getByLabel('Confirme le code').fill(PIN);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Protéger mon carnet' }).click();
  await expect(page.getByRole('heading', { name: 'Mon carnet' })).toBeVisible({ timeout: 15_000 });
}

test.describe('Carnet protégé', () => {
  test('écrire (enregistrement auto), verrouiller, déverrouiller, rechercher', async ({ app }) => {
    await createCarnet(app);
    await app.getByRole('button', { name: /NOUVELLE NOTE/ }).click();
    await app.getByPlaceholder('Ex : À la cantine').fill('Cantine');
    await app.getByPlaceholder(/Décris les faits/).fill('Ils ont renversé mon plateau en riant.');
    await app.getByPlaceholder('Qui a vu ou entendu ?').fill('Inès');
    await expect(app.getByText(/Enregistré et chiffré/)).toBeVisible({ timeout: 5000 });
    await app.getByRole('button', { name: 'Terminé' }).click();
    await expect(app.getByText('Ils ont renversé mon plateau en riant.')).toBeVisible();

    // Recherche
    await app.getByLabel('Rechercher dans mes notes').fill('plateau');
    await expect(app.getByText(/renversé mon plateau/)).toBeVisible();
    await app.getByLabel('Rechercher dans mes notes').fill('introuvable');
    await expect(app.getByText('Aucune note ne correspond à ta recherche.')).toBeVisible();

    // Verrouillage + mauvais code + bon code
    await app.getByRole('button', { name: 'Verrouiller' }).click();
    await expect(app.getByRole('heading', { name: 'Carnet verrouillé' })).toBeVisible();
    await app.getByLabel('Code').fill('mauvais code');
    await app.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(app.getByText('Code incorrect.')).toBeVisible();
    await app.getByLabel('Code').fill(PIN);
    await app.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(app.getByText('Ils ont renversé mon plateau en riant.')).toBeVisible();

    // Persistance après fermeture / réouverture : verrouillé, puis lisible avec le code
    await app.reload();
    await expect(app.getByRole('heading', { name: 'Carnet verrouillé' })).toBeVisible();
    await app.getByLabel('Code').fill(PIN);
    await app.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(app.getByText('Ils ont renversé mon plateau en riant.')).toBeVisible();
  });

  test('aucun texte du carnet n’est stocké en clair dans le navigateur', async ({ app }) => {
    await createCarnet(app);
    await app.getByRole('button', { name: /NOUVELLE NOTE/ }).click();
    await app.getByPlaceholder(/Décris les faits/).fill('SECRET-ABC-123 dans le couloir');
    await expect(app.getByText(/Enregistré et chiffré/)).toBeVisible({ timeout: 5000 });

    const leaks = await app.evaluate(async () => {
      const found: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if ((localStorage.getItem(k) ?? '').includes('SECRET-ABC')) found.push(`localStorage:${k}`);
      }
      const db = await new Promise<IDBDatabase>((res, rej) => {
        const r = indexedDB.open('mbt-vault');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      const all = await new Promise<{ payload: { data: ArrayBuffer } }[]>((res) => {
        const r = db.transaction('records').objectStore('records').getAll();
        r.onsuccess = () => res(r.result);
      });
      for (const rec of all) {
        if (new TextDecoder().decode(new Uint8Array(rec.payload.data)).includes('SECRET-ABC')) found.push('indexedDB');
      }
      db.close();
      return { found, count: all.length };
    });
    expect(leaks.count).toBe(1);
    expect(leaks.found).toEqual([]);
  });

  test('migre une ancienne note en clair puis la supprime', async ({ app }) => {
    await app.goto('/');
    await app.evaluate(() =>
      localStorage.setItem(
        'mbt_private_journal_v1',
        JSON.stringify([{ id: 'log_1', date: '05/11/2026 10:30', place: 'Bus', witnesses: 'Aucun précisé', details: 'Ancienne note à migrer' }])
      )
    );
    await app.goto('/carnet');
    await expect(app.getByText(/1 note\(s\) déjà écrite\(s\)/)).toBeVisible();
    await createCarnet(app);
    await expect(app.getByText('Ancienne note à migrer')).toBeVisible();
    expect(await app.evaluate(() => localStorage.getItem('mbt_private_journal_v1'))).toBeNull();
  });

  test('lâcher prise : rien n’est enregistré', async ({ app }) => {
    await createCarnet(app);
    await app.getByRole('tab', { name: 'Lâcher prise' }).click();
    await app.getByPlaceholder('Ce que je ressens maintenant…').fill('Je suis en colère');
    await app.getByRole('button', { name: 'Laisser partir' }).click();
    await expect(app.getByText(/C’est parti/)).toBeVisible();
    await app.getByRole('tab', { name: 'Mes notes' }).click();
    await expect(app.getByText('Aucune note pour l’instant.')).toBeVisible();
  });
});
