import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain,
  Compass,
  Feather,
  Music,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  Waves,
  Wind,
} from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { useSerenity } from '../context/SerenityContext';
import { SoundChannel, soundEngine } from '../utils/soundEngine';

interface SanctuaryScreenProps {
  onBack: () => void;
  onHome: () => void;
  onEmergencyCall: () => void;
}

type SanctuaryTab = 'respirer' | 'ancrage' | 'galet' | 'sons';

interface BreathPattern {
  id: 'coherence' | '478' | 'box';
  name: string;
  subtitle: string;
  phases: { label: string; hint: string; seconds: number; scale: number }[];
}

const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'coherence',
    name: 'Cohérence 5-5',
    subtitle: 'Équilibre le cœur en 3 min',
    phases: [
      { label: 'Inspire', hint: 'Doucement par le nez', seconds: 5, scale: 1.38 },
      { label: 'Expire', hint: 'Relâche les épaules', seconds: 5, scale: 0.78 },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Calme',
    subtitle: 'Apaise une montée d’angoisse',
    phases: [
      { label: 'Inspire', hint: 'Calme et profond', seconds: 4, scale: 1.38 },
      { label: 'Retiens', hint: 'Tout est paisible', seconds: 7, scale: 1.38 },
      { label: 'Expire', hint: 'Souffle longuement', seconds: 8, scale: 0.76 },
    ],
  },
  {
    id: 'box',
    name: 'Carrée 4-4-4-4',
    subtitle: 'Recentrer l’esprit rapidement',
    phases: [
      { label: 'Inspire', hint: 'Remplis tes poumons', seconds: 4, scale: 1.35 },
      { label: 'Pause', hint: 'Reste présent·e', seconds: 4, scale: 1.35 },
      { label: 'Expire', hint: 'Vide doucement', seconds: 4, scale: 0.78 },
      { label: 'Pause', hint: 'Sérénité', seconds: 4, scale: 0.78 },
    ],
  },
];

const GROUNDING_STEPS = [
  {
    count: 5,
    sense: 'VOIR',
    prompt: 'Observe 5 choses calmes autour de toi (une couleur, une fenêtre, un objet…).',
    color: '#63b3a6',
  },
  {
    count: 4,
    sense: 'TOUCHER',
    prompt: 'Sens 4 textures réelles : tes pieds au sol, ton vêtement, une table, ta main.',
    color: '#7174aa',
  },
  {
    count: 3,
    sense: 'ENTENDRE',
    prompt: 'Écoute 3 sons distincts, même très doux (ta respiration, un bruit lointain…).',
    color: '#c691c9',
  },
  {
    count: 2,
    sense: 'SENTIR',
    prompt: 'Remarque 2 odeurs ou la fraîcheur de l’air qui entre dans ton nez.',
    color: '#e5a95e',
  },
  {
    count: 1,
    sense: 'TE RASSURER',
    prompt: 'Dis-toi doucement : « Je suis ici, maintenant, et je mérite d’être en sécurité. »',
    color: '#00c492',
  },
];

interface Ripple {
  id: number;
  x: number;
  y: number;
  hue: string;
}

export const SanctuaryScreen: React.FC<SanctuaryScreenProps> = ({
  onBack,
  onHome,
  onEmergencyCall,
}) => {
  const { nightMode, soundLevels, setSoundLevel, applyPreset, stopAllSounds } = useSerenity();
  const [tab, setTab] = useState<SanctuaryTab>('respirer');

  // --- Breathing state ---
  const [patternIdx, setPatternIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSecLeft, setPhaseSecLeft] = useState(BREATH_PATTERNS[0].phases[0].seconds);
  const [cycles, setCycles] = useState(0);
  const [chimeOnPhase, setChimeOnPhase] = useState(true);

  const pattern = BREATH_PATTERNS[patternIdx];
  const currentPhase = pattern.phases[phaseIdx] || pattern.phases[0];

  useEffect(() => {
    setRunning(false);
    setPhaseIdx(0);
    setPhaseSecLeft(pattern.phases[0].seconds);
    setCycles(0);
  }, [patternIdx, pattern]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setPhaseSecLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextIdx = (phaseIdx + 1) % pattern.phases.length;
        setPhaseIdx(nextIdx);
        if (nextIdx === 0) setCycles((c) => c + 1);
        if (chimeOnPhase) soundEngine.playChime(nextIdx === 0 ? 4 : 2, true);
        return pattern.phases[nextIdx].seconds;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, phaseIdx, pattern, chimeOnPhase]);

  // --- Grounding 5-4-3-2-1 state ---
  const [groundStep, setGroundStep] = useState(0);
  const [tappedDots, setTappedDots] = useState<number[]>([]);
  const [groundDone, setGroundDone] = useState(false);
  const activeGround = GROUNDING_STEPS[groundStep];

  const handleToggleDot = (idx: number) => {
    soundEngine.playChime(idx + 1, true);
    setTappedDots((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  // --- Zen Pebble Ripple Canvas state ---
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const lastDragSoundRef = useRef(0);
  const RIPPLE_COLORS = ['#7174AA', '#00E8AE', '#C691C9', '#FFDE53', '#80BFFF'];

  const spawnRipple = (clientX: number, clientY: number, rect: DOMRect, withSound = true) => {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = ++rippleIdRef.current;
    const hue = RIPPLE_COLORS[id % RIPPLE_COLORS.length];
    setRipples((prev) => [...prev.slice(-14), { id, x, y, hue }]);
    if (withSound) {
      const now = Date.now();
      if (now - lastDragSoundRef.current > 210) {
        lastDragSoundRef.current = now;
        const note = Math.floor((x / Math.max(1, rect.width)) * 8);
        soundEngine.playChime(note, true);
      }
    }
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1600);
  };

  const tabs: { key: SanctuaryTab; label: string; icon: React.ReactNode }[] = [
    { key: 'respirer', label: 'Respirer', icon: <Wind className="w-3.5 h-3.5" /> },
    { key: 'ancrage', label: '5-4-3-2-1', icon: <Compass className="w-3.5 h-3.5" /> },
    { key: 'galet', label: 'Galet Zen', icon: <Feather className="w-3.5 h-3.5" /> },
    { key: 'sons', label: 'Sons', icon: <Music className="w-3.5 h-3.5" /> },
  ];

  const soundChannels: {
    key: SoundChannel;
    label: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'rain',
      label: 'Pluie douce',
      desc: 'Gouttes feutrées sur la vitre',
      icon: <CloudRain className="w-5 h-5" />,
      color: '#6e85e3',
    },
    {
      key: 'ocean',
      label: 'Océan calme',
      desc: 'Ressac lent et enveloppant',
      icon: <Waves className="w-5 h-5" />,
      color: '#00c492',
    },
    {
      key: 'breeze',
      label: 'Brise de forêt',
      desc: 'Vent léger dans les feuilles',
      icon: <Wind className="w-5 h-5" />,
      color: '#8ab17d',
    },
    {
      key: 'harmony',
      label: 'Harmonie 432 Hz',
      desc: 'Nappe harmonique apaisante',
      icon: <Sparkles className="w-5 h-5" />,
      color: '#c691c9',
    },
  ];

  return (
    <ScreenShell
      theme="sinformer"
      showBrand={false}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
      scrollable
    >
      <div className="px-4 pt-1 flex flex-col gap-4">
        {/* Serene Title */}
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7174AA]">
            Sanctuaire d’apaisement
          </p>
          <h1
            className={`font-ubuntu font-bold text-[24px] mt-0.5 ${
              nightMode ? 'text-[#f3f4fa]' : 'text-[#23243a]'
            }`}
          >
            Espace Sérénité
          </h1>
          <p className={`text-[12.5px] mt-0.5 ${nightMode ? 'text-[#a3a9c4]' : 'text-[#6c6e85]'}`}>
            Prends une pause. Ici, tu es en sécurité.
          </p>
        </div>

        {/* 4-Pill Tab Selector */}
        <div
          className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border ${
            nightMode
              ? 'bg-white/6 border-white/10'
              : 'bg-[#f4f5fb]/90 border-[#7174aa]/15 backdrop-blur-sm'
          }`}
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                  active
                    ? 'bg-[#7174AA] text-white shadow-sm'
                    : nightMode
                    ? 'text-[#b5bad4] hover:bg-white/8'
                    : 'text-[#5c5f82] hover:bg-white/70'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1 — GUIDED ORGANIC BREATHING */}
        <AnimatePresence mode="wait">
          {tab === 'respirer' && (
            <motion.div
              key="respirer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Pattern Switcher */}
              <div className="flex gap-1.5 w-full">
                {BREATH_PATTERNS.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatternIdx(idx)}
                    className={`flex-1 py-2 px-2 rounded-2xl border text-[11.5px] font-medium transition cursor-pointer ${
                      patternIdx === idx
                        ? 'border-[#00c492] bg-[#00e8ae]/15 text-[#009973]'
                        : nightMode
                        ? 'border-white/10 bg-white/5 text-[#b8bdd6]'
                        : 'border-black/8 bg-white/85 text-[#555]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <p className={`text-[12px] -mt-2 ${nightMode ? 'text-[#9ea4bf]' : 'text-[#73758c]'}`}>
                {pattern.subtitle}
              </p>

              {/* Luminous Blooming Breathing Orb */}
              <div className="relative w-[224px] h-[224px] flex items-center justify-center my-1">
                {/* Outer Halo 1 */}
                <motion.div
                  animate={{
                    scale: running ? currentPhase.scale * 1.08 : [0.95, 1.04, 0.95],
                    opacity: running ? 0.35 : 0.22,
                  }}
                  transition={
                    running
                      ? { duration: currentPhase.seconds, ease: 'easeInOut' }
                      : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                  }
                  className="absolute w-[158px] h-[158px] rounded-full blur-xl"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(0,232,174,0.65) 0%, rgba(113,116,170,0.45) 60%, transparent 100%)',
                  }}
                />
                {/* Petal Layer 2 */}
                <motion.div
                  animate={{
                    scale: running ? currentPhase.scale : [0.96, 1.03, 0.96],
                    rotate: running ? (phaseIdx % 2 === 0 ? 45 : 0) : 0,
                  }}
                  transition={
                    running
                      ? { duration: currentPhase.seconds, ease: 'easeInOut' }
                      : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                  }
                  className="absolute w-[142px] h-[142px] rounded-[42%] border-2 border-[#00e8ae]/45 bg-gradient-to-br from-[#00e8ae]/25 via-[#7174aa]/20 to-[#c691c9]/25 backdrop-blur-xs"
                />
                {/* Core Breathing Sphere */}
                <motion.div
                  animate={{
                    scale: running ? currentPhase.scale * 0.92 : [0.97, 1.02, 0.97],
                  }}
                  transition={
                    running
                      ? { duration: currentPhase.seconds, ease: 'easeInOut' }
                      : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                  }
                  className="relative w-[132px] h-[132px] rounded-full shadow-[0_12px_36px_rgba(113,116,170,0.28)] flex flex-col items-center justify-center text-white text-center px-3"
                  style={{
                    background:
                      'linear-gradient(135deg, #5fdcc0 0%, #7174aa 55%, #b88ec9 100%)',
                  }}
                >
                  <span className="font-ubuntu font-bold text-[22px] leading-tight">
                    {running ? currentPhase.label : 'Prêt·e'}
                  </span>
                  <span className="text-[12px] text-white/90 mt-0.5">
                    {running ? `${phaseSecLeft} s` : 'Appuie sur Lire'}
                  </span>
                </motion.div>
              </div>

              <p
                className={`text-[13.5px] font-medium min-h-[20px] ${
                  nightMode ? 'text-[#d5d9ee]' : 'text-[#44465e]'
                }`}
              >
                {running ? currentPhase.hint : 'Laisse ta respiration suivre le cercle lumineux'}
              </p>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!running && chimeOnPhase) soundEngine.playChime(4, true);
                    setRunning((r) => !r);
                  }}
                  className="px-6 py-3 rounded-full bg-[#7174AA] hover:bg-[#61649a] text-white font-ubuntu font-medium text-[15px] shadow-md flex items-center gap-2 active:scale-95 transition cursor-pointer"
                >
                  {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {running ? 'Pause' : 'Commencer'}
                </button>

                <button
                  type="button"
                  onClick={() => setChimeOnPhase((c) => !c)}
                  title="Carillon doux à chaque phase"
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition cursor-pointer ${
                    chimeOnPhase
                      ? 'bg-[#00e8ae]/15 border-[#00c492] text-[#009973]'
                      : 'border-black/10 text-[#999]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {cycles > 0 && (
                  <span className="text-[12px] font-semibold px-3 py-1.5 rounded-full bg-[#00e8ae]/15 text-[#009973]">
                    {cycles} {cycles > 1 ? 'cycles' : 'cycle'}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2 — TRAUMA-INFORMED 5-4-3-2-1 GROUNDING */}
          {tab === 'ancrage' && (
            <motion.div
              key="ancrage"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3.5"
            >
              {groundDone ? (
                <div
                  className={`rounded-[26px] p-6 text-center border-2 border-[#00e8ae]/50 ${
                    nightMode ? 'bg-white/6' : 'bg-white/90'
                  } shadow-sm`}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#00e8ae]/20 text-[#00a87e] flex items-center justify-center mb-3">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2
                    className={`font-ubuntu font-bold text-[20px] ${
                      nightMode ? 'text-white' : 'text-[#23243a]'
                    }`}
                  >
                    Bravo, tu es revenu·e au présent
                  </h2>
                  <p
                    className={`text-[13.5px] leading-relaxed mt-2 ${
                      nightMode ? 'text-[#b5bad4]' : 'text-[#555]'
                    }`}
                  >
                    Ton corps et ton esprit ont repris appui sur le moment présent. Prends encore une
                    grande inspiration tranquille.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGroundDone(false);
                      setGroundStep(0);
                      setTappedDots([]);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7174AA] text-white text-[13.5px] font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Refaire à mon rythme
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-[26px] p-5 border-2 shadow-sm transition-colors ${
                    nightMode ? 'bg-white/6' : 'bg-white/92'
                  }`}
                  style={{ borderColor: `${activeGround.color}70` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: activeGround.color }}
                    >
                      Étape {groundStep + 1} / 5 · {activeGround.sense}
                    </span>
                    <span className="text-[12px] text-[#8e8e93]">À ton rythme</span>
                  </div>

                  <p
                    className={`font-ubuntu font-medium text-[18px] leading-snug ${
                      nightMode ? 'text-[#f2f3fa]' : 'text-[#222338]'
                    }`}
                  >
                    {activeGround.prompt}
                  </p>

                  {/* Interactive Tactile Petals — user taps each one as they notice something */}
                  <div className="mt-5 flex items-center justify-center gap-3">
                    {Array.from({ length: activeGround.count }).map((_, i) => {
                      const done = tappedDots.includes(i);
                      return (
                        <motion.button
                          key={i}
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleToggleDot(i)}
                          className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-ubuntu font-bold text-[16px] transition cursor-pointer"
                          style={{
                            borderColor: activeGround.color,
                            backgroundColor: done ? activeGround.color : 'transparent',
                            color: done ? '#ffffff' : activeGround.color,
                          }}
                        >
                          {i + 1}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-center text-[11.5px] text-[#8e8e93] mt-3">
                    Touche chaque cercle une fois que tu l’as ressenti (aucune obligation)
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={groundStep === 0}
                      onClick={() => {
                        setGroundStep((s) => Math.max(0, s - 1));
                        setTappedDots([]);
                      }}
                      className="px-4 py-2 rounded-full text-[13px] font-medium text-[#7174AA] disabled:opacity-30 cursor-pointer"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (groundStep === GROUNDING_STEPS.length - 1) {
                          soundEngine.playChime(7, true);
                          setGroundDone(true);
                        } else {
                          setGroundStep((s) => s + 1);
                          setTappedDots([]);
                        }
                      }}
                      className="px-5 py-2.5 rounded-full text-white text-[13.5px] font-medium shadow-sm active:scale-95 transition cursor-pointer"
                      style={{ backgroundColor: activeGround.color }}
                    >
                      {groundStep === GROUNDING_STEPS.length - 1 ? 'Terminer' : 'Continuer'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3 — SOMATIC ZEN WATER RIPPLE POND (Fidget Anchor) */}
          {tab === 'galet' && (
            <motion.div
              key="galet"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              <div
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  spawnRipple(e.clientX, e.clientY, rect, true);
                }}
                onPointerMove={(e) => {
                  if (e.buttons === 1 || e.pointerType === 'touch') {
                    const rect = e.currentTarget.getBoundingClientRect();
                    spawnRipple(e.clientX, e.clientY, rect, true);
                  }
                }}
                className="relative w-full h-[300px] rounded-[28px] overflow-hidden cursor-pointer touch-none border-2 border-[#7174aa]/25 shadow-inner flex items-center justify-center"
                style={{
                  background: nightMode
                    ? 'radial-gradient(circle at 50% 45%, #232a46 0%, #15192b 100%)'
                    : 'radial-gradient(circle at 50% 45%, #edf9f5 0%, #f1f0fa 55%, #fdf6e9 100%)',
                }}
              >
                <div className="pointer-events-none text-center px-6">
                  <Feather className="w-7 h-7 mx-auto mb-2 text-[#7174AA]/60" />
                  <p
                    className={`font-ubuntu font-medium text-[15px] ${
                      nightMode ? 'text-[#d0d5ec]' : 'text-[#5b5e7a]'
                    }`}
                  >
                    Touche ou glisse doucement sur l’eau
                  </p>
                  <p className="text-[12px] text-[#8e8e93] mt-1">
                    Chaque onde joue une note apaisante en 432 Hz
                  </p>
                </div>

                {ripples.map((r) => (
                  <motion.span
                    key={r.id}
                    initial={{ scale: 0.15, opacity: 0.85 }}
                    animate={{ scale: 4.2, opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{
                      left: r.x - 28,
                      top: r.y - 28,
                      borderColor: r.hue,
                      background: `radial-gradient(circle, ${r.hue}33 0%, transparent 70%)`,
                    }}
                    className="pointer-events-none absolute w-14 h-14 rounded-full border-2"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4 — PROCEDURAL AMBIENT SOUNDSCAPE MIXER (Inspired by Moodist) */}
          {tab === 'sons' && (
            <motion.div
              key="sons"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {/* 1-Tap Ambiance Presets */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  {
                    label: 'Pluie d’été',
                    levels: { rain: 0.55, ocean: 0, breeze: 0.2, harmony: 0.2 },
                  },
                  {
                    label: 'Bord de mer',
                    levels: { rain: 0, ocean: 0.65, breeze: 0.25, harmony: 0.15 },
                  },
                  {
                    label: 'Cocon 432 Hz',
                    levels: { rain: 0.25, ocean: 0, breeze: 0, harmony: 0.55 },
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.levels)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition cursor-pointer ${
                      nightMode
                        ? 'bg-white/8 border-white/15 text-[#dce0f5] hover:bg-white/15'
                        : 'bg-white border-[#7174aa]/25 text-[#5b5e8a] hover:bg-[#7174aa]/10'
                    }`}
                  >
                    ✦ {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={stopAllSounds}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border border-black/10 text-[#888] hover:bg-black/5 cursor-pointer"
                >
                  Silence
                </button>
              </div>

              {/* Individual Procedural Audio Sliders */}
              <div className="flex flex-col gap-2.5">
                {soundChannels.map((ch) => {
                  const val = soundLevels[ch.key];
                  return (
                    <div
                      key={ch.key}
                      className={`rounded-[20px] p-3.5 border transition ${
                        nightMode
                          ? 'bg-white/6 border-white/10'
                          : 'bg-white/90 border-black/8 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: ch.color }}
                          >
                            {ch.icon}
                          </span>
                          <div>
                            <p
                              className={`font-ubuntu font-medium text-[14px] leading-tight ${
                                nightMode ? 'text-white' : 'text-[#222]'
                              }`}
                            >
                              {ch.label}
                            </p>
                            <p className="text-[11px] text-[#8e8e93]">{ch.desc}</p>
                          </div>
                        </div>
                        <span className="text-[12px] font-semibold text-[#7174AA] w-9 text-right">
                          {Math.round(val * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={val}
                        onChange={(e) => setSoundLevel(ch.key, parseFloat(e.target.value))}
                        aria-label={`Volume ${ch.label}`}
                        className="w-full accent-[#7174AA] cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-center text-[#8e8e93]">
                L’ambiance sonore continue doucement pendant que tu navigues dans l’application.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
};
