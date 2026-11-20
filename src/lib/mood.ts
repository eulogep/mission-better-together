import { AffectReading, parseAffectReading } from './affect';

export type Mood = 'soleil' | 'nuage' | 'pluie' | 'orage';
export type MoodReport = { kind: 'quick'; mood: Mood } | { kind: 'detailed'; reading: AffectReading };

const STORAGE_KEY = 'mbt_mood_v1';

export function parseMoodReport(value: string | null): MoodReport | null {
  if (value === null) return null;
  if (value === 'soleil' || value === 'nuage' || value === 'pluie' || value === 'orage') {
    return { kind: 'quick', mood: value };
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || !('kind' in parsed) || parsed.kind !== 'detailed' || !('reading' in parsed)) return null;
    const reading = parseAffectReading(parsed.reading);
    return reading ? { kind: 'detailed', reading } : null;
  } catch {
    return null;
  }
}

export function loadSessionMood(): MoodReport | null {
  try {
    return parseMoodReport(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveSessionMood(report: MoodReport | null): void {
  try {
    if (report === null) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, report.kind === 'quick' ? report.mood : JSON.stringify(report));
  } catch {
    // Le choix reste disponible en mémoire si le stockage de session est indisponible.
  }
}
