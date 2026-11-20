import {
  VaultSession,
  decryptFile,
  decryptJson,
  deleteRecords,
  encryptFile,
  encryptJson,
  getRecord,
  listRecords,
  putRecord,
} from '../../lib/vault';

/**
 * Carnet personnel : logique métier (sans interface).
 * Chaque entrée et chaque pièce jointe est chiffrée dans le coffre (lib/vault).
 */

export type IncidentKind = 'verbal' | 'physique' | 'cyber' | 'exclusion' | 'sexuel' | 'ressenti' | 'autre';

export const INCIDENT_KINDS: Record<IncidentKind, string> = {
  verbal: 'Insultes / moqueries',
  physique: 'Violence physique',
  cyber: 'En ligne / messages',
  exclusion: 'Mise à l’écart / rumeurs',
  sexuel: 'Propos ou gestes sexuels',
  ressenti: 'Ce que je ressens',
  autre: 'Autre',
};

export interface CarnetAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface CarnetEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Date et heure des faits, heure locale « AAAA-MM-JJTHH:MM » */
  occurredAt: string;
  kind: IncidentKind;
  title: string;
  place: string;
  description: string;
  people: string;
  witnesses: string;
  tags: string[];
  attachments: CarnetAttachment[];
}

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export function nowLocalInput(d = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function newEntry(): CarnetEntry {
  const now = new Date().toISOString();
  return {
    id: `e_${globalThis.crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    occurredAt: nowLocalInput(),
    kind: 'verbal',
    title: '',
    place: '',
    description: '',
    people: '',
    witnesses: '',
    tags: [],
    attachments: [],
  };
}

export const isEntryEmpty = (e: CarnetEntry) =>
  !e.title.trim() && !e.description.trim() && !e.place.trim() && !e.people.trim() && !e.witnesses.trim() && e.attachments.length === 0;

/* ------------------------------ Lecture / écriture ------------------------------ */

export async function listEntries(session: VaultSession): Promise<CarnetEntry[]> {
  const records = await listRecords('records');
  const entries = await Promise.all(records.map((r) => decryptJson<CarnetEntry>(session, r.payload)));
  return sortEntries(entries, 'recent');
}

export async function saveEntry(session: VaultSession, entry: CarnetEntry): Promise<CarnetEntry> {
  const saved = { ...entry, updatedAt: new Date().toISOString() };
  await putRecord('records', { id: saved.id, payload: await encryptJson(session, saved) });
  return saved;
}

export async function deleteEntry(entry: CarnetEntry) {
  await deleteRecords('files', entry.attachments.map((a) => a.id));
  await deleteRecords('records', [entry.id]);
}

export async function addAttachment(session: VaultSession, entryId: string, file: Blob, name: string): Promise<CarnetAttachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('Fichier trop volumineux (8 Mo maximum).');
  const id = `f_${globalThis.crypto.randomUUID()}`;
  const meta: CarnetAttachment = { id, name: name.slice(0, 120) || 'piece-jointe', type: file.type || 'application/octet-stream', size: file.size };
  await putRecord('files', { id, parentId: entryId, payload: await encryptFile(session, await file.arrayBuffer()) });
  return meta;
}

export async function readAttachment(session: VaultSession, att: CarnetAttachment): Promise<Blob | null> {
  const rec = await getRecord('files', att.id);
  if (!rec) return null;
  return new Blob([await decryptFile(session, rec.payload)], { type: att.type });
}

export const removeAttachment = (att: CarnetAttachment) => deleteRecords('files', [att.id]);

/* ------------------------------ Recherche / classement ------------------------------ */

export type SortOrder = 'recent' | 'ancien';

export function sortEntries(entries: CarnetEntry[], order: SortOrder): CarnetEntry[] {
  const sorted = [...entries].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.updatedAt.localeCompare(a.updatedAt));
  return order === 'recent' ? sorted : sorted.reverse();
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export interface EntryFilter {
  query?: string;
  kind?: IncidentKind | 'all';
  tag?: string | null;
}

export function filterEntries(entries: CarnetEntry[], { query = '', kind = 'all', tag = null }: EntryFilter): CarnetEntry[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (kind !== 'all' && e.kind !== kind) return false;
    if (tag && !e.tags.includes(tag)) return false;
    if (!terms.length) return true;
    const hay = fold([e.title, e.description, e.place, e.people, e.witnesses, e.tags.join(' '), INCIDENT_KINDS[e.kind]].join(' '));
    return terms.every((t) => hay.includes(t));
  });
}

export function allTags(entries: CarnetEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function parseTags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[,#]/)
        .map((t) => t.trim().toLowerCase().slice(0, 30))
        .filter(Boolean)
    ),
  ].slice(0, 12);
}

export function formatOccurredAt(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
}

/* ------------------------------ Migration des anciens journaux (en clair) ------------------------------ */

const LEGACY_LS_KEY = 'mbt_private_journal_v1';
const LEGACY_IDB = 'mbt';

interface LegacyLsEntry {
  id?: string;
  date?: string;
  place?: string;
  witnesses?: string;
  details?: string;
}

interface LegacyIdbEntry {
  id: string;
  createdAt?: string;
  occurredAt?: string;
  kind?: string;
  place?: string;
  description?: string;
  people?: string;
  witnesses?: string;
  photoIds?: string[];
}

/** « 20/11/2026 14:32 » → « 2026-11-20T14:32 » */
export function parseFrenchDateTime(s: string | undefined): string | null {
  const m = s?.match(/(\d{2})\/(\d{2})\/(\d{4})\D+(\d{2}):(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}` : null;
}

export function convertLegacyLs(old: LegacyLsEntry): CarnetEntry {
  const base = newEntry();
  const keep = (v?: string, placeholder?: string) => (v && v !== placeholder ? v : '');
  return {
    ...base,
    occurredAt: parseFrenchDateTime(old.date) ?? base.occurredAt,
    kind: 'autre',
    place: keep(old.place, 'Non précisé'),
    witnesses: keep(old.witnesses, 'Aucun précisé'),
    description: old.details ?? '',
    tags: ['importé'],
  };
}

function readLegacyLs(): LegacyLsEntry[] {
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readLegacyIdb(): Promise<{ entries: LegacyIdbEntry[]; photos: Map<string, { blob: Blob; name: string }> } | null> {
  if (typeof indexedDB === 'undefined' || !('databases' in indexedDB)) return null;
  const dbs = await indexedDB.databases();
  if (!dbs.some((d) => d.name === LEGACY_IDB)) return null;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(LEGACY_IDB);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  try {
    if (!db.objectStoreNames.contains('entries')) return null;
    const getAll = <T,>(store: string) =>
      new Promise<T[]>((resolve, reject) => {
        if (!db.objectStoreNames.contains(store)) return resolve([]);
        const r = db.transaction(store).objectStore(store).getAll();
        r.onsuccess = () => resolve(r.result as T[]);
        r.onerror = () => reject(r.error);
      });
    const entries = await getAll<LegacyIdbEntry>('entries');
    const photos = new Map((await getAll<{ id: string; blob: Blob; name: string }>('photos')).map((p) => [p.id, p]));
    return { entries, photos };
  } finally {
    db.close();
  }
}

/** Nombre d'anciennes notes en clair présentes sur l'appareil. */
export async function countLegacyEntries(): Promise<number> {
  const idb = await readLegacyIdb().catch(() => null);
  return readLegacyLs().length + (idb?.entries.length ?? 0);
}

/**
 * Chiffre les anciennes notes dans le coffre, vérifie leur relecture, PUIS supprime les copies en clair.
 * En cas d'erreur, les anciennes données sont conservées intactes.
 */
export async function migrateLegacy(session: VaultSession): Promise<number> {
  const migrated: CarnetEntry[] = [];

  for (const old of readLegacyLs()) migrated.push(convertLegacyLs(old));

  const idb = await readLegacyIdb().catch(() => null);
  for (const old of idb?.entries ?? []) {
    const entry: CarnetEntry = {
      ...newEntry(),
      occurredAt: old.occurredAt ?? nowLocalInput(),
      createdAt: old.createdAt ?? new Date().toISOString(),
      kind: (old.kind && old.kind in INCIDENT_KINDS ? old.kind : 'autre') as IncidentKind,
      place: old.place ?? '',
      description: old.description ?? '',
      people: old.people ?? '',
      witnesses: old.witnesses ?? '',
      tags: ['importé'],
    };
    for (const pid of old.photoIds ?? []) {
      const p = idb?.photos.get(pid);
      if (p) entry.attachments.push(await addAttachment(session, entry.id, p.blob, p.name));
    }
    migrated.push(entry);
  }

  if (!migrated.length) return 0;
  for (const e of migrated) await saveEntry(session, e);

  // Vérification : chaque note doit être relisible avant toute suppression
  const check = await listEntries(session);
  const ok = migrated.every((m) => check.some((c) => c.id === m.id && c.description === m.description));
  if (!ok) throw new Error('Vérification de la migration impossible : anciennes notes conservées.');

  try {
    localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    // ignore
  }
  if (idb) {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(LEGACY_IDB);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }
  return migrated.length;
}

/* ------------------------------ Export (rapport HTML imprimable) ------------------------------ */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export async function buildReport(session: VaultSession, entries: CarnetEntry[]): Promise<File> {
  const sorted = sortEntries(entries, 'ancien');
  const sections: string[] = [];
  for (const [i, e] of sorted.entries()) {
    const media: string[] = [];
    for (const a of e.attachments) {
      const blob = await readAttachment(session, a);
      if (blob && a.type.startsWith('image/')) media.push(`<img src="${await blobToDataUrl(blob)}" alt="${escapeHtml(a.name)}">`);
      else media.push(`<p class="meta">Pièce jointe : ${escapeHtml(a.name)} (non incluse)</p>`);
    }
    const row = (label: string, v: string) =>
      v.trim() ? `<p><strong>${label} :</strong> ${escapeHtml(v).replace(/\n/g, '<br>')}</p>` : '';
    sections.push(`<section>
<h2>Fait n°${i + 1} — ${escapeHtml(formatOccurredAt(e.occurredAt))}</h2>
${row('Titre', e.title)}${row('Type', INCIDENT_KINDS[e.kind])}${row('Lieu', e.place)}${row('Ce qui s’est passé', e.description)}${row('Auteur(s)', e.people)}${row('Témoin(s)', e.witnesses)}${row('Étiquettes', e.tags.join(', '))}
${media.length ? `<div class="photos">${media.join('')}</div>` : ''}
<p class="meta">Noté le ${escapeHtml(new Date(e.createdAt).toLocaleString('fr-FR'))} · modifié le ${escapeHtml(new Date(e.updatedAt).toLocaleString('fr-FR'))}</p>
</section>`);
  }
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Carnet — faits consignés</title><style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1d1b20;line-height:1.5}
h1{font-size:22px}section{border:2px solid #7174AA;border-radius:16px;padding:12px 18px;margin:18px 0;break-inside:avoid}
h2{font-size:16px;color:#7174AA}p{margin:6px 0;font-size:14px}.photos{display:flex;flex-wrap:wrap;gap:8px}
.photos img{max-width:100%;max-height:420px;border-radius:8px;border:1px solid #ddd}.meta{color:#888;font-size:12px}
</style></head><body><h1>Carnet — faits consignés</h1>
<p class="meta">${sorted.length} entrée(s). Exporté le ${escapeHtml(new Date().toLocaleString('fr-FR'))} depuis l’application MBT. Document non chiffré : à conserver en lieu sûr.</p>
${sections.join('\n')}</body></html>`;
  return new File([html], `carnet-mbt-${new Date().toISOString().slice(0, 10)}.html`, { type: 'text/html' });
}
