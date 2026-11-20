import { useSyncExternalStore } from 'react';

/**
 * Préférences de l'utilisateur (non sensibles), conservées sur l'appareil.
 * Lecture/écriture centralisées : les composants n'accèdent jamais directement à localStorage.
 */
export interface SoundMix {
  rain: number;
  ocean: number;
  breeze: number;
  harmony: number;
}

export interface Preferences {
  /** Désactive les animations décoratives et les mouvements de la respiration guidée */
  reduceMotion: boolean;
  serenite: {
    patternId: 'coherence' | '478' | 'box';
    /** Durée d'une séance de respiration en minutes ; null = libre */
    durationMin: 1 | 3 | 5 | 10 | null;
    chime: boolean;
    vibration: boolean;
    /** Volume général des ambiances (0 à 1) */
    masterVolume: number;
    muted: boolean;
    mix: SoundMix;
  };
}

const KEY = 'mbt_preferences_v1';

export const DEFAULT_PREFERENCES: Preferences = {
  reduceMotion: false,
  serenite: {
    patternId: 'coherence',
    durationMin: 3,
    chime: true,
    vibration: true,
    masterVolume: 0.7,
    muted: false,
    mix: { rain: 0, ocean: 0, breeze: 0, harmony: 0 },
  },
};

function clamp01(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

/** Valide et complète des préférences lues (données potentiellement anciennes ou corrompues). */
export function sanitizePreferences(raw: unknown): Preferences {
  const d = DEFAULT_PREFERENCES;
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Preferences>;
  const s = (r.serenite ?? {}) as Partial<Preferences['serenite']>;
  const mix = (s.mix ?? {}) as Partial<SoundMix>;
  return {
    reduceMotion: typeof r.reduceMotion === 'boolean' ? r.reduceMotion : d.reduceMotion,
    serenite: {
      patternId: s.patternId === '478' || s.patternId === 'box' || s.patternId === 'coherence' ? s.patternId : d.serenite.patternId,
      durationMin: ([1, 3, 5, 10, null] as const).includes(s.durationMin as never) ? (s.durationMin as Preferences['serenite']['durationMin']) : d.serenite.durationMin,
      chime: typeof s.chime === 'boolean' ? s.chime : d.serenite.chime,
      vibration: typeof s.vibration === 'boolean' ? s.vibration : d.serenite.vibration,
      masterVolume: clamp01(s.masterVolume, d.serenite.masterVolume),
      muted: typeof s.muted === 'boolean' ? s.muted : d.serenite.muted,
      mix: {
        rain: clamp01(mix.rain, 0),
        ocean: clamp01(mix.ocean, 0),
        breeze: clamp01(mix.breeze, 0),
        harmony: clamp01(mix.harmony, 0),
      },
    },
  };
}

function load(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitizePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

let current: Preferences = typeof window === 'undefined' ? DEFAULT_PREFERENCES : load();
const listeners = new Set<() => void>();

export function getPreferences(): Preferences {
  return current;
}

export function updatePreferences(patch: (p: Preferences) => Preferences) {
  current = sanitizePreferences(patch(current));
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // navigation privée : préférences valables pour la session seulement
  }
  listeners.forEach((l) => l());
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current
  );
}
