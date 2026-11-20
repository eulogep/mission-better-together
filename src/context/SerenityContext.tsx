import React, { createContext, useContext, useEffect, useState } from 'react';
import { SoundChannel, soundEngine, SoundLevels } from '../utils/soundEngine';

interface SerenityContextValue {
  nightMode: boolean;
  toggleNightMode: () => void;
  discreetMode: boolean;
  enterDiscreetMode: () => void;
  exitDiscreetMode: () => void;
  soundLevels: SoundLevels;
  isSoundActive: boolean;
  setSoundLevel: (channel: SoundChannel, level: number) => void;
  applyPreset: (levels: SoundLevels) => void;
  toggleQuickAmbient: () => void;
  stopAllSounds: () => void;
}

const SerenityContext = createContext<SerenityContextValue | null>(null);

const NIGHT_STORAGE_KEY = 'mbt_night_mode_v1';

export const SerenityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nightMode, setNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NIGHT_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [discreetMode, setDiscreetMode] = useState(false);
  const [soundLevels, setSoundLevels] = useState<SoundLevels>({
    rain: 0,
    ocean: 0,
    breeze: 0,
    harmony: 0,
  });

  // Persist night mode preference
  useEffect(() => {
    try {
      localStorage.setItem(NIGHT_STORAGE_KEY, String(nightMode));
    } catch {
      // ignore
    }
  }, [nightMode]);

  // Double-Escape keyboard shortcut for instant Quick Exit (trauma-informed safety)
  useEffect(() => {
    let lastEsc = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 600) {
          soundEngine.stopAll();
          setSoundLevels({ rain: 0, ocean: 0, breeze: 0, harmony: 0 });
          setDiscreetMode(true);
        }
        lastEsc = now;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const setSoundLevel = (channel: SoundChannel, level: number) => {
    soundEngine.setLevel(channel, level);
    setSoundLevels(soundEngine.getLevels());
  };

  const applyPreset = (levels: SoundLevels) => {
    (Object.keys(levels) as SoundChannel[]).forEach((ch) => {
      soundEngine.setLevel(ch, levels[ch]);
    });
    setSoundLevels(soundEngine.getLevels());
  };

  const stopAllSounds = () => {
    soundEngine.stopAll();
    setSoundLevels({ rain: 0, ocean: 0, breeze: 0, harmony: 0 });
  };

  const isSoundActive = Object.values(soundLevels).some((v) => v > 0.01);

  const toggleQuickAmbient = () => {
    if (isSoundActive) {
      stopAllSounds();
    } else {
      applyPreset({ rain: 0.45, ocean: 0, breeze: 0.15, harmony: 0.3 });
    }
  };

  const enterDiscreetMode = () => {
    stopAllSounds();
    setDiscreetMode(true);
  };

  const exitDiscreetMode = () => setDiscreetMode(false);

  return (
    <SerenityContext.Provider
      value={{
        nightMode,
        toggleNightMode: () => setNightMode((n) => !n),
        discreetMode,
        enterDiscreetMode,
        exitDiscreetMode,
        soundLevels,
        isSoundActive,
        setSoundLevel,
        applyPreset,
        toggleQuickAmbient,
        stopAllSounds,
      }}
    >
      {children}
    </SerenityContext.Provider>
  );
};

export function useSerenity(): SerenityContextValue {
  const ctx = useContext(SerenityContext);
  if (!ctx) throw new Error('useSerenity must be used within SerenityProvider');
  return ctx;
}
