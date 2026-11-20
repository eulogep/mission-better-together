export const PERSPECTIVES = [
  { id: 'eleve', label: 'Je le vis' },
  { id: 'temoin', label: 'Je l’ai vu' },
  { id: 'parent', label: 'Je suis parent' },
] as const;

export const RECIPIENTS = [
  { id: 'proche', label: 'Une personne proche' },
  { id: 'etablissement', label: 'Un adulte de l’établissement' },
] as const;

export const REQUESTS = [
  { id: 'ecoute', label: 'Être écouté·e' },
  { id: 'soutien', label: 'Être accompagné·e' },
  { id: 'rendez-vous', label: 'Demander un rendez-vous' },
] as const;

type Perspective = (typeof PERSPECTIVES)[number]['id'];
type Recipient = (typeof RECIPIENTS)[number]['id'];
type Request = (typeof REQUESTS)[number]['id'];

export interface DraftDetails {
  perspective: Perspective;
  recipient: Recipient;
  request: Request;
  facts: string;
}

const BACKGROUND: Record<Perspective, string> = {
  eleve: 'Je vis une situation qui me pèse et j’aimerais en parler.',
  temoin: 'J’ai été témoin d’une situation qui m’inquiète.',
  parent: 'Je suis préoccupé·e par une situation que vit mon enfant.',
};

const OPENING: Record<Recipient, string> = {
  proche: 'Est-ce qu’on peut prendre un moment pour parler en privé ?',
  etablissement: 'Bonjour, est-ce que vous auriez un moment pour me parler en privé ?',
};

const NEXT_STEP: Record<Recipient, Record<Request, string>> = {
  proche: {
    ecoute: 'J’aimerais que tu m’écoutes et qu’on réfléchisse à la suite ensemble.',
    soutien: 'Est-ce que tu peux m’accompagner pour en parler à quelqu’un qui pourra aider ?',
    'rendez-vous': 'Est-ce qu’on peut convenir d’un moment pour se voir et en discuter ?',
  },
  etablissement: {
    ecoute: 'J’aimerais vous expliquer la situation et savoir quelle aide est possible.',
    soutien: 'Pouvez-vous m’aider à trouver la bonne personne à qui en parler et à préparer la suite ?',
    'rendez-vous': 'Pourrions-nous convenir d’un rendez-vous pour en discuter et voir quelles suites sont possibles ?',
  },
};

export function buildConversationDraft({ perspective, recipient, request, facts }: DraftDetails): string {
  return [OPENING[recipient], BACKGROUND[perspective], facts.trim(), NEXT_STEP[recipient][request]]
    .filter(Boolean)
    .join('\n\n');
}
