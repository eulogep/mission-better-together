import React, { useEffect, useRef, useState } from 'react';
import { BookOpenText, ChevronRight, Languages, MessagesSquare, Pause, Play, SkipBack, SkipForward, X, Volume2, VolumeX } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { useSerenity } from '../context/SerenityContext';
import { ARTICLES } from '../data/articles';
import { TESTIMONIES, TESTIMONY_THEMES, TestimonyTheme, testimonyAudioUrl, testimonyIndices } from '../data/content';
import audioCues from '../data/testimonyAudio.generated.json';
import { PRACTICE_SCENARIOS } from '../features/practice/scenarios';

const THEME_OPTIONS: [TestimonyTheme | null, string][] = [
  [null, 'Tous'],
  ...(Object.entries(TESTIMONY_THEMES) as [TestimonyTheme, string][]),
];

interface TemoignageGridScreenProps {
  themeFilter: TestimonyTheme | null;
  onFilter: (theme: TestimonyTheme | null) => void;
  onBack: () => void;
  onHome: () => void;
  onSelect: (index: number) => void;
  onPractice: () => void;
  onEmergencyCall: () => void;
}

export const TemoignageGridScreen: React.FC<TemoignageGridScreenProps> = ({
  themeFilter,
  onFilter,
  onBack,
  onHome,
  onSelect,
  onPractice,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  const indices = testimonyIndices(themeFilter);
  const filterClass = nightMode ? 'bg-white/8 border-white/15 hover:bg-white/15' : 'bg-white/80 border-black/10 hover:bg-white';

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
      <div className="px-5 pt-2 pb-4 sm:px-7">
        <h1 className="font-ubuntu text-[30px] font-bold leading-tight">Récits</h1>
        <p role="note" className="mt-2 text-[13px] leading-relaxed opacity-80">
          <strong>Récits illustratifs.</strong> Les histoires et les prénoms sont fictifs. Les images sont générées par IA.
        </p>
        <button
          type="button"
          onClick={onPractice}
          className={`mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3.5 text-left text-sm font-medium cursor-pointer ${filterClass}`}
        >
          <MessagesSquare aria-hidden="true" className="size-5 shrink-0" />
          <span className="flex-1">S’entraîner à réagir</span>
          <ChevronRight aria-hidden="true" className="size-4 shrink-0 opacity-60" />
        </button>
        <div role="group" aria-label="Filtrer les récits par situation" className="mt-4 mb-3 flex flex-wrap gap-1.5">
          {THEME_OPTIONS.map(([theme, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={themeFilter === theme}
              onClick={() => onFilter(theme)}
              className={`min-h-9 rounded-full border px-3 text-xs font-medium cursor-pointer ${
                themeFilter === theme ? 'border-[#ffde53] bg-[#ffde53] text-[#292010]' : filterClass
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p role="status" className="mb-2 text-xs opacity-75">
          {indices.length} {indices.length === 1 ? 'récit' : 'récits'}
        </p>
        <ul aria-label="Récits disponibles" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {indices.map((index) => {
            const item = TESTIMONIES[index];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#1f1f24] text-left shadow-sm cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="absolute inset-0 size-full object-cover object-[center_36%] motion-safe:transition-transform motion-safe:group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-9">
                    <span className="block text-[11px] font-medium text-[#ffde53]">{item.ageLabel}</span>
                    <span className="mt-0.5 block text-[13px] font-medium leading-tight text-white">{item.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </ScreenShell>
  );
};

interface TestimonyPlayerScreenProps {
  selectedIndex: number;
  themeFilter: TestimonyTheme | null;
  onSelect: (index: number) => void;
  onOpenArticle: (id: string) => void;
  onOpenPractice: (id: string) => void;
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
  selectedIndex,
  themeFilter,
  onSelect,
  onOpenArticle,
  onOpenPractice,
  onBack,
  onHome,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  const surface = nightMode ? 'bg-white/8 border-white/15 hover:bg-white/15' : 'bg-white/85 border-black/10 hover:bg-white';
  const index = TESTIMONIES[selectedIndex] ? selectedIndex : 0;
  const item = TESTIMONIES[index];
  const article = ARTICLES.find((candidate) => candidate.id === item.articleId);
  const practice = PRACTICE_SCENARIOS.find((scenario) => scenario.storyId === item.id);
  const indices = testimonyIndices(themeFilter !== null && item.themes.includes(themeFilter) ? themeFilter : null);

  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const lines = lang === 'fr' ? item.transcriptFr : item.transcriptEn;
  const [lineIdx, setLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  /* ---------- Narration préenregistrée ---------- */
  const audioSrc = testimonyAudioUrl(item, lang);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioOk, setAudioOk] = useState<boolean | null>(null); // null = en cours de vérification
  const useAudio = voiceOn && !!audioSrc && audioOk !== false;

  const lineStarts = (audioCues as Record<string, number[]>)[item.id];

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
      audio.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError') setAudioOk(false);
      });
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
      let i = 0;
      while (i < lineStarts.length - 1 && audio.currentTime >= lineStarts[i + 1]) i++;
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

  // Nouveau témoignage ou nouvelle langue : on repart du début.
  useEffect(() => {
    setLineIdx(0);
    setIsPlaying(false);
    setEnded(false);
  }, [index, lang]);

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
    // Safari et certaines WebViews demandent un geste utilisateur pour commencer.
    if (useAudio) {
      audioRef.current?.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError') setAudioOk(false);
      });
    }
    setIsPlaying(true);
  };

  const seek = (i: number) => {
    setLineIdx(i);
    setEnded(false);
    const audio = audioRef.current;
    if (useAudio && audio?.duration) audio.currentTime = lineStarts[i];
  };

  const moveStory = (offset: -1 | 1) => {
    const next = (indices.indexOf(index) + offset + indices.length) % indices.length;
    setIsPlaying(false);
    onSelect(indices[next]);
  };
  const safeLineIdx = Math.min(lineIdx, lines.length - 1);

  return (
    <ScreenShell
      theme="default"
      showBrand={false}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
    >
      <div className="px-7 mt-3 flex flex-col items-center">
        {/* Visuel (Figma 334x334, rounded-[27px], border-[10px] border-white) */}
        <div className="relative w-full max-w-[322px] aspect-square rounded-[27px] border-[10px] border-white shadow-[0_14px_34px_rgba(0,0,0,0.14)] overflow-hidden bg-[#1e1e1e]">
          <img src={item.image} alt="" className="w-full h-full object-cover object-[center_35%]" />
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

        <h1 className="mt-4 max-w-[322px] text-center font-ubuntu font-medium text-base leading-snug">
          {item.title}
        </h1>

        {/* Progression : un segment par phrase, cliquable */}
        <div className="w-full max-w-[270px] mt-3">
          <div className="flex gap-1.5 h-7 items-center">
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
                    i < safeLineIdx || (i === safeLineIdx && (isPlaying || ended)) ? 'bg-current' : 'bg-current/25 group-hover:bg-current/45'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs font-medium opacity-75">
            <span>
              Partie {safeLineIdx + 1}/{lines.length}
            </span>
            <span>
              {!voiceOn
                ? 'Sous-titres seuls'
                : useAudio && audioOk
                  ? 'Voix de synthèse préenregistrée'
                  : HAS_SPEECH
                    ? 'Voix de synthèse'
                    : 'Sous-titres seuls'}
            </span>
          </div>
        </div>

        {/* Commandes + transcription & langue */}
        <div className="mt-3 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => moveStory(-1)}
            disabled={indices.length === 1}
            aria-label="Témoignage précédent"
            className="p-2 hover:opacity-70 active:scale-90 transition cursor-pointer disabled:cursor-default disabled:opacity-25"
          >
            <SkipBack className="w-9 h-9 fill-current" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Lire'}
            className="flex size-14 items-center justify-center rounded-full bg-[#ffde53] text-[#292010] hover:bg-[#f8ce36] cursor-pointer"
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="size-7 fill-current" />
            ) : (
              <Play aria-hidden="true" className="size-7 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => moveStory(1)}
            disabled={indices.length === 1}
            aria-label="Témoignage suivant"
            className="p-2 hover:opacity-70 active:scale-90 transition cursor-pointer disabled:cursor-default disabled:opacity-25"
          >
            <SkipForward className="w-9 h-9 fill-current" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowTranscript((s) => !s)}
            aria-expanded={showTranscript}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-medium cursor-pointer ${surface}`}
          >
            <BookOpenText aria-hidden="true" className="size-4" /> Transcription
          </button>
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'fr' ? 'en' : 'fr'))}
            aria-label={`Changer la langue, actuellement ${lang === 'fr' ? 'français' : 'anglais'}`}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3 text-xs font-medium cursor-pointer ${surface}`}
          >
            <Languages aria-hidden="true" className="size-4" /> {lang.toUpperCase()}
          </button>
        </div>
        {article && (
          <button
            type="button"
            onClick={() => onOpenArticle(article.id)}
            className={`mt-4 flex w-full max-w-[322px] items-center gap-3 rounded-2xl border p-3.5 text-left cursor-pointer ${surface}`}
          >
            <BookOpenText aria-hidden="true" className="size-5 shrink-0" />
            <span className="flex-1">
              <span className="block text-xs opacity-75">Fiche pratique</span>
              <span className="block text-sm font-medium leading-snug">{article.title}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 opacity-60" />
          </button>
        )}
        {practice && (
          <button
            type="button"
            onClick={() => onOpenPractice(practice.id)}
            className={`mt-2 flex w-full max-w-[322px] items-center gap-3 rounded-2xl border p-3.5 text-left cursor-pointer ${surface}`}
          >
            <MessagesSquare aria-hidden="true" className="size-5 shrink-0" />
            <span className="flex-1">
              <span className="block text-xs opacity-75">Essayer la situation</span>
              <span className="block text-sm font-medium leading-snug">{practice.title}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 opacity-60" />
          </button>
        )}
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
