/**
 * Annuaire des structures d'aide (organismes publics ou associations agréées).
 * Aucun professionnel individuel, aucune disponibilité inventée.
 * MBT n'est affilié à aucune de ces structures.
 * Vérification des numéros, horaires et liens : 20 novembre 2026 (sources indiquées sur chaque fiche).
 */

export type StructureType = 'urgence' | 'ecoute' | 'harcelement' | 'victimes' | 'signalement' | 'sante' | 'parents';
export type Audience = 'jeunes' | 'parents' | 'pros' | 'tous';

export const STRUCTURE_TYPES: Record<StructureType, string> = {
  urgence: 'Urgence',
  harcelement: 'Harcèlement',
  ecoute: 'Écoute',
  victimes: 'Aide aux victimes',
  signalement: 'Signaler en ligne',
  sante: 'Santé / accueil',
  parents: 'Parents',
};

export const AUDIENCES: Record<Audience, string> = {
  jeunes: 'Jeunes',
  parents: 'Parents',
  pros: 'Professionnels',
  tous: 'Tout public',
};

export type Channel =
  | { kind: 'tel'; label: string; number: string; serviceKey?: string }
  | { kind: 'sms'; label: string; number: string; serviceKey?: string }
  | { kind: 'web'; label: string; url: string };

export interface Structure {
  id: string;
  name: string;
  types: StructureType[];
  audiences: Audience[];
  summary: string;
  description: string;
  hours: string;
  free: boolean;
  anonymous?: boolean;
  channels: Channel[];
  source: string;
  verifiedAt: string;
}

export const STRUCTURES: Structure[] = [
  {
    id: '3018',
    name: '3018 — Harcèlement et cyberharcèlement',
    types: ['harcelement', 'ecoute', 'signalement'],
    audiences: ['jeunes', 'parents', 'pros'],
    summary: 'Numéro national unique contre le harcèlement scolaire et en ligne.',
    description:
      'Opéré par l’association e-Enfance. Psychologues, juristes et spécialistes du numérique écoutent, conseillent et peuvent faire supprimer des contenus ou comptes en ligne. Les écoutants peuvent transmettre un signalement à l’Éducation nationale. Ce n’est pas un numéro d’urgence.',
    hours: '7j/7, de 9h à 23h',
    free: true,
    anonymous: true,
    channels: [
      { kind: 'tel', label: 'Appeler le 3018', number: '3018', serviceKey: '3018' },
      { kind: 'web', label: 'Tchat, WhatsApp, Messenger ou appli 3018', url: 'https://e-enfance.org/besoin-daide/' },
      { kind: 'web', label: 'En savoir plus sur le 3018', url: 'https://e-enfance.org/le3018/' },
    ],
    source: 'https://www.education.gouv.fr/non-au-harcelement',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'urgences',
    name: '17 · 15 · 112 — Secours',
    types: ['urgence'],
    audiences: ['tous'],
    summary: 'Police-gendarmerie (17), SAMU (15), numéro d’urgence européen (112).',
    description: 'En cas de danger immédiat, de violence en cours ou de blessure.',
    hours: '24h/24, 7j/7',
    free: true,
    channels: [
      { kind: 'tel', label: '17 — Police / gendarmerie', number: '17', serviceKey: '17' },
      { kind: 'tel', label: '15 — SAMU', number: '15', serviceKey: '15' },
      { kind: 'tel', label: '112 — Urgence européenne', number: '112', serviceKey: 'urgence' },
    ],
    source: 'https://www.service-public.gouv.fr/particuliers/actualites/A15841',
    verifiedAt: '2026-11-20',
  },
  {
    id: '114',
    name: '114 — Urgence par SMS',
    types: ['urgence'],
    audiences: ['tous'],
    summary: 'Alerter les secours par écrit quand on ne peut pas parler ou entendre.',
    description:
      'Pour les personnes sourdes, malentendantes ou aphasiques, et pour toute personne qui ne peut pas parler (par exemple si un agresseur est à proximité). Les agents transmettent l’alerte au service compétent. Les appels vocaux ne sont pas acceptés.',
    hours: '24h/24, 7j/7',
    free: true,
    channels: [
      { kind: 'sms', label: 'Envoyer un SMS au 114', number: '114', serviceKey: '114' },
      { kind: 'web', label: 'Site et appli Urgence 114', url: 'https://www.urgence114.fr/' },
    ],
    source: 'https://www.justice.fr/fiche/alerter-secours-samu-pompiers-cas-urgence',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'ma-securite',
    name: 'Ma Sécurité — Tchat avec la police et la gendarmerie',
    types: ['victimes', 'signalement'],
    audiences: ['jeunes', 'tous'],
    summary: 'Échanger par écrit avec un policier ou un gendarme, avec un espace dédié aux mineurs.',
    description:
      'Plateforme du ministère de l’Intérieur pour les victimes et témoins de violences (dont harcèlement scolaire et cyberharcèlement des mineurs). Écoute, conseils, aide aux démarches. Pas pour les urgences : en cas de danger, appeler le 17.',
    hours: 'Tchat 24h/24, 7j/7',
    free: true,
    channels: [
      { kind: 'web', label: 'Ouvrir Ma Sécurité', url: 'https://www.masecurite.interieur.gouv.fr/fr' },
      { kind: 'web', label: 'Plainte en ligne', url: 'https://www.masecurite.interieur.gouv.fr/fr/demarches-en-ligne/plainte-en-ligne' },
    ],
    source: 'https://www.gendarmerie.interieur.gouv.fr/gendinfo/actualites/2025/ouverture-d-un-espace-mineurs-sur-le-site-ma-securite',
    verifiedAt: '2026-11-20',
  },
  {
    id: '119',
    name: '119 — Allô Enfance en danger',
    types: ['ecoute', 'urgence'],
    audiences: ['jeunes', 'parents', 'pros', 'tous'],
    summary: 'Pour tout enfant en danger ou en risque de l’être, et pour les adultes inquiets.',
    description: 'Écoute, conseil et transmission aux services départementaux de protection de l’enfance.',
    hours: '24h/24, 7j/7',
    free: true,
    channels: [
      { kind: 'tel', label: 'Appeler le 119', number: '119', serviceKey: '119' },
      { kind: 'web', label: 'Site du 119', url: 'https://www.allo119.gouv.fr/' },
    ],
    source: 'https://www.allo119.gouv.fr/',
    verifiedAt: '2026-11-20',
  },
  {
    id: '3114',
    name: '3114 — Prévention du suicide',
    types: ['ecoute', 'sante'],
    audiences: ['tous'],
    summary: 'Quand on pense au suicide, ou qu’on s’inquiète pour quelqu’un.',
    description: 'Des professionnels du soin répondent, gratuitement et en toute confidentialité.',
    hours: '24h/24, 7j/7',
    free: true,
    channels: [
      { kind: 'tel', label: 'Appeler le 3114', number: '3114', serviceKey: '3114' },
      { kind: 'web', label: 'Site du 3114', url: 'https://3114.fr/' },
    ],
    source: 'https://3114.fr/',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'fil-sante-jeunes',
    name: 'Fil Santé Jeunes',
    types: ['ecoute', 'sante'],
    audiences: ['jeunes'],
    summary: 'Écoute anonyme des 12–25 ans sur tous les sujets : mal-être, relations, santé.',
    description: 'Par téléphone ou par tchat (les horaires du tchat sont indiqués sur le site).',
    hours: 'Téléphone : 7j/7, de 9h à 23h',
    free: true,
    anonymous: true,
    channels: [
      { kind: 'tel', label: 'Appeler le 0 800 235 236', number: '0 800 235 236', serviceKey: '0800235236' },
      { kind: 'web', label: 'Tchat Fil Santé Jeunes', url: 'https://www.filsantejeunes.com/' },
    ],
    source: 'https://www.santepubliquefrance.fr/presse/2023/sante-mentale-des-jeunes-des-conseils-pour-prendre-soin-de-sa-sante-mentale',
    verifiedAt: '2026-11-20',
  },
  {
    id: '116006',
    name: '116 006 — France Victimes',
    types: ['victimes'],
    audiences: ['parents', 'tous'],
    summary: 'Aide aux victimes d’infractions : écoute, droits, orientation.',
    description:
      'Numéro du ministère de la Justice opéré par le réseau France Victimes. Oriente vers une association d’aide aux victimes près de chez soi.',
    hours: '7j/7, de 9h à 20h',
    free: true,
    channels: [
      { kind: 'tel', label: 'Appeler le 116 006', number: '116 006', serviceKey: '116006' },
      { kind: 'web', label: 'Site France Victimes', url: 'https://www.france-victimes.fr/' },
    ],
    source: 'https://www.justice.fr/je-suis-victime/116006',
    verifiedAt: '2026-11-20',
  },
  {
    id: '3919',
    name: '3919 — Violences Femmes Info',
    types: ['ecoute', 'victimes'],
    audiences: ['tous'],
    summary: 'Écoute et orientation des victimes de violences sexistes et sexuelles.',
    description: 'Anonyme et gratuit.',
    hours: '24h/24, 7j/7',
    free: true,
    anonymous: true,
    channels: [
      { kind: 'tel', label: 'Appeler le 3919', number: '3919', serviceKey: '3919' },
      { kind: 'web', label: 'Arrêtons les violences', url: 'https://arretonslesviolences.gouv.fr/' },
    ],
    source: 'https://www.service-public.gouv.fr/particuliers/actualites/A15841',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'pharos',
    name: 'Pharos — Signaler un contenu illicite',
    types: ['signalement'],
    audiences: ['tous'],
    summary: 'Plateforme officielle pour signaler un contenu illégal sur internet.',
    description:
      'Menaces, diffusion d’images intimes, incitation à la haine… Le signalement est traité par des policiers et gendarmes. Pour une urgence, appeler le 17.',
    hours: 'En ligne',
    free: true,
    channels: [{ kind: 'web', label: 'Faire un signalement', url: 'https://www.internet-signalement.gouv.fr/' }],
    source: 'https://www.internet-signalement.gouv.fr/',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'point-de-contact',
    name: 'Point de Contact',
    types: ['signalement'],
    audiences: ['tous'],
    summary: 'Association de signalement de contenus choquants ou illicites en ligne.',
    description: 'Permet de signaler anonymement un contenu, qui est analysé puis transmis aux autorités ou aux plateformes.',
    hours: 'En ligne',
    free: true,
    anonymous: true,
    channels: [{ kind: 'web', label: 'Signaler sur Point de Contact', url: 'https://www.pointdecontact.net/' }],
    source: 'https://www.pointdecontact.net/',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'maisons-des-ados',
    name: 'Maisons des Adolescents',
    types: ['sante', 'ecoute'],
    audiences: ['jeunes', 'parents'],
    summary: 'Lieux d’accueil gratuits pour les ados et leurs parents, partout en France.',
    description:
      'Psychologues, éducateurs, médecins accueillent sans jugement. L’annuaire national permet de trouver la Maison des Adolescents la plus proche.',
    hours: 'Variables selon la structure',
    free: true,
    channels: [{ kind: 'web', label: 'Trouver une Maison des Adolescents', url: 'https://www.anmda.fr/' }],
    source: 'https://www.anmda.fr/',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'education-nationale',
    name: 'Éducation nationale — Non au harcèlement',
    types: ['harcelement', 'parents'],
    audiences: ['jeunes', 'parents', 'pros'],
    summary: 'Informations officielles et démarches auprès de l’établissement.',
    description: 'Ressources du ministère pour les élèves, les familles et les professionnels.',
    hours: 'En ligne',
    free: true,
    channels: [{ kind: 'web', label: 'Site Non au harcèlement', url: 'https://www.education.gouv.fr/non-au-harcelement' }],
    source: 'https://www.education.gouv.fr/non-au-harcelement',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'defenseur-des-droits',
    name: 'Défenseur des droits',
    types: ['victimes', 'parents'],
    audiences: ['jeunes', 'parents'],
    summary: 'Autorité indépendante qui défend notamment les droits de l’enfant.',
    description: 'Peut être saisie lorsque les droits d’un enfant ne sont pas respectés.',
    hours: 'En ligne',
    free: true,
    channels: [{ kind: 'web', label: 'Site du Défenseur des droits', url: 'https://www.defenseurdesdroits.fr/' }],
    source: 'https://www.defenseurdesdroits.fr/',
    verifiedAt: '2026-11-20',
  },
  {
    id: 'je-protege-mon-enfant',
    name: 'Je protège mon enfant',
    types: ['parents'],
    audiences: ['parents'],
    summary: 'Site du gouvernement pour accompagner les parents face aux usages numériques.',
    description: 'Conseils pour le contrôle parental, les réseaux sociaux et les écrans.',
    hours: 'En ligne',
    free: true,
    channels: [{ kind: 'web', label: 'Ouvrir le site', url: 'https://www.jeprotegemonenfant.gouv.fr/' }],
    source: 'https://www.jeprotegemonenfant.gouv.fr/',
    verifiedAt: '2026-11-20',
  },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function searchStructures(query: string, type: StructureType | null, audience: Audience | null): Structure[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return STRUCTURES.filter((s) => {
    if (type && !s.types.includes(type)) return false;
    if (audience && !s.audiences.includes(audience) && !s.audiences.includes('tous')) return false;
    if (!terms.length) return true;
    const hay = fold([s.name, s.summary, s.description, s.types.map((t) => STRUCTURE_TYPES[t]).join(' ')].join(' '));
    return terms.every((t) => hay.includes(t));
  });
}
