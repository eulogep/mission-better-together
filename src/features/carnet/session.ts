import { useSyncExternalStore } from 'react';
import { VaultSession } from '../../lib/vault';

/**
 * Session du carnet : la clé de déchiffrement n'existe qu'en mémoire.
 * Verrouillage automatique : 5 min sans activité, 30 s en arrière-plan,
 * mode discret, ou à la demande.
 */
const IDLE_MS = 5 * 60_000;
const HIDDEN_MS = 30_000;

let session: VaultSession | null = null;
let idleTimer: number | undefined;
let hiddenTimer: number | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openCarnetSession(s: VaultSession) {
  session = s;
  touchCarnetSession();
  emit();
}

export function lockCarnet() {
  if (!session) return;
  session = null;
  window.clearTimeout(idleTimer);
  window.clearTimeout(hiddenTimer);
  emit();
}

/** À appeler à chaque interaction dans le carnet (repousse le verrouillage). */
export function touchCarnetSession() {
  if (!session) return;
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(lockCarnet, IDLE_MS);
}

export const getCarnetSession = () => session;

export function useCarnetSession(): VaultSession | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => session
  );
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    window.clearTimeout(hiddenTimer);
    if (document.visibilityState === 'hidden' && session) {
      hiddenTimer = window.setTimeout(lockCarnet, HIDDEN_MS);
    }
  });
  // Page quittée (sortie rapide, fermeture) : la clé disparaît avec la mémoire de la page
  window.addEventListener('pagehide', lockCarnet);
}
