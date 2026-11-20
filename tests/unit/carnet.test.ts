import { afterEach, describe, expect, it } from 'vitest';
import { createVault, destroyVault, listRecords } from '../../src/lib/vault';
import {
  addAttachment,
  buildReport,
  convertLegacyLs,
  countLegacyEntries,
  deleteEntry,
  filterEntries,
  isEntryEmpty,
  listEntries,
  migrateLegacy,
  newEntry,
  parseFrenchDateTime,
  parseTags,
  readAttachment,
  saveEntry,
  sortEntries,
} from '../../src/features/carnet/carnetStore';

afterEach(async () => {
  await destroyVault();
});

describe('carnet — logique pure', () => {
  it('analyse les étiquettes', () => {
    expect(parseTags('École, #snap,école , bus')).toEqual(['école', 'snap', 'bus']);
    expect(parseTags('')).toEqual([]);
  });

  it('convertit une date française', () => {
    expect(parseFrenchDateTime('20/11/2026 14:32')).toBe('2026-11-20T14:32');
    expect(parseFrenchDateTime('20/11/2026, 09:05')).toBe('2026-11-20T09:05');
    expect(parseFrenchDateTime('n’importe quoi')).toBeNull();
  });

  it('filtre par texte (sans accents), type et étiquette', () => {
    const a = { ...newEntry(), description: 'Moqueries à la récré', kind: 'verbal' as const, tags: ['école'] };
    const b = { ...newEntry(), description: 'Messages sur Snapchat', kind: 'cyber' as const, tags: ['snap'] };
    expect(filterEntries([a, b], { query: 'recre' })).toEqual([a]);
    expect(filterEntries([a, b], { kind: 'cyber' })).toEqual([b]);
    expect(filterEntries([a, b], { tag: 'école' })).toEqual([a]);
    expect(filterEntries([a, b], { query: 'snapchat messages' })).toEqual([b]);
  });

  it('trie par date des faits', () => {
    const old = { ...newEntry(), occurredAt: '2026-01-01T10:00' };
    const recent = { ...newEntry(), occurredAt: '2026-11-01T10:00' };
    expect(sortEntries([old, recent], 'recent')[0]).toBe(recent);
    expect(sortEntries([old, recent], 'ancien')[0]).toBe(old);
  });

  it('détecte une entrée vide', () => {
    expect(isEntryEmpty(newEntry())).toBe(true);
    expect(isEntryEmpty({ ...newEntry(), description: 'x' })).toBe(false);
  });

  it('convertit une ancienne note en clair sans garder les valeurs par défaut', () => {
    const e = convertLegacyLs({ date: '02/03/2026 08:15', place: 'Non précisé', witnesses: 'Léa', details: 'Bousculade' });
    expect(e.occurredAt).toBe('2026-03-02T08:15');
    expect(e.place).toBe('');
    expect(e.witnesses).toBe('Léa');
    expect(e.description).toBe('Bousculade');
    expect(e.tags).toContain('importé');
  });
});

describe('carnet — stockage chiffré', () => {
  it('enregistre, relit et supprime une entrée avec pièce jointe chiffrée', async () => {
    const session = await createVault('code-de-test-1');
    const entry = { ...newEntry(), description: 'Insultes dans le bus', tags: ['bus'] };
    const att = await addAttachment(session, entry.id, new Blob(['capture'], { type: 'image/png' }), 'capture.png');
    await saveEntry(session, { ...entry, attachments: [att] });

    const [read] = await listEntries(session);
    expect(read.description).toBe('Insultes dans le bus');
    const blob = await readAttachment(session, read.attachments[0]);
    expect(await blob!.text()).toBe('capture');

    // La pièce jointe est chiffrée au repos
    const [file] = await listRecords('files');
    expect(new TextDecoder().decode(new Uint8Array(file.payload.data))).not.toContain('capture');

    await deleteEntry(read);
    expect(await listEntries(session)).toEqual([]);
    expect(await listRecords('files')).toEqual([]);
  });

  it('migre les anciennes notes en clair puis les supprime', async () => {
    localStorage.setItem(
      'mbt_private_journal_v1',
      JSON.stringify([{ id: 'log_1', date: '10/10/2026 12:00', place: 'Cantine', witnesses: 'Aucun précisé', details: 'On m’a pris mon plateau' }])
    );
    expect(await countLegacyEntries()).toBe(1);
    const session = await createVault('code-de-test-2');
    expect(await migrateLegacy(session)).toBe(1);
    const [e] = await listEntries(session);
    expect(e.description).toBe('On m’a pris mon plateau');
    expect(e.place).toBe('Cantine');
    expect(localStorage.getItem('mbt_private_journal_v1')).toBeNull();
  });

  it('produit un rapport d’export lisible', async () => {
    const session = await createVault('code-de-test-3');
    const e = await saveEntry(session, { ...newEntry(), title: 'Récré', description: 'Moqueries <script>', witnesses: 'Sami' });
    const file = await buildReport(session, [e]);
    const html = await file.text();
    expect(file.name).toMatch(/^carnet-mbt-\d{4}-\d{2}-\d{2}\.html$/);
    expect(html).toContain('Moqueries &lt;script&gt;'); // contenu échappé
    expect(html).toContain('Sami');
    expect(html).toContain('non chiffré');
  });
});
