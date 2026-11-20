export const AFFECT_LEVELS = [-2, -1, 0, 1, 2] as const;
export type AffectLevel = (typeof AFFECT_LEVELS)[number];
export type AffectValence = AffectLevel | 'melange';

export interface AffectReading {
  valence: AffectValence;
  activation: AffectLevel;
}

export const VALENCE_LABELS: Record<AffectValence, string> = {
  [-2]: 'Très désagréable',
  [-1]: 'Plutôt désagréable',
  0: 'Ni agréable ni désagréable',
  1: 'Plutôt agréable',
  2: 'Très agréable',
  melange: 'À la fois agréable et désagréable',
};

export const ACTIVATION_LABELS: Record<AffectLevel, string> = {
  [-2]: 'Très calme',
  [-1]: 'Plutôt calme',
  0: 'Entre calme et animé',
  1: 'Plutôt animé',
  2: 'Très animé',
};

const isLevel = (value: unknown): value is AffectLevel =>
  typeof value === 'number' && Number.isInteger(value) && value >= -2 && value <= 2;

export function parseAffectReading(value: unknown): AffectReading | null {
  if (!value || typeof value !== 'object' || !('valence' in value) || !('activation' in value)) return null;
  const { valence, activation } = value;
  if (!(isLevel(valence) || valence === 'melange') || !isLevel(activation)) return null;
  return { valence, activation };
}

export type AffectScene = 'soleil' | 'nuage' | 'pluie' | 'orage' | 'melange';

/** Projection visuelle MBT d'une auto-évaluation, inspirée des dimensions de Russell (1980). */
export function projectAffect({ valence, activation }: AffectReading): { scene: AffectScene; breeze: number } {
  const breeze = activation + 2;
  if (valence === 'melange') return { scene: 'melange', breeze };
  if (valence > 0) return { scene: 'soleil', breeze };
  if (valence === 0) return { scene: 'nuage', breeze };
  return { scene: activation > 0 ? 'orage' : 'pluie', breeze };
}
