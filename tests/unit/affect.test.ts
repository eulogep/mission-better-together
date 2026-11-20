import { describe, expect, it } from 'vitest';
import { AffectScene, AffectValence, parseAffectReading, projectAffect } from '../../src/lib/affect';
import { parseMoodReport } from '../../src/lib/mood';

const activations = [-2, -1, 0, 1, 2] as const;
const expectations: [AffectValence, AffectScene[]][] = [
  [-2, ['pluie', 'pluie', 'pluie', 'orage', 'orage']],
  [-1, ['pluie', 'pluie', 'pluie', 'orage', 'orage']],
  [0, ['nuage', 'nuage', 'nuage', 'nuage', 'nuage']],
  [1, ['soleil', 'soleil', 'soleil', 'soleil', 'soleil']],
  [2, ['soleil', 'soleil', 'soleil', 'soleil', 'soleil']],
  ['melange', ['melange', 'melange', 'melange', 'melange', 'melange']],
];

describe('projection du ressenti vers le jardin', () => {
  it.each(expectations)('projette la valence %s pour chacun des cinq niveaux d’activation', (valence, scenes) => {
    expect(activations.map((activation) => projectAffect({ valence, activation }))).toEqual(
      scenes.map((scene, index) => ({ scene, breeze: index })),
    );
  });

  it('conserve un ressenti mélangé et une activation intermédiaire distincts d’une réponse manquante', () => {
    expect(parseAffectReading({ valence: 'melange', activation: 0 })).toEqual({ valence: 'melange', activation: 0 });
    expect(parseAffectReading({ valence: 0, activation: 0 })).toEqual({ valence: 0, activation: 0 });
    expect(parseAffectReading({ valence: 'melange' })).toBeNull();
    expect(parseAffectReading({ activation: 0 })).toBeNull();
  });

  it('écarte les valeurs hors de l’échelle ordinale', () => {
    for (const invalid of [NaN, Infinity, -3, 3, 1.5, '0', '', null]) {
      expect(parseAffectReading({ valence: invalid, activation: 0 })).toBeNull();
      expect(parseAffectReading({ valence: 0, activation: invalid })).toBeNull();
    }
  });
});

describe('format de session du ressenti', () => {
  it.each(['soleil', 'nuage', 'pluie', 'orage'])('relit le choix rapide existant %s', (value) => {
    expect(parseMoodReport(value)).toEqual({ kind: 'quick', mood: value });
  });

  it('relit les deux axes en conservant le mode détaillé', () => {
    const report = { kind: 'detailed', reading: { valence: 'melange', activation: 2 } };
    expect(parseMoodReport(JSON.stringify(report))).toEqual(report);
  });

  it('ignore un rapport corrompu ou incomplet', () => {
    for (const invalid of [null, 'neutre', '{', '{}', '{"kind":"detailed","reading":{"valence":-2}}']) {
      expect(parseMoodReport(invalid)).toBeNull();
    }
  });
});
