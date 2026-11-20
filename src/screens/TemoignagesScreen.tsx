import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, SkipBack, SkipForward, X, Volume2, VolumeX } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { TESTIMONIES, TestimonyItem, testimonyAudioUrl } from '../data/content';

interface TemoignageGridScreenProps {
  onBack: () => void;
  onHome: () => void;
  onSelect: (index: number) => void;
  onEmergencyCall: () => void;
}

export const TemoignageGridScreen: React.FC<TemoignageGridScreenProps> = ({
  onBack,
  onHome,
  onSelect,
  onEmergencyCall,
}) => {
  return (
    <ScreenShell
      theme="default"
      showBrand={false}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
      scrollable
    >
      <div className="px-7 pt-2 pb-4">
        {/* Honnêteté : ces récits ne sont pas des témoignages réels */}
        <div role="note" className="mb-5 rounded-[18px] px-4 py-3 bg-[#FFF8D6] border border-[#E5BE1A]/40 text-[12.5px] leading-snug text-[#5c4a00]">
          <strong>Récits illustratifs.</strong> Ces histoires sont fictives : elles ont été écrites par l’équipe MBT à
          partir de situations fréquemment décrites par les services d’écoute. Les prénoms sont inventés.
        </div>
        <div className="grid grid-cols-2 gap-x-7 gap-y-6">
          {TESTIMONIES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(idx)}
              className="group relative aspect-[130/193] w-full overflow-hidden rounded-[6px] shadow-[0_6px_18px_rgba(0,0,0,0.14)] bg-[#1f1f24] cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 text-left"
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 pt-8">
                <span className="inline-block text-[9px] uppercase tracking-wider font-bold text-[#ffde53] mb-0.5">
                  {item.ageLabel}
                </span>
                <p className="text-[11px] leading-[1.25] font-medium text-white line-clamp-2">
                  {item.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
};

interface TestimonyPlayerScreenProps {
  initialIndex: number;
  onBack: () => void;
  onHome: () => void;
  onEmergencyCall: () => void;
}

const HAS_SPEECH = typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: 'fr' | 'en'): SpeechSynthesisVoice | null {
  if (!HAS_SPEECH) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefix = lang === 'fr' ? 'fr' : 'en';
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

/** Durée d'affichage d'une phrase en mode silencieux (≈ vitesse de lecture). */
const readingMs = (line: string) => Math.max(2500, line.split(/\s+/).length * 380);

/**
 * Lecteur de témoignage : lit réellement le récit à voix haute (synthèse vocale du
 * téléphone), phrase par phrase, avec sous-titres synchronisés. Mode silencieux = sous-titres seuls.
 */
export const TestimonyPlayerScreen: React.FC<TestimonyPlayerScreenProps> = ({
  initialIndex,
  onBack,
  onHome,
  onEmergencyCall,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const item: TestimonyItem = TESTIMONIES[index] || TESTIMONIES[0];

  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const lines = lang === 'fr' ? item.transcriptFr : item.transcriptEn;
  const [lineIdx, setLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  /* ---------- Voix enregistrée (fichier MP3 ElevenLabs), si disponible ---------- */
  const audioSrc = testimonyAudioUrl(item, lang);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioOk, setAudioOk] = useState<boolean | null>(null); // null = en cours de vérification
  const useAudio = voiceOn && !!audioSrc && audioOk !== false;

  // Début de chaque phrase, en proportion de la durée (selon la longueur du texte)
  const lineStarts = useMemo(() => {
    const total = lines.reduce((n, l) => n + l.length, 0) || 1;
    let acc = 0;
    return lines.map((l) => {
      const start = acc / total;
      acc += l.length;
      return start;
    });
  }, [lines]);

  useEffect(() => {
    setAudioOk(null);
    if (!audioSrc) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    const onMeta = () => setAudioOk(Number.isFinite(audio.duration) && audio.duration > 0);
    const onError = () => setAudioOk(false);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('error', onError);
    audio.src = audioSrc;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('error', onError);
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [audioSrc]);

  // Lecture / pause du fichier audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (useAudio && isPlaying) {
      audio.play().catch(() => setAudioOk(false)); // fichier absent → voix du téléphone
    } else {
      audio.pause();
    }
  }, [isPlaying, useAudio, audioSrc]);

  // Sous-titres synchronisés sur la position audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !useAudio) return;
    const onTime = () => {
      if (!audio.duration) return;
      const frac = audio.currentTime / audio.duration;
      let i = 0;
      while (i < lineStarts.length - 1 && frac >= lineStarts[i + 1]) i++;
      setLineIdx(i);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setEnded(true);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [useAudio, lineStarts, audioSrc]);

  // Nouveau témoignage : on repart du début
  useEffect(() => {
    setLineIdx(0);
    setIsPlaying(false);
    setEnded(false);
  }, [index]);

  // Voix de synthèse (repli) : une phrase à la fois, puis la suivante
  useEffect(() => {
    if (!isPlaying || useAudio) return;
    let cancelled = false;
    let done = false;
    let timer: number | undefined;
    let watchdog: number | undefined;
    let safety: number | undefined;
    const line = lines[lineIdx] ?? '';

    const advance = () => {
      if (cancelled || done) return;
      done = true;
      if (lineIdx + 1 < lines.length) {
        setLineIdx(lineIdx + 1);
      } else {
        setIsPlaying(false);
        setEnded(true);
      }
    };

    if (voiceOn && HAS_SPEECH) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(line.replace(/[«»"]/g, ''));
      utter.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
      utter.voice = pickVoice(lang);
      utter.rate = 0.97;
      let started = false;
      utter.onstart = () => {
        started = true;
      };
      utter.onend = advance;
      utter.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') timer = window.setTimeout(advance, readingMs(line));
      };
      window.speechSynthesis.speak(utter);
      // Pas de voix disponible (la lecture ne démarre pas) : on passe en sous-titres seuls
      watchdog = window.setTimeout(() => {
        if (!started) {
          window.speechSynthesis.cancel();
          timer = window.setTimeout(advance, readingMs(line));
        }
      }, 2500);
      // Garde-fou si l'événement de fin n'arrive jamais
      safety = window.setTimeout(advance, readingMs(line) * 3 + 4000);
    } else {
      timer = window.setTimeout(advance, readingMs(line));
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(watchdog);
      window.clearTimeout(safety);
      if (HAS_SPEECH) window.speechSynthesis.cancel();
    };
  }, [isPlaying, lineIdx, lines, voiceOn, lang, useAudio]);

  // Arrêt de la voix en quittant l'écran
  useEffect(() => () => {
    if (HAS_SPEECH) window.speechSynthesis.cancel();
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (ended) {
      setLineIdx(0);
      setEnded(false);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
    setIsPlaying(true);
  };

  const seek = (i: number) => {
    setLineIdx(i);
    setEnded(false);
    const audio = audioRef.current;
    if (useAudio && audio?.duration) audio.currentTime = audio.duration * lineStarts[i];
  };

  const handlePrev = () => setIndex((i) => (i - 1 + TESTIMONIES.length) % TESTIMONIES.length);
  const handleNext = () => setIndex((i) => (i + 1) % TESTIMONIES.length);
  const safeLineIdx = Math.min(lineIdx, lines.length - 1);

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
    >
      <div className="px-7 mt-3 flex flex-col items-center">
        {/* Visuel (Figma 334x334, rounded-[27px], border-[10px] border-white) */}
        <div className="relative w-full max-w-[322px] aspect-square rounded-[27px] border-[10px] border-white shadow-[0_14px_34px_rgba(0,0,0,0.14)] overflow-hidden bg-[#1e1e1e]">
          <img src={item.cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-medium truncate">
              Récit fictif · {item.speaker}
            </span>
            {(HAS_SPEECH || audioOk) && (
              <button
                type="button"
                onClick={() => setVoiceOn((v) => !v)}
                title={voiceOn ? 'Passer en sous-titres seuls' : 'Activer la voix'}
                aria-label={voiceOn ? 'Passer en sous-titres seuls' : 'Activer la voix'}
                aria-pressed={voiceOn}
                className="w-8 h-8 shrink-0 rounded-full bg-black/55 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/75 cursor-pointer"
              >
                {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3.5 pt-8 pb-3"
            aria-live="polite"
          >
            <p className="text-white text-[12.5px] leading-[1.4] text-center font-normal">{lines[safeLineIdx]}</p>
          </div>
        </div>

        <h2 className="mt-4 max-w-[322px] text-center font-ubuntu font-medium text-[15px] leading-snug text-[#1d1b20]">
          {item.title}
        </h2>

        {/* Progression : un segment par phrase, cliquable */}
        <div className="w-full max-w-[270px] mt-3">
          <div className="flex gap-1.5 h-5 items-center">
            {lines.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => seek(i)}
                aria-label={`Aller à la partie ${i + 1}`}
                className="flex-1 h-full flex items-center cursor-pointer group"
              >
                <span
                  className={`w-full h-[4px] rounded-full transition-colors ${
                    i < safeLineIdx || (i === safeLineIdx && (isPlaying || ended)) ? 'bg-[#1e1e1e]' : 'bg-[#787878]/40 group-hover:bg-[#787878]/60'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-medium text-[#9a9a9a] -mt-0.5">
            <span>
              Partie {safeLineIdx + 1}/{lines.length}
            </span>
            <span>
              {!voiceOn
                ? 'Sous-titres seuls'
                : useAudio && audioOk
                  ? 'Voix enregistrée'
                  : HAS_SPEECH
                    ? 'Voix de synthèse'
                    : 'Sous-titres seuls'}
            </span>
          </div>
        </div>

        {/* Commandes + transcription & langue */}
        <div className="relative w-full max-w-[310px] mt-3 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Témoignage précédent"
            className="p-2 text-[#1d1b20] hover:opacity-70 active:scale-90 transition cursor-pointer"
          >
            <SkipBack className="w-9 h-9 fill-[#1d1b20]" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Lire'}
            className="w-[54px] h-[54px] flex items-center justify-center text-[#1d1b20] hover:scale-105 active:scale-90 transition cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-11 h-11" strokeWidth={2.4} />
            ) : (
              <img src="/assets/icon-play.svg" alt="" className="w-[46px] h-[46px]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Témoignage suivant"
            className="p-2 text-[#1d1b20] hover:opacity-70 active:scale-90 transition cursor-pointer"
          >
            <SkipForward className="w-9 h-9 fill-[#1d1b20]" />
          </button>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTranscript((s) => !s)}
              title="Afficher la transcription complète"
              aria-label="Transcription"
              aria-expanded={showTranscript}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-[5px] transition cursor-pointer ${
                showTranscript ? 'bg-black text-white' : 'hover:bg-black/5 text-black'
              }`}
            >
              <span className="w-5 h-[2.5px] bg-current rounded-full" />
              <span className="w-5 h-[2.5px] bg-current rounded-full" />
              <span className="w-5 h-[2.5px] bg-current rounded-full" />
            </button>

            <button
              type="button"
              onClick={() => setLang((l) => (l === 'fr' ? 'en' : 'fr'))}
              title={`Langue : ${lang.toUpperCase()}`}
              aria-label="Changer la langue"
              className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 active:scale-90 transition cursor-pointer"
            >
              <img src="/assets/icon-translate.svg" alt="" className="w-7 h-7" />
              <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded bg-[#1d1b20] text-white uppercase">
                {lang}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Transcription complète */}
      {showTranscript && (
        <div className="absolute inset-0 z-40 bg-black/35 backdrop-blur-[2px] flex items-end">
          <div className="w-full max-h-[75%] bg-white rounded-t-[28px] p-5 shadow-2xl flex flex-col animate-screen-in">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#7174AA]">
                  Transcription ({lang === 'fr' ? 'Français' : 'English'})
                </p>
                <h3 className="font-ubuntu font-bold text-[16px] text-[#1d1b20]">{item.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                aria-label="Fermer la transcription"
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 overflow-y-auto no-scrollbar flex flex-col gap-2 pb-4">
              {lines.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => seek(i)}
                  className={`text-left text-[14px] leading-[1.55] px-3 py-2 rounded-xl transition cursor-pointer ${
                    i === safeLineIdx ? 'bg-[#FFF8D6] text-[#1d1b20] font-medium' : 'text-[#555] hover:bg-black/[0.03]'
                  }`}
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
};
