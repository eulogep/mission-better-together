import { describe, expect, it } from 'vitest';
import { HOME, Route, pathToRoute, routeToPath, sectionOf } from '../../src/app/routes';
import { DEFAULT_PREFERENCES, sanitizePreferences } from '../../src/lib/preferences';
import { EMERGENCY_SERVICES, HELP_CONTACTS, PROFILES, findServiceKey } from '../../src/data/content';
import { ARTICLES, searchArticles } from '../../src/data/articles';
import { STRUCTURES, searchStructures } from '../../src/data/structures';
import { formatOpeningHours } from '../../src/lib/places';
import { distanceMeters, formatWalk, normalizePhone, smsHref } from '../../src/lib/device';

describe('routes', () => {
  const routes: Route[] = [
    HOME,
    { name: 'a-propos' },
    { name: 'urgence' },
    { name: 'urgence-victime' },
    { name: 'urgence-temoin', step: 'harceleurs' },
    { name: 'urgence-secours', reason: 'danger' },
    { name: 'alerte' },
    { name: 'sinformer' },
    { name: 'articles' },
    { name: 'article', id: 'garder-des-preuves' },
    { name: 'profil', profileId: 'college' },
    { name: 'conseils', profileId: 'parent' },
    { name: 'conseil', profileId: 'adulte', topic: 'qui-appeler' },
    { name: 'temoignages' },
    { name: 'temoignage', index: 2 },
    { name: 'contacts' },
    { name: 'specialistes' },
    { name: 'specialiste', id: '3018' },
    { name: 'assistant' },
    { name: 'serenite' },
    { name: 'carnet' },
    { name: 'appel', serviceKey: '3114' },
  ];

  it.each(routes)('aller-retour URL ↔ écran : %o', (r) => {
    const url = new URL(routeToPath(r), 'https://mbt.local');
    expect(pathToRoute(url.pathname, url.search)).toEqual(r);
  });

  it('conserve la catégorie de la bibliothèque', () => {
    const url = new URL(routeToPath({ name: 'articles', category: 'cyber' }), 'https://mbt.local');
    expect(pathToRoute(url.pathname, url.search)).toEqual({ name: 'articles', category: 'cyber' });
  });

  it('ne met jamais un numéro personnel dans l’URL', () => {
    expect(routeToPath({ name: 'appel', serviceKey: 'custom', customName: 'Maman', customPhone: '0612345678' })).toBe('/appel');
  });

  it('rejette les adresses inconnues', () => {
    expect(pathToRoute('/nimporte-quoi')).toBeNull();
    expect(pathToRoute('/urgence/temoin/inconnu')).toBeNull();
    expect(pathToRoute('/temoignages/abc')).toBeNull();
  });

  it('associe chaque écran à une rubrique', () => {
    expect(sectionOf({ name: 'article', id: 'x' })).toBe('sinformer');
    expect(sectionOf({ name: 'alerte' })).toBe('urgence');
    expect(sectionOf({ name: 'carnet' })).toBe('carnet');
  });
});

describe('préférences', () => {
  it('rejette les valeurs invalides ou corrompues', () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    const p = sanitizePreferences({ reduceMotion: 'oui', serenite: { masterVolume: 9, durationMin: 7, patternId: 'x', mix: { rain: -1 } } });
    expect(p.reduceMotion).toBe(false);
    expect(p.serenite.masterVolume).toBe(1);
    expect(p.serenite.durationMin).toBe(DEFAULT_PREFERENCES.serenite.durationMin);
    expect(p.serenite.patternId).toBe('coherence');
    expect(p.serenite.mix.rain).toBe(0);
  });

  it('garde la durée « libre »', () => {
    expect(sanitizePreferences({ serenite: { durationMin: null } }).serenite.durationMin).toBeNull();
  });
});

describe('contenus vérifiés', () => {
  it('ne propose plus le 3020 (remplacé par le 3018, numéro unique)', () => {
    expect(EMERGENCY_SERVICES['3020']).toBeUndefined();
    expect(HELP_CONTACTS.some((c) => c.phone === '3020')).toBe(false);
    const quick = Object.values(PROFILES).flatMap((p) => Object.values(p.advice).flatMap((a) => a.quickNumbers ?? []));
    expect(quick.some((q) => q.number === '3020')).toBe(false);
  });

  it('chaque numéro rapide correspond à un service connu', () => {
    const quick = Object.values(PROFILES).flatMap((p) => Object.values(p.advice).flatMap((a) => a.quickNumbers ?? []));
    for (const q of quick) expect(EMERGENCY_SERVICES[q.number], q.number).toBeDefined();
  });

  it('le bouton SOS appelle le 112 sans prétendre être un service MBT', () => {
    expect(EMERGENCY_SERVICES.urgence.dialNumber).toBe('112');
    expect(EMERGENCY_SERVICES.urgence.description).toMatch(/MBT n’opère aucun service d’urgence/);
  });

  it('reconnaît les numéros nationaux, même avec espaces', () => {
    expect(findServiceKey('116 006')).toBe('116006');
    expect(findServiceKey('0 800 235 236')).toBe('0800235236');
    expect(findServiceKey('06 12 34 56 78')).toBeNull();
  });

  it('chaque article est daté et sourcé en HTTPS', () => {
    for (const a of ARTICLES) {
      expect(a.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.sources.length).toBeGreaterThan(0);
      for (const s of a.sources) expect(s.url.startsWith('https://')).toBe(true);
    }
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length);
  });

  it('chaque structure a des canaux valides et une date de vérification', () => {
    for (const s of STRUCTURES) {
      expect(s.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.source.startsWith('https://')).toBe(true);
      for (const c of s.channels) {
        if (c.kind === 'web') expect(c.url.startsWith('https://')).toBe(true);
        else if (c.serviceKey) expect(EMERGENCY_SERVICES[c.serviceKey], c.serviceKey).toBeDefined();
      }
    }
  });

  it('recherche dans la bibliothèque et l’annuaire', () => {
    expect(searchArticles('preuves capture').map((a) => a.id)).toContain('garder-des-preuves');
    expect(searchArticles('', 'parents').every((a) => a.category === 'parents')).toBe(true);
    expect(searchStructures('', 'urgence', null).map((s) => s.id)).toContain('114');
    expect(searchStructures('', null, 'parents').map((s) => s.id)).toContain('je-protege-mon-enfant');
  });
});

describe('utilitaires', () => {
  it('traduit les horaires OpenStreetMap', () => {
    expect(formatOpeningHours('24/7')).toBe('Ouvert 24h/24, 7j/7');
    expect(formatOpeningHours('Mo-Fr 08:30-19:30; Su off')).toBe('lun–ven 8h30–19h30 · dim fermé');
  });

  it('prépare des liens SMS et numéros corrects', () => {
    expect(normalizePhone('06 12.34-56 78')).toBe('0612345678');
    expect(smsHref('06 11 22 33 44', 'Aide')).toMatch(/^sms:0611223344\?&?body=Aide$/);
  });

  it('calcule distances et temps de marche', () => {
    const d = distanceMeters({ lat: 48.8566, lon: 2.3522 }, { lat: 48.8584, lon: 2.2945 });
    expect(d).toBeGreaterThan(4000);
    expect(d).toBeLessThan(4400);
    expect(formatWalk(180)).toBe('180 m · 2 min à pied');
  });
});
