import { AdviceTopic, ProfileId, ThemeKey } from '../data/content';

/**
 * Écrans de l'application et leur adresse (URL). Chaque écran a une URL propre :
 * liens profonds, rechargement, bouton retour du téléphone et raccourcis d'icône fonctionnent.
 */
export type TemoinStep = 'blessee' | 'harceleurs' | 'danger';

export type Route =
  | { name: 'accueil' }
  | { name: 'a-propos' }
  | { name: 'urgence' }
  | { name: 'urgence-victime' }
  | { name: 'urgence-temoin'; step: TemoinStep }
  | { name: 'urgence-secours'; reason: TemoinStep }
  | { name: 'alerte' }
  | { name: 'sinformer' }
  | { name: 'articles'; category?: string }
  | { name: 'article'; id: string }
  | { name: 'profil'; profileId: ProfileId }
  | { name: 'conseils'; profileId: ProfileId }
  | { name: 'conseil'; profileId: ProfileId; topic: AdviceTopic }
  | { name: 'lieux'; theme?: ThemeKey }
  | { name: 'temoignages' }
  | { name: 'temoignage'; index: number }
  | { name: 'contacts' }
  | { name: 'specialistes' }
  | { name: 'specialiste'; id: string }
  | { name: 'assistant' }
  | { name: 'serenite' }
  | { name: 'carnet' }
  | { name: 'appel'; serviceKey: string; customName?: string; customPhone?: string };

export const HOME: Route = { name: 'accueil' };

const PROFILES: ProfileId[] = ['primaire', 'college', 'adulte', 'parent'];
const TOPICS: AdviceTopic[] = ['que-dire', 'que-faire', 'qui-appeler'];
const STEPS: TemoinStep[] = ['blessee', 'harceleurs', 'danger'];

export function routeToPath(r: Route): string {
  switch (r.name) {
    case 'accueil':
      return '/';
    case 'a-propos':
      return '/a-propos';
    case 'urgence':
      return '/urgence';
    case 'urgence-victime':
      return '/urgence/victime';
    case 'urgence-temoin':
      return `/urgence/temoin/${r.step}`;
    case 'urgence-secours':
      return `/urgence/secours/${r.reason}`;
    case 'alerte':
      return '/alerte';
    case 'sinformer':
      return '/sinformer';
    case 'articles':
      return r.category ? `/sinformer/articles?categorie=${encodeURIComponent(r.category)}` : '/sinformer/articles';
    case 'article':
      return `/sinformer/articles/${encodeURIComponent(r.id)}`;
    case 'profil':
      return `/sinformer/profil/${r.profileId}`;
    case 'conseils':
      return `/sinformer/profil/${r.profileId}/conseils`;
    case 'conseil':
      return `/sinformer/profil/${r.profileId}/conseils/${r.topic}`;
    case 'lieux':
      return '/lieux';
    case 'temoignages':
      return '/temoignages';
    case 'temoignage':
      return `/temoignages/${r.index}`;
    case 'contacts':
      return '/contacts';
    case 'specialistes':
      return '/specialistes';
    case 'specialiste':
      return `/specialistes/${encodeURIComponent(r.id)}`;
    case 'assistant':
      return '/assistant';
    case 'serenite':
      return '/serenite';
    case 'carnet':
      return '/carnet';
    case 'appel':
      // Un numéro personnel n'apparaît jamais dans l'URL (historique du navigateur)
      return r.serviceKey === 'custom' ? '/appel' : `/appel/${encodeURIComponent(r.serviceKey)}`;
  }
}

/** Adresse → écran. Renvoie null pour une adresse inconnue. */
export function pathToRoute(pathname: string, search = ''): Route | null {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b, c, d, e] = parts;
  if (parts.length === 0) return HOME;

  switch (a) {
    case 'a-propos':
      return { name: 'a-propos' };
    case 'urgence':
      if (!b) return { name: 'urgence' };
      if (b === 'victime') return { name: 'urgence-victime' };
      if (b === 'temoin' && STEPS.includes(c as TemoinStep)) return { name: 'urgence-temoin', step: c as TemoinStep };
      if (b === 'secours' && STEPS.includes(c as TemoinStep)) return { name: 'urgence-secours', reason: c as TemoinStep };
      return null;
    case 'alerte':
      return { name: 'alerte' };
    case 'sinformer':
      if (!b) return { name: 'sinformer' };
      if (b === 'articles') {
        if (c) return { name: 'article', id: c };
        const category = new URLSearchParams(search).get('categorie') ?? undefined;
        return { name: 'articles', category };
      }
      if (b === 'profil' && PROFILES.includes(c as ProfileId)) {
        const profileId = c as ProfileId;
        if (!d) return { name: 'profil', profileId };
        if (d === 'conseils' && !e) return { name: 'conseils', profileId };
        if (d === 'conseils' && TOPICS.includes(e as AdviceTopic)) return { name: 'conseil', profileId, topic: e as AdviceTopic };
      }
      return null;
    case 'lieux':
      return { name: 'lieux' };
    case 'temoignages':
      if (!b) return { name: 'temoignages' };
      return /^\d+$/.test(b) ? { name: 'temoignage', index: Number(b) } : null;
    case 'contacts':
      return { name: 'contacts' };
    case 'specialistes':
      return b ? { name: 'specialiste', id: b } : { name: 'specialistes' };
    case 'assistant':
      return { name: 'assistant' };
    case 'serenite':
      return { name: 'serenite' };
    case 'carnet':
      return { name: 'carnet' };
    case 'appel':
      return b ? { name: 'appel', serviceKey: b } : null;
    default:
      return null;
  }
}

/** Onglet principal auquel appartient un écran (pour la navigation). */
export type Section = 'accueil' | 'sinformer' | 'serenite' | 'carnet' | 'urgence' | 'autre';

export function sectionOf(r: Route): Section {
  switch (r.name) {
    case 'accueil':
      return 'accueil';
    case 'sinformer':
    case 'articles':
    case 'article':
    case 'profil':
    case 'conseils':
    case 'conseil':
    case 'temoignages':
    case 'temoignage':
    case 'specialistes':
    case 'specialiste':
      return 'sinformer';
    case 'serenite':
      return 'serenite';
    case 'carnet':
      return 'carnet';
    case 'urgence':
    case 'urgence-victime':
    case 'urgence-temoin':
    case 'urgence-secours':
    case 'alerte':
    case 'lieux':
    case 'contacts':
    case 'appel':
      return 'urgence';
    default:
      return 'autre';
  }
}
