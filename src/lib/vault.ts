/**
 * Coffre chiffré local (IndexedDB + WebCrypto).
 *
 * - Une clé de données (DEK) aléatoire AES-GCM 256 bits chiffre chaque enregistrement.
 * - La DEK est elle-même chiffrée par une clé dérivée du code de l'utilisateur
 *   (PBKDF2-SHA-256, 600 000 itérations, sel aléatoire de 16 octets).
 * - Rien n'est stocké en clair ; la DEK n'existe qu'en mémoire une fois le coffre ouvert.
 * - Changer de code ne rechiffre que la DEK.
 * - Tentatives limitées : délai croissant après 5 échecs (protection de l'interface ;
 *   un attaquant disposant d'une copie du stockage peut tenter hors ligne → code long conseillé).
 *
 * Il n'existe aucune porte dérobée : code oublié = données irrécupérables (sauf export préalable).
 */

import { carnetBiometrics, hasCarnetBiometrics } from './carnetBiometrics';

export const VAULT_DB = 'mbt-vault';
const DB_VERSION = 1;
export const PBKDF2_ITERATIONS = 600_000;
const MAX_FREE_ATTEMPTS = 5;

export interface EncryptedBlob {
  iv: Uint8Array;
  data: ArrayBuffer;
}

interface VaultConfig {
  key: 'config';
  version: 1;
  salt: Uint8Array;
  iterations: number;
  wrappedDek: EncryptedBlob;
  createdAt: string;
}

interface AttemptState {
  key: 'attempts';
  failures: number;
  lockedUntil: number;
}

export interface StoredRecord {
  id: string;
  /** Pour les pièces jointes : entrée parente (identifiant non sensible) */
  parentId?: string;
  payload: EncryptedBlob;
}

export type VaultStore = 'records' | 'files';

/* ------------------------------ IndexedDB ------------------------------ */

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Stockage sécurisé indisponible sur cet appareil.'));
      return;
    }
    const req = indexedDB.open(VAULT_DB, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('files')) {
        const files = db.createObjectStore('files', { keyPath: 'id' });
        files.createIndex('parentId', 'parentId');
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transaction annulée'));
  });
}

async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return (await request(db.transaction('meta').objectStore('meta').get(key))) as T | undefined;
}

async function putMeta(value: object) {
  const db = await openDb();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put(value);
  await done(tx);
}

/* ------------------------------ Crypto ------------------------------ */

const subtle = () => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error('Chiffrement indisponible (contexte non sécurisé : HTTPS requis).');
  return s;
};

const randomBytes = (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n));

async function deriveKek(pin: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await subtle().importKey('raw', new TextEncoder().encode(pin.normalize('NFKC')), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBytes(key: CryptoKey, bytes: ArrayBuffer | Uint8Array): Promise<EncryptedBlob> {
  const iv = randomBytes(12);
  const data = await subtle().encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, bytes as BufferSource);
  return { iv, data };
}

async function decryptBytes(key: CryptoKey, blob: EncryptedBlob): Promise<ArrayBuffer> {
  return subtle().decrypt({ name: 'AES-GCM', iv: blob.iv as BufferSource }, key, blob.data);
}

const importDek = (raw: ArrayBuffer | Uint8Array) =>
  subtle().importKey('raw', raw as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

/* ------------------------------ Session ------------------------------ */

/** Coffre ouvert : clé de données en mémoire uniquement. */
export interface VaultSession {
  dek: CryptoKey;
}

export async function encryptJson(session: VaultSession, value: unknown): Promise<EncryptedBlob> {
  return encryptBytes(session.dek, new TextEncoder().encode(JSON.stringify(value)));
}

export async function decryptJson<T>(session: VaultSession, blob: EncryptedBlob): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await decryptBytes(session.dek, blob))) as T;
}

export const encryptFile = (session: VaultSession, bytes: ArrayBuffer) => encryptBytes(session.dek, bytes);
export const decryptFile = (session: VaultSession, blob: EncryptedBlob) => decryptBytes(session.dek, blob);

/* ------------------------------ Cycle de vie ------------------------------ */

export const MIN_PIN_LENGTH = 6;

export function validatePin(pin: string): string | null {
  if (pin.length < MIN_PIN_LENGTH) return `Au moins ${MIN_PIN_LENGTH} caractères.`;
  if (/^(\d)\1+$/.test(pin)) return 'Évite un code fait d’un seul chiffre répété.';
  if (['123456', '1234567', '12345678', '654321', '000000', 'azerty', 'motdepasse'].includes(pin.toLowerCase()))
    return 'Ce code est trop facile à deviner.';
  return null;
}

export async function vaultExists(): Promise<boolean> {
  return !!(await getMeta<VaultConfig>('config'));
}

export async function createVault(pin: string): Promise<VaultSession> {
  const problem = validatePin(pin);
  if (problem) throw new Error(problem);
  if (await vaultExists()) throw new Error('Un carnet protégé existe déjà.');
  const salt = randomBytes(16);
  const kek = await deriveKek(pin, salt, PBKDF2_ITERATIONS);
  const rawDek = randomBytes(32);
  const config: VaultConfig = {
    key: 'config',
    version: 1,
    salt,
    iterations: PBKDF2_ITERATIONS,
    wrappedDek: await encryptBytes(kek, rawDek),
    createdAt: new Date().toISOString(),
  };
  await putMeta(config);
  const dek = await importDek(rawDek);
  rawDek.fill(0);
  return { dek };
}

export interface UnlockResult {
  session?: VaultSession;
  /** Délai à attendre avant un nouvel essai (ms) */
  retryInMs?: number;
}

export async function getLockDelay(): Promise<number> {
  const a = await getMeta<AttemptState>('attempts');
  return a ? Math.max(0, a.lockedUntil - Date.now()) : 0;
}

async function verifyPin(pin: string): Promise<{ config: VaultConfig; rawDek?: ArrayBuffer; retryInMs?: number }> {
  const config = await getMeta<VaultConfig>('config');
  if (!config) throw new Error('Aucun carnet protégé.');
  const wait = await getLockDelay();
  if (wait > 0) return { config, retryInMs: wait };

  let rawDek: ArrayBuffer;
  try {
    const kek = await deriveKek(pin, config.salt, config.iterations);
    rawDek = await decryptBytes(kek, config.wrappedDek);
  } catch {
    const prev = (await getMeta<AttemptState>('attempts')) ?? { key: 'attempts', failures: 0, lockedUntil: 0 };
    const failures = prev.failures + 1;
    // Après 5 échecs : 30 s, puis 60 s, 120 s… (plafonné à 1 h)
    const delay = failures >= MAX_FREE_ATTEMPTS ? Math.min(3_600_000, 30_000 * 2 ** (failures - MAX_FREE_ATTEMPTS)) : 0;
    await putMeta({ key: 'attempts', failures, lockedUntil: Date.now() + delay } satisfies AttemptState);
    return { config, retryInMs: delay || undefined };
  }
  try {
    await putMeta({ key: 'attempts', failures: 0, lockedUntil: 0 } satisfies AttemptState);
    return { config, rawDek };
  } catch (error) {
    new Uint8Array(rawDek).fill(0);
    throw error;
  }
}

export async function unlockVault(pin: string): Promise<UnlockResult> {
  const { rawDek, retryInMs } = await verifyPin(pin);
  if (!rawDek) return { retryInMs };
  try {
    return { session: { dek: await importDek(rawDek) } };
  } finally {
    new Uint8Array(rawDek).fill(0);
  }
}

export async function vaultBiometricStatus() {
  if (!hasCarnetBiometrics()) return { available: false, enabled: false };
  const [config, marker, { available }] = await Promise.all([
    getMeta<VaultConfig>('config'),
    getMeta<{ vaultId: string | null }>('biometric'),
    carnetBiometrics.availability(),
  ]);
  return { available, enabled: !!config && marker?.vaultId === config.createdAt };
}

export async function enableVaultBiometrics(pin: string): Promise<void> {
  if (!hasCarnetBiometrics()) throw new Error('Biométrie indisponible sur cet appareil.');
  const { config, rawDek, retryInMs } = await verifyPin(pin);
  if (!rawDek) throw new Error(retryInMs ? 'Trop d’essais. Patiente avant de réessayer.' : 'Code incorrect.');
  try {
    const key = btoa(String.fromCharCode(...new Uint8Array(rawDek)));
    await carnetBiometrics.store({ vaultId: config.createdAt, key });
    await putMeta({ key: 'biometric', vaultId: config.createdAt });
  } finally {
    new Uint8Array(rawDek).fill(0);
  }
}

export async function disableVaultBiometrics(): Promise<void> {
  if (hasCarnetBiometrics()) await carnetBiometrics.clear();
  await putMeta({ key: 'biometric', vaultId: null });
}

export async function unlockVaultWithBiometrics(): Promise<VaultSession> {
  const config = await getMeta<VaultConfig>('config');
  const marker = await getMeta<{ vaultId: string | null }>('biometric');
  if (!hasCarnetBiometrics() || !config || marker?.vaultId !== config.createdAt) {
    throw new Error('Biométrie inactive.');
  }
  const { key } = await carnetBiometrics.read({ vaultId: config.createdAt });
  const rawDek = Uint8Array.from(atob(key), (char) => char.charCodeAt(0));
  try {
    if (rawDek.length !== 32) throw new Error('Clé biométrique invalide.');
    // Un effacement ou une désactivation pendant le dialogue invalide la demande en cours.
    const current = await getMeta<{ vaultId: string | null }>('biometric');
    if (current?.vaultId !== config.createdAt) throw new Error('Biométrie inactive.');
    return { dek: await importDek(rawDek) };
  } finally {
    rawDek.fill(0);
  }
}

export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  const problem = validatePin(newPin);
  if (problem) throw new Error(problem);
  const config = await getMeta<VaultConfig>('config');
  if (!config) throw new Error('Aucun carnet protégé.');
  let rawDek: ArrayBuffer;
  try {
    rawDek = await decryptBytes(await deriveKek(oldPin, config.salt, config.iterations), config.wrappedDek);
  } catch {
    return false;
  }
  const salt = randomBytes(16);
  const kek = await deriveKek(newPin, salt, PBKDF2_ITERATIONS);
  await putMeta({ ...config, salt, iterations: PBKDF2_ITERATIONS, wrappedDek: await encryptBytes(kek, rawDek) });
  new Uint8Array(rawDek).fill(0);
  return true;
}

/** Efface définitivement le coffre (toutes les entrées et pièces jointes). */
export async function destroyVault(): Promise<void> {
  if (hasCarnetBiometrics()) await disableVaultBiometrics();
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(VAULT_DB);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Ferme les autres fenêtres du carnet, puis réessaie.'));
  });
}

/* ------------------------------ Enregistrements ------------------------------ */

export async function putRecord(store: VaultStore, record: StoredRecord) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(record);
  await done(tx);
}

export async function getRecord(store: VaultStore, id: string): Promise<StoredRecord | undefined> {
  const db = await openDb();
  return (await request(db.transaction(store).objectStore(store).get(id))) as StoredRecord | undefined;
}

export async function listRecords(store: VaultStore): Promise<StoredRecord[]> {
  const db = await openDb();
  return (await request(db.transaction(store).objectStore(store).getAll())) as StoredRecord[];
}

export async function deleteRecords(store: VaultStore, ids: string[]) {
  if (!ids.length) return;
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  ids.forEach((id) => tx.objectStore(store).delete(id));
  await done(tx);
}
