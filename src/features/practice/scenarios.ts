interface PracticeChoice {
  label: string;
  feedback: string;
}

export interface PracticeScenario {
  id: string;
  role: string;
  title: string;
  situation: string;
  storyId: string;
  image: string;
  imageFocusY: number;
  choices: readonly PracticeChoice[];
  starter: string;
  recipient: string;
  articleId: string;
  sourceUrl: string;
}

// Sources officielles vérifiées le 20 novembre 2026.
export const PRACTICE_SCENARIOS: readonly PracticeScenario[] = [
  {
    id: 'groupe-de-classe',
    role: 'Tu es témoin',
    title: 'Dans le groupe de classe',
    situation: 'Depuis plusieurs soirs, des élèves se moquent de Léa dans le groupe de classe. Ce soir, elle quitte la conversation. Tu as vu les messages.',
    storyId: 'ines',
    image: '/assets/recits/ines.webp',
    imageFocusY: 24,
    choices: [
      {
        label: 'J’écris à Léa en privé et je propose de l’accompagner.',
        feedback: 'Léa peut savoir qu’elle a ton soutien sans être exposée à nouveau dans le groupe. Tu peux lui proposer d’en parler ensemble à un adulte de confiance.',
      },
      {
        label: 'Je transfère les messages à mes amis pour qu’ils comprennent.',
        feedback: 'Même avec l’intention d’aider, un transfert peut prolonger la diffusion des moqueries. Tu peux signaler les messages et expliquer ce que tu as vu à un adulte, en privé.',
      },
      {
        label: 'Je quitte le groupe pour ne plus recevoir les messages.',
        feedback: 'Te retirer peut t’aider à prendre du recul. Tu peux aussi soutenir Léa en dehors du groupe ou parler de ce que tu as vu à un adulte.',
      },
    ],
    recipient: 'À un adulte de confiance',
    starter: 'Est-ce qu’on peut parler en privé ? Dans le groupe de classe, j’ai vu plusieurs messages qui se moquent d’une camarade. J’aimerais de l’aide pour savoir comment la soutenir.',
    articleId: 'je-suis-temoin',
    sourceUrl: 'https://www.education.gouv.fr/non-au-harcelement/je-suis-victime-de-harcelement-468671',
  },
  {
    id: 'apres-le-cours',
    role: 'Tu vis les moqueries',
    title: 'Après le cours',
    situation: 'Des élèves imitent ton accent chaque fois que tu lis en classe. Aujourd’hui, tu avais envie de participer, mais tu n’as pas osé lever la main. Ton professeur range ses affaires.',
    storyId: 'samir',
    image: '/assets/recits/samir.webp',
    imageFocusY: 32,
    choices: [
      {
        label: 'Je demande un moment en privé à mon professeur.',
        feedback: 'Un moment à l’écart peut te laisser plus de place pour parler. Dire que les moqueries se répètent et donner un exemple concret peut aider le professeur à comprendre ce qui se passe.',
      },
      {
        label: 'J’en parle d’abord à une personne de ma classe.',
        feedback: 'Commencer par quelqu’un avec qui tu te sens à l’aise peut faciliter la suite. Cette personne peut t’accompagner si tu veux en parler à un adulte.',
      },
      {
        label: 'J’attends que ça passe. Je ne trouve pas les mots.',
        feedback: 'C’est compréhensible d’hésiter. Tu peux écrire une phrase ou noter un exemple, puis la montrer à une personne de confiance. Demander de l’aide reste possible même si les premiers faits remontent à un moment.',
      },
    ],
    recipient: 'À une personne de confiance',
    starter: 'J’aimerais te parler en privé. Des élèves se moquent de mon accent quand je lis en classe et ça se répète. J’ai besoin d’aide pour que ça s’arrête.',
    articleId: 'je-suis-victime',
    sourceUrl: 'https://www.education.gouv.fr/non-au-harcelement/je-suis-victime-de-harcelement-468671',
  },
  {
    id: 'au-retour-de-lecole',
    role: 'Tu es parent',
    title: 'Au retour de l’école',
    situation: 'Depuis plusieurs jours, ton enfant cherche à éviter le bus scolaire. Ce soir, à table, il te dit que des élèves l’humilient dans le bus, puis baisse les yeux.',
    storyId: 'parent-alex',
    image: '/assets/recits/sophie.webp',
    imageFocusY: 38,
    choices: [
      {
        label: 'Je le remercie de m’en parler et je l’écoute.',
        feedback: 'Tu lui montres que tu prends sa parole au sérieux. Une fois que tu as compris ce qu’il te raconte, tu peux noter les faits avec lui et contacter l’établissement.',
      },
      {
        label: 'Je veux parler directement aux autres élèves.',
        feedback: 'Vouloir agir tout de suite est compréhensible. Passer par l’établissement permet de partager les faits et de demander une réponse qui protège ton enfant, sans confrontation directe.',
      },
      {
        label: 'Je lui propose un autre trajet dès demain.',
        feedback: 'Un autre trajet peut soulager une inquiétude immédiate. Il reste important d’écouter ton enfant et d’alerter l’établissement pour que les faits soient pris en charge.',
      },
    ],
    recipient: 'À dire à ton enfant',
    starter: 'Merci de me l’avoir dit. Je prends ce que tu me racontes au sérieux. Je suis là pour t’écouter et on va demander de l’aide ensemble.',
    articleId: 'parents-reperer-agir',
    sourceUrl: 'https://www.education.gouv.fr/non-au-harcelement/mon-enfant-est-victime-de-harcelement-323014',
  },
];
