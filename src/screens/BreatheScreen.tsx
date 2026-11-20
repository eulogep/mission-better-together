import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Ear, Eye, Flower2, Hand, Heart, MessageCircle, Pause, Phone, Play, RotateCcw, Sparkles } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { vibrate } from '../lib/device';
import { toast } from '../lib/toast';

interface BreatheScreenProps {
  onBack: () => void;
  onHome: () => void;
  onCall: (serviceKey: string) => void;
  onAlert: () => void;
  onChat: () => void;
}

/* ------------------------------------------------------------------ */
/* Respiration guidée 4-2-6 (≈ 5 respirations par minute)             */
/* ------------------------------------------------------------------ */

const PHASES = [
  { key: 'in', label: 'Inspire', hint: 'par le nez', secs: 4, scale: 1 },
  { key: 'hold', label: 'Garde l’air', hint: 'tranquillement', secs: 2, scale: 1 },
  { key: 'out', label: 'Expire', hint: 'longuement, par la bouche', secs: 6, scale: 0.56 },
] as const;
const CYCLES = 5;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Breathing: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [remaining, setRemaining] = useState<number>(PHASES[0].secs);
  const reduced = useMemo(prefersReducedMotion, []);
  const phase = PHASES[phaseIdx];

  // Avance de phase en phase
  useEffect(() => {
    if (!running) return;
    setRemaining(phase.secs);
    vibrate(phase.key === 'in' ? 25 : phase.key === 'out' ? [12, 70, 12] : 0);
    const tick = window.setInterval(() => setRemaining((r) => Math.max(1, r - 1)), 1000);
    const next = window.setTimeout(() => {
      if (phaseIdx < PHASES.length - 1) {
        setPhaseIdx(phaseIdx + 1);
      } else if (cycle + 1 < CYCLES) {
        setCycle(cycle + 1);
        setPhaseIdx(0);
      } else {
        setRunning(false);
        setCycle(CYCLES);
        onDone();
      }
    }, phase.secs * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(next);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIdx, cycle]);

  const restart = () => {
    setCycle(0);
    setPhaseIdx(0);
    setRunning(true);
  };

  const started = running || cycle > 0 || phaseIdx > 0;
  const scale = !started ? 0.56 : phase.scale;

  return (
    <div className="flex flex-col items-center">
      {/* Bulle qui respire */}
      <div className="relative w-[260px] h-[260px] flex items-center justify-center mt-2" aria-hidden="true">
        <div
          className="absolute inset-0 rounded-full bg-[#C691C9]/20 shadow-[0_0_60px_rgba(255,222,83,0.45)]"
          style={{
            transform: `scale(${scale})`,
            transition: reduced ? 'none' : `transform ${phase.secs}s ease-in-out`,
          }}
        />
        <div
          className="absolute inset-[22px] rounded-full bg-[#7174AA]/15"
          style={{
            transform: `scale(${scale})`,
            transition: reduced ? 'none' : `transform ${phase.secs}s ease-in-out 120ms`,
          }}
        />
        <div
          className="absolute inset-[52px] rounded-full bg-white shadow-[0_18px_40px_rgba(113,116,170,0.25)]"
          style={{
            transform: `scale(${0.8 + (scale - 0.56) * 0.45})`,
            transition: reduced ? 'none' : `transform ${phase.secs}s ease-in-out`,
          }}
        />
        <div className="relative flex flex-col items-center">
          <Heart className="w-9 h-9 text-[#FF8989] fill-[#FF8989]/20" strokeWidth={2.2} />
          {started && running && (
            <span className="mt-1 font-ubuntu font-medium text-[28px] text-[#1d1b20] tabular-nums">{remaining}</span>
          )}
        </div>
      </div>

      {/* Consigne */}
      <div className="mt-3 min-h-[64px] text-center" aria-live="polite">
        {running ? (
          <>
            <p className="font-ubuntu font-bold text-[28px] leading-tight text-[#7174AA]">{phase.label}</p>
            <p className="text-[14px] text-[#666]">{phase.hint}</p>
          </>
        ) : cycle >= CYCLES ? (
          <p className="font-ubuntu font-bold text-[24px] text-[#7174AA]">Bravo, c’est fait.</p>
        ) : (
          <p className="font-ubuntu text-[16px] leading-snug text-[#3b3b3b] max-w-[280px]">
            Une minute pour calmer ton cœur. Suis la bulle : elle grandit, tu inspires.
          </p>
        )}
      </div>

      {/* Progression : une pastille par respiration */}
      <div className="mt-3 flex gap-2" aria-label={`Respiration ${Math.min(cycle + 1, CYCLES)} sur ${CYCLES}`}>
        {Array.from({ length: CYCLES }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              i < cycle ? 'w-2.5 bg-[#7174AA]' : i === cycle && running ? 'w-7 bg-[#C691C9]' : 'w-2.5 bg-black/10'
            }`}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!started || cycle >= CYCLES ? (
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 px-7 h-[60px] rounded-[30px] bg-white border-[5px] border-[#7174AA] text-[#7174AA] font-ubuntu font-medium text-[20px] active:scale-95 hover:shadow-md transition cursor-pointer"
          >
            {cycle >= CYCLES ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            {cycle >= CYCLES ? 'Encore une minute' : 'Commencer'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-2 px-6 h-[52px] rounded-[26px] bg-white border-[4px] border-[#7174AA]/60 text-[#7174AA] font-ubuntu font-medium text-[17px] active:scale-95 transition cursor-pointer"
          >
            {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            {running ? 'Pause' : 'Reprendre'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Ancrage 5-4-3-2-1 : revenir dans l'instant présent                  */
/* ------------------------------------------------------------------ */

const GROUNDING = [
  { n: 5, icon: Eye, verb: 'choses que tu vois', example: 'une fenêtre, une couleur, une ombre…', color: '#7174AA' },
  { n: 4, icon: Hand, verb: 'choses que tu peux toucher', example: 'ton pull, la table, tes cheveux…', color: '#00C492' },
  { n: 3, icon: Ear, verb: 'sons que tu entends', example: 'un oiseau, ta respiration, une voiture…', color: '#C691C9' },
  { n: 2, icon: Flower2, verb: 'odeurs que tu sens', example: 'l’air, ton savon, un repas…', color: '#E5BE1A' },
  { n: 1, icon: Sparkles, verb: 'chose gentille à te dire', example: '« Je fais de mon mieux. »', color: '#FF8989' },
];

const Grounding: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [found, setFound] = useState(0);
  const doneRef = useRef(false);
  const current = GROUNDING[step];

  const tap = () => {
    if (!current) return;
    vibrate(15);
    if (found + 1 >= current.n) {
      window.setTimeout(() => {
        if (step + 1 < GROUNDING.length) {
          setStep(step + 1);
          setFound(0);
        } else if (!doneRef.current) {
          doneRef.current = true;
          setStep(GROUNDING.length);
          onDone();
        }
      }, 380);
    }
    setFound((f) => f + 1);
  };

  if (!current) {
    return (
      <div className="flex flex-col items-center text-center px-4 pt-6">
        <Heart className="w-14 h-14 text-[#FF8989] fill-[#FF8989]/25 mbt-pop" />
        <p className="mt-4 font-ubuntu font-bold text-[24px] leading-tight text-[#7174AA]">Tu es ici, maintenant.</p>
        <p className="mt-2 text-[15px] text-[#3b3b3b] max-w-[280px]">Tu as fait quelque chose de bien pour toi.</p>
        <button
          type="button"
          onClick={() => {
            doneRef.current = false;
            setStep(0);
            setFound(0);
          }}
          className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#7174AA] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer
        </button>
      </div>
    );
  }

  const Icon = current.icon;
  return (
    <div className="flex flex-col items-center px-2">
      {/* Étapes */}
      <div className="flex gap-1.5 mt-1">
        {GROUNDING.map((g, i) => (
          <span
            key={g.n}
            className="w-9 h-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < step ? g.color : i === step ? `${g.color}88` : 'rgba(0,0,0,0.08)' }}
          />
        ))}
      </div>

      <div key={step} className="mbt-enter-forward w-full flex flex-col items-center">
        <div
          className="mt-6 w-[92px] h-[92px] rounded-full flex items-center justify-center border-[5px] bg-white"
          style={{ borderColor: current.color, color: current.color }}
        >
          <Icon className="w-11 h-11" strokeWidth={2} />
        </div>
        <p className="mt-4 font-ubuntu text-center text-[22px] leading-tight text-[#1d1b20]">
          Trouve <strong style={{ color: current.color }}>{current.n}</strong> {current.verb}
        </p>
        <p className="mt-1 text-[13.5px] text-[#777] text-center">{current.example}</p>

        <p className="mt-6 text-[12px] uppercase tracking-wider font-bold text-[#8e8e93]">
          Touche un rond à chaque fois
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {Array.from({ length: current.n }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={tap}
              disabled={i !== found}
              aria-label={`${i + 1} sur ${current.n}`}
              className={`w-[54px] h-[54px] rounded-full border-[4px] transition-all duration-200 cursor-pointer disabled:cursor-default ${
                i < found ? 'mbt-pop' : i === found ? 'animate-pulse' : 'opacity-40'
              }`}
              style={{
                borderColor: current.color,
                backgroundColor: i < found ? current.color : '#fff',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

export const BreatheScreen: React.FC<BreatheScreenProps> = ({ onBack, onHome, onCall, onAlert, onChat }) => {
  const [tab, setTab] = useState<'breathe' | 'ground'>('breathe');
  const [askFeeling, setAskFeeling] = useState(false);
  const [needHelp, setNeedHelp] = useState(false);

  const finished = () => {
    vibrate([30, 60, 30]);
    setAskFeeling(true);
    setNeedHelp(false);
  };

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={() => onCall('urgence')}
      showBrand={false}
      scrollable
    >
      <div className="px-4 pt-1 flex flex-col">
        <h1 className="px-1 font-ubuntu font-bold text-[28px] leading-tight text-[#7174AA]">Respire avec moi</h1>

        {/* Onglets */}
        <div className="mt-4 self-center p-1 rounded-full bg-[#7174AA]/10 flex gap-1" role="tablist">
          {(
            [
              ['breathe', 'Respirer'],
              ['ground', 'Ancrage 5-4-3-2-1'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setAskFeeling(false);
              }}
              className={`px-4 py-2 rounded-full text-[14px] font-ubuntu font-medium transition cursor-pointer ${
                tab === key ? 'bg-[#7174AA] text-white shadow-sm' : 'text-[#7174AA]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'breathe' ? <Breathing onDone={finished} /> : <Grounding onDone={finished} />}
        </div>

        {/* Et maintenant ? */}
        {askFeeling && (
          <div className="mt-6 mx-1 rounded-[26px] bg-white border-[3px] border-[#7174AA]/40 px-4 py-4 mbt-enter-none">
            <p className="font-ubuntu font-medium text-[17px] text-center text-[#1d1b20]">Comment tu te sens ?</p>
            {!needHelp ? (
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAskFeeling(false);
                    toast('Bien joué. Tu peux revenir ici quand tu veux.', { tone: 'warm' });
                  }}
                  className="py-3 rounded-[20px] bg-[#00E8AE]/15 border-2 border-[#00C492] text-[#00876a] font-ubuntu font-medium text-[15px] active:scale-95 transition cursor-pointer"
                >
                  Un peu mieux
                </button>
                <button
                  type="button"
                  onClick={() => setNeedHelp(true)}
                  className="py-3 rounded-[20px] bg-[#FF8989]/12 border-2 border-[#FF8989] text-[#d4474c] font-ubuntu font-medium text-[15px] active:scale-95 transition cursor-pointer"
                >
                  Toujours mal
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-[13.5px] leading-snug text-center text-[#3b3b3b]">
                  Merci de le dire. Tu n’as pas à rester seul·e avec ça.
                </p>
                <button
                  type="button"
                  onClick={() => onCall('3114')}
                  className="flex items-center gap-3 px-4 py-3 rounded-[20px] bg-[#FF8989] text-white font-ubuntu font-medium text-[15px] active:scale-[0.98] transition cursor-pointer"
                >
                  <Phone className="w-5 h-5" />
                  Parler à quelqu’un · 3114 (24h/24)
                </button>
                <button
                  type="button"
                  onClick={onChat}
                  className="flex items-center gap-3 px-4 py-3 rounded-[20px] bg-white border-2 border-[#2663FF]/40 text-[#2663FF] font-ubuntu font-medium text-[15px] active:scale-[0.98] transition cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Écrire plutôt que parler
                </button>
                <button
                  type="button"
                  onClick={onAlert}
                  className="flex items-center gap-3 px-4 py-3 rounded-[20px] bg-white border-2 border-[#FF8989]/60 text-[#d4474c] font-ubuntu font-medium text-[15px] active:scale-[0.98] transition cursor-pointer"
                >
                  <BellRing className="w-5 h-5" />
                  Prévenir un proche
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ScreenShell>
  );
};
