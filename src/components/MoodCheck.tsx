import { useEffect, useState } from 'react';
import {
  BellRing,
  BookOpen,
  Cloud,
  CloudLightning,
  CloudRain,
  ExternalLink,
  MessageCircle,
  NotebookPen,
  Phone,
  Sun,
  Wind,
  X,
} from 'lucide-react';
import { EMERGENCY_SERVICES } from '../data/content';
import { vibrate } from '../lib/device';

export type Mood = 'soleil' | 'nuage' | 'pluie' | 'orage';

export interface MoodActions {
  onBreathe: () => void;
  onChat: () => void;
  onJournal: () => void;
  onAlert: () => void;
  onSinformer: () => void;
  onCall: (serviceKey: string) => void;
}

const MOODS: { key: Mood; label: string; icon: typeof Sun; color: string }[] = [
  { key: 'soleil', label: 'Super', icon: Sun, color: '#F5B700' },
  { key: 'nuage', label: 'Bof', icon: Cloud, color: '#8EA2C8' },
  { key: 'pluie', label: 'Pas top', icon: CloudRain, color: '#7174AA' },
  { key: 'orage', label: 'Très mal', icon: CloudLightning, color: '#FF8989' },
];

const STORAGE_KEY = 'mbt_mood_v1';

type Suggestion =
  | { kind: 'call'; label: string; serviceKey: string }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'action'; label: string; action: keyof Omit<MoodActions, 'onCall'>; icon: typeof Sun };

const RESPONSES: Record<Mood, { title: string; text: string; suggestions: Suggestion[] }> = {
  soleil: {
    title: 'Ça fait plaisir !',
    text: 'Profite de cette bonne énergie. Tu peux aussi devenir un super témoin : savoir quoi faire quand quelqu’un d’autre est harcelé.',
    suggestions: [
      { kind: 'action', label: 'Comment aider les autres', action: 'onSinformer', icon: BookOpen },
      { kind: 'action', label: 'Une minute de calme quand même', action: 'onBreathe', icon: Wind },
    ],
  },
  nuage: {
    title: 'Les jours gris, ça arrive.',
    text: 'Prends une minute pour toi. Et si quelque chose te pèse, en parler aide souvent plus qu’on ne le croit.',
    suggestions: [
      { kind: 'action', label: 'Respirer 1 minute', action: 'onBreathe', icon: Wind },
      { kind: 'action', label: 'En parler à l’assistant', action: 'onChat', icon: MessageCircle },
    ],
  },
  pluie: {
    title: 'Merci de me le dire.',
    text: 'Tu n’as pas à gérer ça seul·e. Des personnes formées peuvent t’écouter, gratuitement et sans donner ton nom.',
    suggestions: [
      { kind: 'link', label: 'Écrire au 3018 (tchat)', url: EMERGENCY_SERVICES['3018'].chatUrl! },
      { kind: 'action', label: 'Respirer avec moi', action: 'onBreathe', icon: Wind },
      { kind: 'action', label: 'Noter ce qui s’est passé', action: 'onJournal', icon: NotebookPen },
    ],
  },
  orage: {
    title: 'Tu comptes. Vraiment.',
    text: 'Quand tout est trop lourd, parle à quelqu’un maintenant. Le 3114 répond jour et nuit, c’est gratuit et confidentiel.',
    suggestions: [
      { kind: 'call', label: 'Appeler le 3114 (24h/24)', serviceKey: '3114' },
      { kind: 'action', label: 'Prévenir un proche', action: 'onAlert', icon: BellRing },
      { kind: 'action', label: 'Respirer avec moi', action: 'onBreathe', icon: Wind },
    ],
  },
};

/** Salutation selon l'heure : l'app « remarque » qu'il est tard. */
function greeting(): string {
  const h = new Date().getHours();
  if (h >= 22 || h < 5) return 'Pas encore couché·e ?';
  if (h >= 18) return 'Bonsoir !';
  return 'Salut !';
}

function loadMood(): Mood | null {
  try {
    return (sessionStorage.getItem(STORAGE_KEY) as Mood | null) ?? null;
  } catch {
    return null;
  }
}

/** Widget « Ta météo du jour ? » : quatre humeurs, une réponse adaptée à chacune. */
export function useMoodCheck(actions: MoodActions) {
  const [mood, setMood] = useState<Mood | null>(loadMood);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (mood) sessionStorage.setItem(STORAGE_KEY, mood);
    } catch {
      // ignore
    }
  }, [mood]);

  const choose = (m: Mood) => {
    vibrate(m === 'orage' ? [20, 40, 20] : 15);
    setMood(m);
    setOpen(true);
  };

  const widget = (
    <div className="w-full rounded-[24px] bg-white/85 backdrop-blur-sm border-2 border-black/[0.07] px-2.5 pt-2.5 pb-2 shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
      <p className="px-1 font-ubuntu font-medium text-[12.5px] leading-tight text-[#1d1b20]">
        {greeting()} Ta météo&nbsp;?
      </p>
      <div className="mt-1.5 grid grid-cols-4" role="radiogroup" aria-label="Comment tu te sens aujourd’hui ?">
        {MOODS.map((m) => {
          const Icon = m.icon;
          const active = mood === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(m.key)}
              className="flex flex-col items-center gap-0.5 py-1 rounded-2xl cursor-pointer hover:bg-black/[0.04] transition"
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${active ? 'mbt-pop' : ''}`}
                style={{ backgroundColor: active ? `${m.color}26` : 'transparent', color: m.color }}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={2.3} />
              </span>
              <span className={`text-[9.5px] leading-none font-medium whitespace-nowrap ${active ? 'text-[#1d1b20]' : 'text-[#8e8e93]'}`}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const current = mood ? MOODS.find((m) => m.key === mood)! : null;
  const response = mood ? RESPONSES[mood] : null;

  const sheet =
    open && current && response ? (
      <div
        className="absolute inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-end mbt-fade-in"
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div
          role="dialog"
          aria-label={response.title}
          className="w-full bg-white rounded-t-[32px] px-5 pt-3 pb-8 shadow-2xl mbt-sheet-in"
        >
          <div className="mx-auto w-10 h-1.5 rounded-full bg-black/10" />
          <div className="mt-3 flex items-start gap-3">
            <span
              className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center mbt-pop"
              style={{ backgroundColor: `${current.color}22`, color: current.color }}
            >
              <current.icon className="w-8 h-8" strokeWidth={2.2} />
            </span>
            <div className="flex-1 pt-1">
              <h2 className="font-ubuntu font-bold text-[21px] leading-tight text-[#1d1b20]">{response.title}</h2>
              <p className="mt-1.5 text-[14px] leading-[1.5] text-[#3b3b3b]">{response.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="w-9 h-9 shrink-0 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {response.suggestions.map((s, i) => {
              const primary = i === 0;
              const cls = `flex items-center gap-3 px-5 py-3.5 rounded-[24px] font-ubuntu font-medium text-[16px] text-left active:scale-[0.98] transition cursor-pointer ${
                primary ? 'text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]' : 'bg-white border-[3px]'
              }`;
              const style = primary
                ? { backgroundColor: current.color === '#F5B700' ? '#7174AA' : current.color }
                : { borderColor: `${current.color}99`, color: '#1d1b20' };
              if (s.kind === 'link') {
                return (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
                    <ExternalLink className="w-5 h-5 shrink-0" />
                    {s.label}
                  </a>
                );
              }
              const Icon = s.kind === 'call' ? Phone : s.icon;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (s.kind === 'call') actions.onCall(s.serviceKey);
                    else actions[s.action]();
                  }}
                  className={cls}
                  style={style}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    ) : null;

  return { widget, sheet };
}
