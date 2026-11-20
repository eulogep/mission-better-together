/**
 * Bibliothèque « S'informer » : articles rédigés par l'équipe MBT à partir de sources officielles.
 * Chaque article est daté et sourcé. Avant toute mise à jour, revérifier les liens et numéros.
 * Dernière vérification des sources : 20 novembre 2026.
 */

export type ArticleCategory = 'comprendre' | 'cyber' | 'victime' | 'temoin' | 'preuves' | 'aide' | 'parents' | 'pros';

export const ARTICLE_CATEGORIES: Record<ArticleCategory, { label: string; color: string }> = {
  comprendre: { label: 'Comprendre', color: '#7174AA' },
  cyber: { label: 'Cyberharcèlement', color: '#2663FF' },
  victime: { label: 'Je suis victime', color: '#FF8989' },
  temoin: { label: 'Je suis témoin', color: '#E5A23A' },
  preuves: { label: 'Preuves', color: '#00A884' },
  aide: { label: 'Demander de l’aide', color: '#d4474c' },
  parents: { label: 'Parents', color: '#8C5734' },
  pros: { label: 'Professionnels', color: '#3B3B3B' },
};

export interface ArticleSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Source {
  label: string;
  url: string;
}

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  summary: string;
  readingMinutes: number;
  updatedAt: string; // AAAA-MM-JJ
  sections: ArticleSection[];
  sources: Source[];
}

const SRC = {
  eduNonHarcelement: { label: 'Ministère de l’Éducation nationale — Non au harcèlement', url: 'https://www.education.gouv.fr/non-au-harcelement' },
  eduVictime: { label: 'Éducation nationale — Je suis victime de harcèlement', url: 'https://www.education.gouv.fr/non-au-harcelement/je-suis-victime-de-harcelement-468671' },
  eduParent: { label: 'Éducation nationale — Mon enfant est victime de harcèlement', url: 'https://www.education.gouv.fr/non-au-harcelement/mon-enfant-est-victime-de-harcelement-323014' },
  eduPolitique: { label: 'Éducation nationale — Politique de lutte contre le harcèlement à l’École', url: 'https://www.education.gouv.fr/non-au-harcelement/politique-de-lutte-contre-le-harcelement-l-ecole-289530' },
  spCollege: { label: 'Service-public.fr — Harcèlement scolaire au collège et au lycée', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31985' },
  spPrimaire: { label: 'Service-public.fr — Harcèlement scolaire à l’école primaire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F38054' },
  spUrgences: { label: 'Service-public.fr — Numéros d’urgence et d’écoute', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A15841' },
  loi2022: { label: 'Légifrance — Loi n° 2022-299 du 2 mars 2022 visant à combattre le harcèlement scolaire', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000045287658' },
  art222: { label: 'Légifrance — Article 222-33-2-3 du code pénal', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045289333' },
  e3018: { label: 'Association e-Enfance — Le 3018', url: 'https://e-enfance.org/le3018/' },
  pharos: { label: 'Pharos — Plateforme officielle de signalement', url: 'https://www.internet-signalement.gouv.fr/' },
  pointContact: { label: 'Point de Contact — Signalement de contenus', url: 'https://www.pointdecontact.net/' },
  maSecurite: { label: 'Ministère de l’Intérieur — Ma Sécurité', url: 'https://www.masecurite.interieur.gouv.fr/fr' },
  plainte: { label: 'Ma Sécurité — Plainte en ligne', url: 'https://www.masecurite.interieur.gouv.fr/fr/demarches-en-ligne/plainte-en-ligne' },
  justice116: { label: 'Justice.fr — Être écouté au 116 006', url: 'https://www.justice.fr/je-suis-victime/116006' },
  justiceUrgence: { label: 'Justice.fr — Alerter les secours en cas d’urgence', url: 'https://www.justice.fr/fiche/alerter-secours-samu-pompiers-cas-urgence' },
  urgence114: { label: 'Urgence 114', url: 'https://www.urgence114.fr/' },
  allo119: { label: 'Allô 119 — Enfance en danger', url: 'https://www.allo119.gouv.fr/' },
  s3114: { label: '3114 — Numéro national de prévention du suicide', url: 'https://3114.fr/' },
  jeProtege: { label: 'Je protège mon enfant (gouvernement)', url: 'https://www.jeprotegemonenfant.gouv.fr/' },
} satisfies Record<string, Source>;

export const ARTICLES: Article[] = [
  {
    id: 'comprendre-harcelement',
    title: 'Qu’est-ce que le harcèlement scolaire ?',
    category: 'comprendre',
    summary: 'Une violence répétée, avec un rapport de force, qui isole la victime. Et depuis 2022, un délit.',
    readingMinutes: 3,
    updatedAt: '2026-11-20',
    sections: [
      {
        paragraphs: [
          'Le harcèlement, ce n’est pas une dispute ponctuelle. On parle de harcèlement quand des propos ou des comportements blessants se répètent, qu’ils créent un rapport de force (une ou plusieurs personnes contre une seule) et qu’ils isolent la victime.',
        ],
      },
      {
        heading: 'Trois signes qui doivent alerter',
        bullets: [
          'La répétition : moqueries, insultes, bousculades ou messages qui reviennent.',
          'Le déséquilibre : la victime n’arrive pas à se défendre seule.',
          'L’isolement : elle est mise à l’écart, n’ose plus en parler.',
        ],
      },
      {
        heading: 'Les formes qu’il peut prendre',
        bullets: [
          'Verbal : insultes, surnoms, moqueries.',
          'Physique : coups, bousculades, vol ou dégradation d’affaires.',
          'Relationnel : rumeurs, exclusion du groupe.',
          'En ligne (cyberharcèlement) : messages, photos, groupes, faux comptes.',
          'Sexiste ou sexuel : remarques, gestes, diffusion d’images intimes.',
        ],
      },
      {
        heading: 'Ce que dit la loi',
        paragraphs: [
          'Depuis la loi du 2 mars 2022, le harcèlement scolaire est un délit (article 222-33-2-3 du code pénal). Pour un auteur majeur, il est puni jusqu’à 3 ans de prison et 45 000 € d’amende, et jusqu’à 10 ans et 150 000 € lorsque la victime a tenté de se suicider ou s’est suicidée.',
          'Pour les auteurs mineurs, les peines sont adaptées à leur âge : avant 13 ans, seules des mesures éducatives sont possibles. L’établissement peut aussi prononcer des sanctions disciplinaires.',
        ],
      },
      { paragraphs: ['Ce que tu vis n’est jamais de ta faute. Tu as le droit d’être protégé·e.'] },
    ],
    sources: [SRC.eduNonHarcelement, SRC.loi2022, SRC.art222, SRC.spCollege, SRC.spPrimaire],
  },
  {
    id: 'cyberharcelement',
    title: 'Cyberharcèlement : les bons réflexes',
    category: 'cyber',
    summary: 'Ne pas répondre, garder les preuves, bloquer, signaler, et appeler le 3018 qui peut faire supprimer des contenus.',
    readingMinutes: 3,
    updatedAt: '2026-11-20',
    sections: [
      {
        heading: 'Dans l’ordre',
        bullets: [
          'Ne réponds pas aux provocations : ça alimente souvent le harcèlement.',
          'Fais des captures d’écran avant tout : message, pseudo, date, adresse du profil ou de la publication.',
          'Bloque le ou les comptes et utilise l’outil « Signaler » du réseau social.',
          'Parles-en à un adulte de confiance et appelle le 3018 (gratuit, 7j/7 de 9h à 23h, aussi par tchat).',
        ],
      },
      {
        heading: 'Faire supprimer un contenu',
        paragraphs: [
          'Le 3018, opéré par l’association e-Enfance, peut demander aux plateformes la suppression rapide de contenus ou de comptes qui te nuisent.',
          'Un contenu illégal (menaces, diffusion d’images intimes, incitation à la haine…) peut aussi être signalé sur Pharos, la plateforme officielle du ministère de l’Intérieur, ou sur Point de Contact.',
        ],
      },
      {
        heading: 'À ne pas faire',
        bullets: [
          'Supprimer les messages avant d’avoir fait des captures.',
          'Partager ou commenter le contenu qui te vise, même pour te défendre.',
        ],
      },
    ],
    sources: [SRC.e3018, SRC.eduNonHarcelement, SRC.pharos, SRC.pointContact],
  },
  {
    id: 'je-suis-victime',
    title: 'Je suis victime : que faire ?',
    category: 'victime',
    summary: 'En parler, être accompagné·e, et savoir que l’établissement doit agir.',
    readingMinutes: 3,
    updatedAt: '2026-11-20',
    sections: [
      {
        heading: 'En parler, c’est le premier pas',
        paragraphs: [
          'Parle à un adulte de confiance : parent, professeur, CPE, infirmier ou infirmière scolaire, direction. Si c’est trop difficile en face, le 3018 t’écoute par téléphone ou par tchat, sans donner ton nom.',
        ],
      },
      {
        heading: 'Concrètement',
        bullets: [
          'Note ce qui se passe : dates, lieux, mots exacts, témoins (le carnet MBT est fait pour ça).',
          'Garde les preuves (captures d’écran, messages).',
          'Évite si possible de rester seul·e avec les personnes qui te harcèlent.',
          'Avec tes parents, demandez un rendez-vous à la direction de l’établissement : elle doit mettre en place un protocole de prise en charge.',
        ],
      },
      {
        heading: 'Si tu es en danger',
        paragraphs: ['Appelle le 17 ou le 112. Si tu ne peux pas parler, envoie un SMS au 114.'],
      },
      {
        heading: 'Porter plainte',
        paragraphs: [
          'Le harcèlement scolaire est un délit : il est possible de porter plainte au commissariat ou à la gendarmerie, ou de commencer la démarche en ligne. Un mineur peut être accompagné par ses parents.',
        ],
      },
    ],
    sources: [SRC.eduVictime, SRC.spCollege, SRC.e3018, SRC.plainte],
  },
  {
    id: 'je-suis-temoin',
    title: 'Je suis témoin : comment aider ?',
    category: 'temoin',
    summary: 'Ne pas rire, ne pas partager, soutenir la victime et alerter un adulte.',
    readingMinutes: 2,
    updatedAt: '2026-11-20',
    sections: [
      {
        paragraphs: [
          'Le harcèlement s’appuie souvent sur le silence ou les rires du groupe. Un témoin qui réagit peut tout changer, sans se mettre en danger.',
        ],
      },
      {
        heading: 'Ce que tu peux faire',
        bullets: [
          'Ne pas rire, ne pas liker, ne pas partager.',
          'Aller voir la victime après : lui dire que ce n’est pas normal et que tu es là.',
          'Prévenir un adulte de confiance (CPE, professeur, parent).',
          'Appeler ou écrire au 3018 : les témoins peuvent aussi signaler.',
        ],
      },
      {
        heading: 'Si quelqu’un est blessé ou en danger',
        paragraphs: ['Préviens immédiatement un adulte et appelle le 15 (blessure), le 17 ou le 112.'],
      },
    ],
    sources: [SRC.eduNonHarcelement, SRC.e3018, SRC.spUrgences],
  },
  {
    id: 'garder-des-preuves',
    title: 'Comment conserver des preuves ?',
    category: 'preuves',
    summary: 'Des preuves datées et complètes aident l’établissement, le 3018 et la police à agir.',
    readingMinutes: 3,
    updatedAt: '2026-11-20',
    sections: [
      {
        heading: 'Pour ce qui se passe en ligne',
        bullets: [
          'Capture d’écran complète : on doit voir le contenu, le pseudo, la date et, si possible, l’adresse (URL) du profil ou de la publication.',
          'Garde aussi le lien du profil de l’auteur.',
          'Ne supprime rien avant d’avoir sauvegardé.',
          'Sauvegarde les captures ailleurs que sur ton téléphone (ou confie-les à un adulte).',
        ],
      },
      {
        heading: 'Pour ce qui se passe « en vrai »',
        bullets: [
          'Note chaque fait dès que possible : date, heure, lieu, mots exacts, témoins.',
          'En cas de blessure, consulte un médecin : un certificat médical est une preuve.',
          'Garde les objets abîmés ou volés retrouvés.',
        ],
      },
      {
        heading: 'Avec MBT',
        paragraphs: [
          'Le carnet protégé chiffre tes notes et captures sur ton appareil, avec un code. Tu peux exporter un rapport daté à remettre à un adulte, à l’établissement ou à joindre à une plainte.',
        ],
      },
    ],
    sources: [SRC.e3018, SRC.pharos, SRC.plainte],
  },
  {
    id: 'a-qui-s-adresser',
    title: 'Demander de l’aide : à qui s’adresser ?',
    category: 'aide',
    summary: 'Le bon numéro selon la situation, en un coup d’œil.',
    readingMinutes: 2,
    updatedAt: '2026-11-20',
    sections: [
      {
        heading: 'Danger immédiat',
        bullets: [
          '17 : police ou gendarmerie.',
          '15 : SAMU (blessure, malaise).',
          '112 : numéro d’urgence européen.',
          '114 : par SMS, si tu ne peux pas parler ou entendre (24h/24).',
        ],
      },
      {
        heading: 'Harcèlement, cyberharcèlement',
        bullets: ['3018 : numéro national unique, gratuit et anonyme, 7j/7 de 9h à 23h, aussi par tchat et appli.'],
      },
      {
        heading: 'Quand ça ne va pas du tout',
        bullets: [
          '3114 : prévention du suicide, 24h/24, gratuit.',
          '119 : enfance en danger, 24h/24, gratuit.',
          'Fil Santé Jeunes (12–25 ans) : 0 800 235 236, 7j/7 de 9h à 23h.',
        ],
      },
      {
        heading: 'Après une infraction',
        bullets: [
          '116 006 : aide aux victimes (France Victimes), 7j/7 de 9h à 20h.',
          'Ma Sécurité : tchat avec un policier ou un gendarme 24h/24, avec un espace pour les mineurs.',
        ],
      },
    ],
    sources: [SRC.spUrgences, SRC.justiceUrgence, SRC.urgence114, SRC.e3018, SRC.s3114, SRC.allo119, SRC.justice116, SRC.maSecurite],
  },
  {
    id: 'parents-reperer-agir',
    title: 'Parents : repérer les signes et agir',
    category: 'parents',
    summary: 'Les signaux faibles, comment en parler, et les démarches auprès de l’établissement.',
    readingMinutes: 4,
    updatedAt: '2026-11-20',
    sections: [
      {
        heading: 'Des signes qui peuvent alerter',
        bullets: [
          'Refus d’aller à l’école, maux de ventre ou de tête le matin.',
          'Troubles du sommeil, de l’appétit, repli sur soi, tristesse.',
          'Baisse des résultats, affaires abîmées ou « perdues ».',
          'Inquiétude en consultant son téléphone, ou au contraire arrêt brutal des écrans.',
        ],
      },
      {
        heading: 'En parler',
        bullets: [
          'Choisir un moment calme, écouter sans juger ni minimiser.',
          'Éviter de confisquer le téléphone en punition : l’enfant risquerait de ne plus rien dire.',
          'Lui dire que ce n’est pas de sa faute et que vous allez l’aider.',
        ],
      },
      {
        heading: 'Agir',
        bullets: [
          'Demander rapidement un rendez-vous à la direction de l’établissement, puis confirmer par écrit.',
          'Contacter le 3018 (aussi ouvert aux parents) pour être conseillé et faire supprimer des contenus.',
          'Conserver les preuves ; porter plainte si nécessaire.',
        ],
      },
    ],
    sources: [SRC.eduParent, SRC.spCollege, SRC.spPrimaire, SRC.e3018, SRC.jeProtege],
  },
  {
    id: 'professionnels',
    title: 'Professionnels de l’éducation : les repères',
    category: 'pros',
    summary: 'Le cadre national de lutte contre le harcèlement et les relais disponibles.',
    readingMinutes: 2,
    updatedAt: '2026-11-20',
    sections: [
      {
        paragraphs: [
          'Le ministère de l’Éducation nationale déploie une politique de prévention et de traitement du harcèlement dans les écoles et les établissements (programme pHARe, protocole de prise en charge, référents).',
        ],
      },
      {
        heading: 'Relais utiles',
        bullets: [
          'Le 3018 est aussi ouvert aux professionnels ; ses écoutants peuvent transmettre des signalements à l’Éducation nationale.',
          'En cas de danger pour un enfant : le 119 et la cellule départementale de recueil des informations préoccupantes.',
        ],
      },
    ],
    sources: [SRC.eduPolitique, SRC.eduNonHarcelement, SRC.e3018, SRC.allo119],
  },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function searchArticles(query: string, category?: ArticleCategory | null): Article[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return ARTICLES.filter((a) => {
    if (category && a.category !== category) return false;
    if (!terms.length) return true;
    const hay = fold(
      [a.title, a.summary, ARTICLE_CATEGORIES[a.category].label, ...a.sections.flatMap((s) => [s.heading ?? '', ...(s.paragraphs ?? []), ...(s.bullets ?? [])])].join(' ')
    );
    return terms.every((t) => hay.includes(t));
  });
}

export const formatDateFr = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
