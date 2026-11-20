import { isTouchDevice } from './device';

/**
 * Journal de preuves : faits datés + captures d'écran, stockés uniquement sur l'appareil
 * (IndexedDB). Rien n'est envoyé sur internet ; l'utilisateur exporte lui-même un rapport.
 */

export type IncidentKind = 'verbal' | 'physique' | 'cyber' | 'exclusion' | 'sexuel' | 'autre';

export const INCIDENT_KINDS: Record<IncidentKind, string> = {
  verbal: 'Insultes / moqueries',
  physique: 'Violence physique',
  cyber: 'En ligne / messages',
  exclusion: 'Mise à l’écart / rumeurs',
  sexuel: 'Propos ou gestes sexuels',
  autre: 'Autre',
};

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  occurredAt: string; // « AAAA-MM-JJTHH:MM » (heure locale saisie)
  kind: IncidentKind;
  place: string;
  description: string;
  people: string; // auteur(s)
  witnesses: string;
  photoIds: string[];
}

export interface JournalPhoto {
  id: string;
  entryId: string;
  blob: Blob;
  name: string;
}

const DB_NAME = 'mbt';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Stockage indisponible sur cet appareil'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', { keyPath: 'id' });
        store.createIndex('entryId', 'entryId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listEntries(): Promise<JournalEntry[]> {
  const db = await openDb();
  const all = await promisify(db.transaction('entries').objectStore('entries').getAll());
  return (all as JournalEntry[]).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export async function saveEntry(entry: JournalEntry, newPhotos: { blob: Blob; name: string }[] = []) {
  const db = await openDb();
  const tx = db.transaction(['entries', 'photos'], 'readwrite');
  const photos = tx.objectStore('photos');
  const ids = [...entry.photoIds];
  for (const p of newPhotos) {
    const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    photos.put({ id, entryId: entry.id, blob: p.blob, name: p.name } satisfies JournalPhoto);
    ids.push(id);
  }
  tx.objectStore('entries').put({ ...entry, photoIds: ids });
  await txDone(tx);
}

export async function deleteEntry(entry: JournalEntry) {
  const db = await openDb();
  const tx = db.transaction(['entries', 'photos'], 'readwrite');
  tx.objectStore('entries').delete(entry.id);
  for (const id of entry.photoIds) tx.objectStore('photos').delete(id);
  await txDone(tx);
}

export async function deletePhoto(entry: JournalEntry, photoId: string) {
  const db = await openDb();
  const tx = db.transaction(['entries', 'photos'], 'readwrite');
  tx.objectStore('photos').delete(photoId);
  tx.objectStore('entries').put({ ...entry, photoIds: entry.photoIds.filter((id) => id !== photoId) });
  await txDone(tx);
}

export async function getPhotos(ids: string[]): Promise<JournalPhoto[]> {
  if (!ids.length) return [];
  const db = await openDb();
  const store = db.transaction('photos').objectStore('photos');
  const photos = await Promise.all(ids.map((id) => promisify(store.get(id))));
  return photos.filter(Boolean) as JournalPhoto[];
}

/** Réduit une image (captures d'écran, photos) pour limiter la place occupée. */
export async function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/* ------------------------------------------------------------------ */
/* Export : rapport HTML autonome (imprimable en PDF, envoyable)       */
/* ------------------------------------------------------------------ */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export function formatOccurredAt(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
}

export async function buildReport(entries: JournalEntry[]): Promise<File> {
  const sorted = [...entries].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const sections: string[] = [];

  for (const [i, e] of sorted.entries()) {
    const photos = await getPhotos(e.photoIds);
    const imgs = await Promise.all(
      photos.map(async (p) => `<img src="${await blobToDataUrl(p.blob)}" alt="${escapeHtml(p.name)}">`)
    );
    const row = (label: string, value: string) =>
      value.trim() ? `<p><strong>${label} :</strong> ${escapeHtml(value).replace(/\n/g, '<br>')}</p>` : '';
    sections.push(`<section>
  <h2>Fait n°${i + 1} — ${escapeHtml(formatOccurredAt(e.occurredAt))}</h2>
  ${row('Type', INCIDENT_KINDS[e.kind])}
  ${row('Lieu', e.place)}
  ${row('Ce qui s’est passé', e.description)}
  ${row('Auteur(s)', e.people)}
  ${row('Témoin(s)', e.witnesses)}
  ${imgs.length ? `<div class="photos">${imgs.join('')}</div>` : ''}
  <p class="meta">Noté le ${escapeHtml(new Date(e.createdAt).toLocaleString('fr-FR'))}</p>
</section>`);
  }

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Journal des faits — MBT</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1d1b20;line-height:1.5}
h1{font-size:22px;margin-bottom:4px}.intro{color:#555;font-size:14px}
section{border:2px solid #7174AA;border-radius:16px;padding:12px 18px;margin:18px 0;break-inside:avoid}
h2{font-size:16px;color:#7174AA;margin:6px 0 10px}p{margin:6px 0;font-size:14px}
.photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.photos img{max-width:100%;max-height:420px;border-radius:8px;border:1px solid #ddd}
.meta{color:#888;font-size:12px}
</style></head><body>
<h1>Journal des faits de harcèlement</h1>
<p class="intro">${sorted.length} fait(s) consigné(s). Document généré le ${escapeHtml(
    new Date().toLocaleString('fr-FR')
  )} avec l’application MBT — Mission Better Together. Il peut être remis à un adulte de confiance, à l’établissement, à un avocat ou joint à une plainte.</p>
${sections.join('\n')}
</body></html>`;

  const date = new Date().toISOString().slice(0, 10);
  return new File([html], `journal-faits-${date}.html`, { type: 'text/html' });
}

/** Partage le rapport (feuille de partage) ou, à défaut, le télécharge. */
export async function exportReport(entries: JournalEntry[]): Promise<'shared' | 'downloaded'> {
  const file = await buildReport(entries);
  // Sur téléphone : feuille de partage (mail, messagerie, Drive…). Sur ordinateur : téléchargement.
  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Journal des faits' });
      return 'shared';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
