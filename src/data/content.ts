import { normalizePhone } from '../lib/device';

export { normalizePhone };

export type ProfileId = 'primaire' | 'college' | 'adulte' | 'parent';
export type ThemeKey = 'default' | 'sinformer' | ProfileId;
export type AdviceTopic = 'que-dire' | 'que-faire' | 'qui-appeler';

export interface ThemePalette {
  id: ThemeKey;
  label: string;
  brandColor: string;
  watermarkColor: string;
  accent: string;
  cardBg: string;
  cardText: string;
  badgeText: string;
}

export const THEMES: Record<ThemeKey, ThemePalette> = {
  default: {
    id: 'default',
    label: 'MBT',
    brandColor: 'rgba(255, 222, 83, 0.37)',
    watermarkColor: 'rgba(255, 222, 83, 0.37)',
    accent: '#FF8989',
    cardBg: '#FFF8D6',
    cardText: '#3B3B3B',
    badgeText: '#D4A800',
  },
  sinformer: {
    id: 'sinformer',
    label: "S'informer",
    brandColor: '#7174AA',
    watermarkColor: '#7174AA',
    accent: '#7174AA',
    cardBg: '#7174AA',
    cardText: '#FFFFFF',
    badgeText: '#7174AA',
  },
  primaire: {
    id: 'primaire',
    label: 'PRIMAIRE',
    brandColor: '#00E8AE',
    watermarkColor: '#00E8AE',
    accent: '#00E8AE',
    cardBg: '#00E8AE',
    cardText: '#3B3B3B',
    badgeText: '#00E8AE',
  },
  college: {
    id: 'college',
    label: 'COLLÈGE / LYCÉE',
    brandColor: '#C691C9',
    watermarkColor: '#C691C9',
    accent: '#C691C9',
    cardBg: '#C691C9',
    cardText: '#3B3B3B',
    badgeText: '#C691C9',
  },
  adulte: {
    id: 'adulte',
    label: 'ADULTE',
    brandColor: '#3B3B3B',
    watermarkColor: '#3B3B3B',
    accent: '#3B3B3B',
    cardBg: '#3B3B3B',
    cardText: '#FFFFFF',
    badgeText: '#3B3B3B',
  },
  parent: {
    id: 'parent',
    label: 'PARENT',
    brandColor: '#8C5734',
    watermarkColor: '#8C5734',
    accent: '#8C5734',
    cardBg: '#8C5734',
    cardText: '#FFFFFF',
    badgeText: '#8C5734',
  },
};

export interface ProfileHubConfig {
  id: ProfileId;
  badge: string;
  shortLabel: string;
  multilineLabel?: [string, string];
  hubLayout: 'primaire-3' | 'grid-4';
  buttons: {
    conseils: string;
    temoignages: string;
    specialistes?: string;
    contacts: string;
  };
  advice: Record<
    AdviceTopic,
    {
      title: string;
      paragraphs: string[];
      quickNumbers?: { number: string; label: string }[];
    }
  >;
}

export const PROFILES: Record<ProfileId, ProfileHubConfig> = {
  primaire: {
    id: 'primaire',
    badge: 'PRIMAIRE',
    shortLabel: 'PRIMAIRE',
    hubLayout: 'primaire-3',
    buttons: {
      conseils: 'CONSEIL',
      temoignages: 'HISTOIRES',
      contacts: "NUMERO\nD'AIDE",
    },
    advice: {
      'que-dire': {
        title: 'QUE DIRE ?',
        paragraphs: [
          'Reste calme et riposte, dis :',
          '« Arrête, ça ne me plaît pas. »\n« Laisse-moi tranquille. »',
          'Évite de réagir par la colère pour ne pas encourager celui qui t’embête.',
          'Dis-lui que tu en parleras à un adulte.',
        ],
      },
      'que-faire': {
        title: 'QUE FAIRE ?',
        paragraphs: [
          'Parle tout de suite à un adulte de confiance (enseignant, parent, directeur).',
          'Note ce qui s’est passé (dates, heures, témoins).',
          'Évite de rester seul avec ceux qui t’embêtent.',
        ],
      },
      'qui-appeler': {
        title: 'QUI APPELER ?',
        paragraphs: [
          '3018 — le numéro national contre le harcèlement, à l’école comme sur internet. C’est gratuit.',
          'Association locale d’aide à l’enfance.',
        ],
        quickNumbers: [
          { number: '3018', label: '3018 · Harcèlement' },
          { number: '119', label: '119 · Enfance en danger' },
        ],
      },
    },
  },
  college: {
    id: 'college',
    badge: 'COLLÈGE / LYCÉE',
    shortLabel: 'COLLÈGE LYCÉE',
    multilineLabel: ['COLLÈGE', 'LYCÉE'],
    hubLayout: 'grid-4',
    buttons: {
      conseils: 'CONSEILS',
      temoignages: 'RÉCITS',
      specialistes: "AIDE\nD'UN ADULTE",
      contacts: 'MES CONTACTS',
    },
    advice: {
      'que-dire': {
        title: 'QUE DIRE ?',
        paragraphs: [
          'Affirme-toi :',
          '« Ton comportement est inacceptable. »\n« Je ne vais pas tolérer ça. »',
          'Sur les réseaux sociaux, ne réponds pas et signale immédiatement.',
        ],
      },
      'que-faire': {
        title: 'QUE FAIRE ?',
        paragraphs: [
          'Parle tout de suite à un adulte de confiance (enseignant, parent, directeur).',
          'Note ce qui s’est passé (dates, heures, témoins).',
          'Évite de rester seul avec le ou les agresseurs.',
          'Ne réponds pas aux cyberharceleurs et signale directement.',
        ],
      },
      'qui-appeler': {
        title: 'QUI APPELER ?',
        paragraphs: [
          '3018 : numéro national unique contre le harcèlement scolaire et le cyberharcèlement (7j/7, 9h–23h, aussi par tchat).',
          '119 (Enfance en danger) si la situation met ta sécurité en jeu.',
        ],
        quickNumbers: [
          { number: '3018', label: '3018 · Harcèlement & cyberharcèlement' },
          { number: '119', label: '119 · Enfance en danger' },
        ],
      },
    },
  },
  adulte: {
    id: 'adulte',
    badge: 'ADULTE',
    shortLabel: 'ADULTE',
    hubLayout: 'grid-4',
    buttons: {
      conseils: 'CONSEILS',
      temoignages: 'RÉCITS',
      specialistes: 'SPECIALISTES',
      contacts: 'MES CONTACTS',
    },
    advice: {
      'que-dire': {
        title: 'QUE DIRE ?',
        paragraphs: [
          'Sois direct et ferme :',
          '« Je ne tolérerai pas ce comportement. »\n« C’est un comportement irrespectueux, je vais signaler cela. »',
          'Ne minimise pas l’acte, surtout s’il est récurrent.',
        ],
      },
      'que-faire': {
        title: 'QUE FAIRE ?',
        paragraphs: [
          'Parle tout de suite à un référent de confiance (responsable, RH, direction, proche).',
          'Note ce qui s’est passé (dates, heures, captures d’écran, témoins).',
          'Évite de rester seul avec le ou les agresseurs.',
          'Ne réponds pas aux cyberharceleurs et signale directement.',
        ],
      },
      'qui-appeler': {
        title: 'QUI APPELER ?',
        paragraphs: [
          '3018 pour cyberharcèlement.',
          '3919 pour violences ou harcèlement sexuel.',
          'SOS étudiants ou associations locales.',
        ],
        quickNumbers: [
          { number: '3018', label: '3018 · Cyberharcèlement' },
          { number: '3919', label: '3919 · Violences & harcèlement' },
          { number: '3114', label: '3114 · Prévention suicide' },
        ],
      },
    },
  },
  parent: {
    id: 'parent',
    badge: 'PARENT',
    shortLabel: 'PARENT',
    hubLayout: 'grid-4',
    buttons: {
      conseils: 'CONSEILS',
      temoignages: 'RÉCITS',
      specialistes: 'SPECIALISTES',
      contacts: 'MES CONTACTS',
    },
    advice: {
      'que-dire': {
        title: 'QUE DIRE ?',
        paragraphs: [
          'Soyez direct et ferme :',
          '« Ce comportement est inacceptable. »\n« Je vais signaler cette situation. »',
          'Ne minimisez pas l’acte, surtout s’il est récurrent.',
        ],
      },
      'que-faire': {
        title: 'QUE FAIRE ?',
        paragraphs: [
          'Se diriger vers le centre d’administration de l’établissement.',
          'Faire part des événements au groupe d’enseignants / d’encadrants.',
          'Contacter les autorités compétentes.',
        ],
      },
      'qui-appeler': {
        title: 'QUI APPELER ?',
        paragraphs: [
          '3018 pour cyberharcèlement.',
          '3919 pour violences ou harcèlement sexuel.',
          'SOS étudiants ou associations locales.',
          'Association locale d’aide à l’enfance.',
        ],
        quickNumbers: [
          { number: '3018', label: '3018 · Harcèlement & cyberharcèlement' },
          { number: '3919', label: '3919 · Violences' },
        ],
      },
    },
  },
};

export interface EmergencyServiceInfo {
  code: string;
  displayName: string;
  dialNumber: string;
  subtitle: string;
  availability: string;
  description: string;
  /** Peut aussi être joint par écrit (tchat) : lien officiel */
  chatUrl?: string;
  chatLabel?: string;
  /** Numéro joignable uniquement par SMS (114) */
  smsOnly?: boolean;
}

export const EMERGENCY_SERVICES: Record<string, EmergencyServiceInfo> = {
  urgence: {
    code: 'urgence',
    displayName: '112',
    dialNumber: '112',
    subtitle: 'Numéro d’urgence européen',
    availability: '24h/24 · 7j/7 · Gratuit',
    description:
      'Le 112 met en relation avec les secours (police, gendarmerie, SAMU, pompiers), partout dans l’Union européenne. MBT n’opère aucun service d’urgence : l’appel passe directement par ton téléphone.',
  },
  '3018': {
    code: '3018',
    displayName: '3018',
    dialNumber: '3018',
    subtitle: 'Harcèlement & Cyberharcèlement',
    availability: '7j/7 · 9h à 23h · Gratuit & Anonyme',
    description:
      'Numéro national unique contre le harcèlement scolaire et le cyberharcèlement, opéré par l’association e-Enfance. Psychologues, juristes et spécialistes du numérique ; peut faire supprimer des contenus en ligne. Ce n’est pas un numéro d’urgence.',
    chatUrl: 'https://e-enfance.org/besoin-daide/',
    chatLabel: 'Tchat, WhatsApp, Messenger ou appli 3018 (association e-Enfance)',
  },
  '3114': {
    code: '3114',
    displayName: '3114',
    dialNumber: '3114',
    subtitle: 'Prévention du Suicide',
    availability: '24h/24 · 7j/7 · Gratuit & Confidentiel',
    description:
      'Numéro national de prévention du suicide. Des professionnels de soin (infirmiers, psychologues) répondent immédiatement en toute bienveillance.',
    chatUrl: 'https://3114.fr/',
    chatLabel: 'Site officiel du 3114',
  },
  '17': {
    code: '17',
    displayName: '17',
    dialNumber: '17',
    subtitle: 'Police Secours',
    availability: '24h/24 · 7j/7 · Urgence immédiate',
    description:
      'Police ou gendarmerie, en cas d’agression, de menace ou de danger immédiat.',
  },
  '119': {
    code: '119',
    displayName: '119',
    dialNumber: '119',
    subtitle: 'Allô Enfance en Danger',
    availability: '24h/24 · 7j/7 · Gratuit & Confidentiel',
    description:
      'Service national d’accueil téléphonique pour l’enfance en danger. N’apparaît pas sur les relevés téléphoniques.',
  },
  '3919': {
    code: '3919',
    displayName: '3919',
    dialNumber: '3919',
    subtitle: 'Violences Femmes Info',
    availability: '24h/24 · 7j/7 · Anonyme & Gratuit',
    description:
      'Écoute, information et orientation pour les victimes de violences sexistes, sexuelles ou de harcèlement.',
  },
  '15': {
    code: '15',
    displayName: '15',
    dialNumber: '15',
    subtitle: 'SAMU · Urgences médicales',
    availability: '24h/24 · 7j/7 · Gratuit',
    description:
      'Secours médicaux d’urgence en cas de blessure physique ou de détresse médicale immédiate.',
  },
  '114': {
    code: '114',
    displayName: '114',
    dialNumber: '114',
    subtitle: 'Urgence par SMS',
    availability: '24h/24 · 7j/7 · Gratuit',
    description:
      'Si vous ne pouvez pas parler (agresseur à proximité, difficulté à entendre ou à parler), envoyez un SMS au 114 : il alerte police, gendarmerie, SAMU ou pompiers.',
    smsOnly: true,
  },
  '116006': {
    code: '116006',
    displayName: '116 006',
    dialNumber: '116 006',
    subtitle: 'France Victimes · Aide aux victimes',
    availability: '7j/7 · 9h à 20h · Gratuit',
    description:
      'Numéro national d’aide aux victimes d’infractions (ministère de la Justice, réseau France Victimes) : écoute, information sur les droits, orientation vers une association près de chez toi.',
    chatUrl: 'https://www.france-victimes.fr/',
    chatLabel: 'Site de France Victimes',
  },
  '0800235236': {
    code: '0800235236',
    displayName: 'Fil Santé Jeunes',
    dialNumber: '0 800 235 236',
    subtitle: 'Écoute des 12–25 ans',
    availability: '7j/7 · 9h à 23h · Gratuit & Anonyme',
    description:
      'Des professionnels écoutent les jeunes sur tous les sujets : mal-être, harcèlement, relations, santé. Par téléphone ou par tchat.',
    chatUrl: 'https://www.filsantejeunes.com/',
    chatLabel: 'Tchat Fil Santé Jeunes',
  },
};

/** Démarches officielles en ligne pour signaler ou porter plainte. */
export const REPORT_LINKS: { label: string; detail: string; url: string }[] = [
  {
    label: 'Signaler un contenu en ligne (Pharos)',
    detail: 'Plateforme officielle pour signaler un contenu illicite sur internet.',
    url: 'https://www.internet-signalement.gouv.fr/',
  },
  {
    label: 'Porter plainte en ligne',
    detail: 'Plainte et pré-plainte en ligne du ministère de l’Intérieur.',
    url: 'https://www.masecurite.interieur.gouv.fr/fr/demarches-en-ligne/plainte-en-ligne',
  },
  {
    label: 'Tchater avec un policier ou un gendarme (Ma Sécurité)',
    detail: 'Victimes et témoins de violences, y compris harcèlement : tchat 24h/24 ; espace dédié aux mineurs.',
    url: 'https://www.masecurite.interieur.gouv.fr/fr',
  },
];

/** Renvoie la clé du service national si le numéro en est un (3018, 17, 119…), sinon null. */
export function findServiceKey(phone: string): string | null {
  const n = normalizePhone(phone);
  return n !== 'urgence' && n in EMERGENCY_SERVICES ? n : null;
}

export interface TestimonyItem {
  id: string;
  title: string;
  speaker: string;
  ageLabel: string;
  thumbnail: string;
  cover: string;
  category: string;
  transcriptFr: string[];
  transcriptEn: string[];
}

/**
 * Fichier audio (voix ElevenLabs) d'un témoignage, généré par `npm run voices`.
 * S'il n'existe pas, le lecteur utilise la voix de synthèse du téléphone.
 */
export const testimonyAudioUrl = (item: TestimonyItem, lang: 'fr' | 'en'): string | undefined =>
  lang === 'fr' ? `/audio/temoignage-${item.id}-fr.mp3` : undefined;

export const TESTIMONIES: TestimonyItem[] = [
  {
    id: 'lina',
    title: '« Il s’appelait Ange mais c’était plutôt un démon »',
    speaker: 'Lina, 14 ans',
    ageLabel: 'Collège',
    thumbnail: '/assets/temoignage-1.png',
    cover: '/assets/player-cover.png',
    category: 'Harcèlement scolaire',
    transcriptFr: [
      '« Au début, je pensais que ce n’était que des blagues dans la cour. Puis les moqueries ont continué tous les jours, jusque sur mon téléphone le soir. »',
      '« J’avais peur d’en parler parce que je ne voulais pas inquiéter mes parents. Je gardais tout pour moi et j’avais mal au ventre chaque matin avant d’aller en cours. »',
      '« Le jour où j’ai montré les messages à la CPE et appelé le 3018, tout a commencé à changer. Je me suis sentie écoutée pour la première fois. »',
      '« Si tu vis ça aujourd’hui : tu n’y es pour rien. Parle à un adulte de confiance, même si ça fait peur au début. »',
    ],
    transcriptEn: [
      '"At first, I thought it was just jokes in the schoolyard. Then the teasing went on every single day, even on my phone at night."',
      '"I was afraid to speak up because I didn’t want to worry my parents. I kept everything inside and had a stomachache every morning before class."',
      '"The day I showed the messages to the school counselor and called 3018, everything started to change. I felt truly heard for the first time."',
      '"If you are going through this today: it is not your fault. Talk to a trusted adult, even if it feels scary at first."',
    ],
  },
  {
    id: 'soojin',
    title: 'Briser le silence face au cyberharcèlement',
    speaker: 'Maya, 19 ans',
    ageLabel: 'Université',
    thumbnail: '/assets/temoignage-2.png',
    cover: '/assets/temoignage-2.png',
    category: 'Cyberharcèlement',
    transcriptFr: [
      '« Quand une rumeur a commencé à circuler dans un groupe étudiant, j’ai voulu tout effacer et disparaître des réseaux. »',
      '« Une amie m’a rappelé une règle essentielle : faire des captures d’écran avant de bloquer et signaler. Ce sont ces preuves qui ont permis d’agir vite. »',
      '« Grâce à la cellule d’écoute de l’université et au 3018, les contenus ont été supprimés en quelques heures. »',
    ],
    transcriptEn: [
      '"When a rumor started spreading in a student group chat, I wanted to delete everything and disappear from social media."',
      '"A close friend reminded me of one crucial rule: take screenshots before blocking and reporting. Those records made fast action possible."',
      '"With help from the university support unit and 3018, the posts were removed within hours."',
    ],
  },
  {
    id: 'camille',
    title: 'Comment un témoin m’a aidé à m’en sortir',
    speaker: 'Camille, 11 ans',
    ageLabel: 'Primaire',
    thumbnail: '/assets/temoignage-1.png',
    cover: '/assets/player-cover.png',
    category: 'Rôle du témoin',
    transcriptFr: [
      '« À la récréation, je restais toujours près du banc tout seul. Un camarade de CM2 est venu s’asseoir à côté de moi et a prévenu la maîtresse. »',
      '« Parfois, il suffit d’une seule personne qui ne rigole pas avec les autres pour que la peur diminue. »',
    ],
    transcriptEn: [
      '"At recess, I always sat alone near the bench. A fifth-grade classmate came to sit next to me and told the teacher."',
      '"Sometimes, just one person refusing to laugh along is enough to make the fear shrink."',
    ],
  },
  {
    id: 'parent-alex',
    title: 'Repérer les signaux faibles chez son enfant',
    speaker: 'Sophie, maman de Léo',
    ageLabel: 'Parent',
    thumbnail: '/assets/temoignage-1.png',
    cover: '/assets/player-cover.png',
    category: 'Parole de parent',
    transcriptFr: [
      '« Mon fils ne disait rien, mais il dormait mal et refusait soudainement de prendre le bus scolaire. »',
      '« En prenant un moment calme sans jugement, sans lui confisquer son téléphone par punition, il a enfin pu mettre des mots sur ce qu’il subissait. »',
      '« Nous avons ensuite demandé un rendez-vous écrit avec la direction de l’établissement pour mettre en place un suivi immédiat. »',
    ],
    transcriptEn: [
      '"My son didn’t say anything, yet he was sleeping poorly and suddenly refused to take the school bus."',
      '"By creating a calm, judgment-free moment—without taking his phone away as punishment—he was finally able to describe what was happening."',
      '"We then requested a formal meeting with the school leadership to put immediate protection in place."',
    ],
  },
  {
    id: 'nadia',
    title: 'Retrouver confiance après des mois d’isolement',
    speaker: 'Nadia, 16 ans',
    ageLabel: 'Lycée',
    thumbnail: '/assets/temoignage-1.png',
    cover: '/assets/player-cover.png',
    category: 'Reconstruction',
    transcriptFr: [
      '« Parler avec un psychologue m’a permis de comprendre que ma valeur ne dépendait pas des insultes reçues au lycée. »',
      '« Aujourd’hui, je suis ambassadrice contre le harcèlement dans mon établissement pour aider les plus jeunes. »',
    ],
    transcriptEn: [
      '"Speaking with a psychologist helped me realize my self-worth never depended on the insults I heard at high school."',
      '"Today, I am an anti-bullying ambassador at my school so younger students never feel alone."',
    ],
  },
  {
    id: 'theo',
    title: 'Dire stop au harcèlement au travail et en stage',
    speaker: 'Théo, 22 ans',
    ageLabel: 'Adulte',
    thumbnail: '/assets/temoignage-1.png',
    cover: '/assets/player-cover.png',
    category: 'Vie étudiante & pro',
    transcriptFr: [
      '« Pendant mon stage, les remarques humiliantes devant l’équipe étaient présentées comme de l’humour. »',
      '« Tenir un journal daté des faits et solliciter mon tuteur d’école m’a donné la force de réagir sereinement et légalement. »',
    ],
    transcriptEn: [
      '"During my internship, humiliating remarks in front of the team were disguised as humor."',
      '"Keeping a dated log of incidents and reaching out to my academic advisor gave me the strength to respond calmly and legally."',
    ],
  },
];

export type ContactGroup = 'Confiance' | 'Aide' | 'Établissement' | 'Autre';

export interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: ContactGroup;
  note?: string;
  /** Personne de confiance : reçoit les alertes « Alerter mes proches » */
  trusted?: boolean;
}

/**
 * Contacts fournis par défaut : uniquement de vrais numéros nationaux.
 * Les proches (parents, amis, CPE…) sont ajoutés par l'utilisateur.
 */
export const HELP_CONTACTS: ContactItem[] = [
  { id: 'svc-3018', firstName: 'Harcèlement', lastName: '3018', phone: '3018', group: 'Aide', note: 'Numéro unique · 7j/7 9h–23h' },
  { id: 'svc-116006', firstName: 'Aide aux victimes', lastName: '116 006', phone: '116 006', group: 'Aide', note: 'France Victimes · 7j/7 9h–20h' },
  { id: 'svc-119', firstName: 'Allô Enfance', lastName: '119', phone: '119', group: 'Aide', note: 'Enfance en danger 24h/24' },
  { id: 'svc-3114', firstName: 'Prévention Suicide', lastName: '3114', phone: '3114', group: 'Aide', note: 'Écoute 24h/24' },
  { id: 'svc-fsj', firstName: 'Fil Santé Jeunes', lastName: '', phone: '0 800 235 236', group: 'Aide', note: '12–25 ans · 9h–23h' },
  { id: 'svc-3919', firstName: 'Violences Femmes Info', lastName: '3919', phone: '3919', group: 'Aide', note: '24h/24' },
  { id: 'svc-17', firstName: 'Police', lastName: 'Secours', phone: '17', group: 'Aide', note: 'Danger immédiat' },
  { id: 'svc-15', firstName: 'SAMU', lastName: '', phone: '15', group: 'Aide', note: 'Urgence médicale' },
  { id: 'svc-114', firstName: 'Urgence par SMS', lastName: '114', phone: '114', group: 'Aide', note: 'Si vous ne pouvez pas parler' },
];
