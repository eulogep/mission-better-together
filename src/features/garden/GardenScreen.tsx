import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HandHeart, Leaf, MessageCircle, Moon, Sun } from 'lucide-react';
import { MOODS } from '../../components/MoodCheck';
import { ScreenShell } from '../../components/ScreenShell';
import { useSerenity } from '../../context/SerenityContext';
import { ACTIVATION_LABELS, VALENCE_LABELS, projectAffect } from '../../lib/affect';
import { MoodReport } from '../../lib/mood';
import { usePreferences } from '../../lib/preferences';
import { AffectForm } from './AffectForm';
import { GARDEN_SKIES } from './garden';

const FIREFLIES = [[17, 59], [28, 33], [68, 33], [74, 61], [84, 48]];
const RAIN = [[12, 28], [22, 50], [31, 23], [38, 38], [46, 20], [55, 35], [62, 16], [70, 48], [79, 32], [86, 57]];
const BREEZE = [[7, 42], [72, 31], [13, 56], [76, 50]];

interface GardenScreenProps {
  mood: MoodReport | null;
  onMood: (mood: MoodReport | null) => void;
  onBack: () => void;
  onPrepareConversation: () => void;
  onFindHelp: () => void;
}

export function GardenScreen({ mood, onMood, onBack, onPrepareConversation, onFindHelp }: GardenScreenProps) {
  const { nightMode } = useSerenity();
  const systemReducedMotion = useReducedMotion();
  const { reduceMotion } = usePreferences();
  const [observing, setObserving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [light, setLight] = useState<'day' | 'evening'>(nightMode ? 'evening' : 'day');
  const editButton = useRef<HTMLButtonElement>(null);
  const quickMood = mood?.kind === 'quick' ? mood.mood : null;
  const reading = mood?.kind === 'detailed' ? mood.reading : undefined;
  const projection = reading ? projectAffect(reading) : null;
  const weather = projection?.scene ?? quickMood ?? 'neutre';
  const sky = GARDEN_SKIES[weather];
  const evening = observing ? light === 'evening' : nightMode;
  const animate = !systemReducedMotion && !reduceMotion;
  const showSupport = weather === 'pluie' || weather === 'orage';
  const showRain = showSupport || weather === 'melange';
  const showClouds = weather === 'nuage' || showRain;
  const sway = projection?.breeze ?? (weather === 'orage' ? 4 : 1.5);
  const surface = nightMode ? 'border-white/15 bg-[#212b2d] hover:bg-[#2a3738]' : 'border-[#d4e3d4] bg-[#fcfef8] hover:bg-[#f3faed]';
  const action = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium cursor-pointer';
  const primary = `${action} bg-[#275c48] text-white hover:bg-[#1d4b3a]`;
  const secondary = `${action} border border-current/20`;

  useEffect(() => {
    const images = new Set(Object.values(GARDEN_SKIES).map((item) => item.image));
    for (const image of images) {
      const illustration = new Image();
      illustration.src = `/assets/jardin/${image}.webp`;
    }
  }, []);

  const closeEditor = () => {
    setEditing(false);
    editButton.current?.focus();
  };

  return (
    <ScreenShell theme="sinformer" showBrand={false} showBack onBack={observing ? () => setObserving(false) : onBack}>
      <div className="mx-auto w-full max-w-[660px] px-5 pt-2 pb-6 sm:px-8">
        <h1 className="font-ubuntu text-[30px] font-bold leading-tight sm:text-4xl">
          {observing ? 'Une pause au jardin' : 'Mon arbre intérieur'}
        </h1>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed opacity-85">
          {observing
            ? 'Prends le temps d’observer une forme ou une couleur de ton arbre.'
            : 'Le ciel et le feuillage changent avec l’humeur que tu choisis.'}
        </p>

        {!observing && (
          <>
            <fieldset className="mt-4">
              <legend className="font-ubuntu text-base font-medium">Comment tu te sens en ce moment ?</legend>
              <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
                {MOODS.map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-center text-[12px] font-medium leading-tight cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 ${
                      quickMood === key ? 'border-[#397358] bg-[#dfeee1] text-[#234b3a]' : surface
                    }`}
                  >
                    <input
                      type="radio"
                      name="garden-mood"
                      className="sr-only"
                      checked={quickMood === key}
                      onChange={() => {
                        setEditing(false);
                        onMood({ kind: 'quick', mood: key });
                      }}
                    />
                    <Icon aria-hidden="true" className="size-5" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button ref={editButton} type="button" aria-expanded={editing} onClick={() => setEditing((open) => !open)} className={secondary}>
                {reading ? 'Ajuster mon ressenti' : 'Préciser mon ressenti'}
              </button>
              {reading && (
                <p role="status" className="text-xs font-medium leading-relaxed opacity-85">
                  {VALENCE_LABELS[reading.valence]} · {ACTIVATION_LABELS[reading.activation]}
                </p>
              )}
            </div>
            {editing && (
              <AffectForm
                initialReading={reading}
                onApply={(value) => {
                  onMood({ kind: 'detailed', reading: value });
                  closeEditor();
                }}
                onCancel={closeEditor}
              />
            )}
          </>
        )}

        <figure
          aria-label="L’arbre du jardin"
          data-weather={weather}
          data-breeze={projection?.breeze}
          className="relative isolate mt-4 h-[clamp(15rem,69vw,22rem)] overflow-hidden rounded-[28px] border border-[#63836f]/25"
          style={{ background: evening ? sky.evening : sky.day }}
        >
          {showClouds && (
            <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-[14%] h-[26%] rounded-[50%] bg-white/27 blur-xl" />
          )}
          <div aria-hidden="true" className="absolute -bottom-[21%] -left-[11%] h-[39%] w-[124%] rounded-[50%]" style={{ backgroundColor: evening ? '#305249' : sky.hills[0] }} />
          <div aria-hidden="true" className="absolute -bottom-[28%] -right-[20%] h-[42%] w-[92%] rounded-[50%]" style={{ backgroundColor: evening ? '#24453e' : sky.hills[1] }} />
          {showRain && RAIN.filter(([x]) => weather !== 'melange' || x < 50).map(([x, y]) => (
            <span
              key={x}
              aria-hidden="true"
              className="absolute h-4 w-px rotate-[23deg] rounded-full bg-[#5e7d8e]/40"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
          {projection && BREEZE.slice(0, projection.breeze).map(([x, y]) => (
            <span
              key={x}
              aria-hidden="true"
              className={`absolute h-2 w-[15%] rounded-[50%] border-t-2 ${evening ? 'border-white/35' : 'border-[#557c6b]/30'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
          {evening && !showRain && FIREFLIES.map(([x, y]) => (
            <span
              key={x}
              aria-hidden="true"
              className="absolute size-1.5 rounded-full bg-[#fff7b7] shadow-[0_0_11px_3px_rgba(255,239,144,0.38)]"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-[10%] top-7 flex items-end justify-center">
            <motion.img
              key={`${weather}-${sway}`}
              src={`/assets/jardin/${sky.image}.webp`}
              alt={sky.description}
              initial={animate && sway > 0 ? { rotate: -sway } : false}
              animate={{ rotate: 0 }}
              transition={{ duration: animate ? 0.58 : 0, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-[85%] origin-bottom object-contain object-bottom drop-shadow-[0_5px_10px_rgba(22,53,37,0.14)]"
            />
          </div>
          <figcaption aria-live="polite" className={`absolute left-0 top-0 p-3.5 text-xs font-medium ${evening ? 'text-[#fdfdea]' : 'text-[#254b3a]'}`}>
            {sky.label}
          </figcaption>
        </figure>

        {observing ? (
          <div className="mt-3 grid gap-3">
            <div role="group" aria-label="Lumière du jardin" className="flex flex-wrap gap-2">
              <button type="button" className={light === 'day' ? primary : secondary} aria-pressed={light === 'day'} onClick={() => setLight('day')}>
                <Sun aria-hidden="true" className="size-4" /> Lever du jour
              </button>
              <button type="button" className={light === 'evening' ? primary : secondary} aria-pressed={light === 'evening'} onClick={() => setLight('evening')}>
                <Moon aria-hidden="true" className="size-4" /> Crépuscule
              </button>
            </div>
            <button type="button" className={`justify-self-start ${secondary}`} onClick={() => setObserving(false)}>Revenir à mon arbre</button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setLight(nightMode ? 'evening' : 'day');
                  setEditing(false);
                  setObserving(true);
                }}
              >
                <Leaf aria-hidden="true" className="size-4" /> Observer mon arbre
              </button>
              {mood !== null && (
                <button type="button" className={secondary} onClick={() => { setEditing(false); onMood(null); }}>
                  Effacer mon humeur
                </button>
              )}
            </div>

            <section className="mt-4" aria-labelledby="garden-support">
              <h2 id="garden-support" className="font-ubuntu font-medium">Si tu veux en parler</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={showSupport ? primary : secondary} onClick={onFindHelp}>
                  <HandHeart aria-hidden="true" className="size-4" /> Trouver du soutien
                </button>
                <button type="button" className={secondary} onClick={onPrepareConversation}>
                  <MessageCircle aria-hidden="true" className="size-4" /> Préparer une conversation
                </button>
              </div>
            </section>
            <p className="mt-3 text-xs leading-relaxed opacity-80">Ton choix reste dans cet onglet. Le mode discret l’efface.</p>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
