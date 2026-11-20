import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, EyeOff, Heart, Moon, Phone, Sun, Volume2, VolumeX } from 'lucide-react';
import { THEMES, ThemeKey } from '../data/content';
import { useSerenity } from '../context/SerenityContext';

interface ScreenShellProps {
  theme?: ThemeKey;
  showBrand?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onBrandClick?: () => void;
  showPhoneFab?: boolean;
  onPhoneFabClick?: () => void;
  scrollable?: boolean;
  topRight?: React.ReactNode;
  children: React.ReactNode;
}

export const ScreenShell: React.FC<ScreenShellProps> = ({
  theme = 'default',
  showBrand = true,
  showBack = false,
  onBack,
  onBrandClick,
  showPhoneFab = true,
  onPhoneFabClick,
  scrollable = false,
  topRight,
  children,
}) => {
  const palette = THEMES[theme];
  const { nightMode, toggleNightMode, isSoundActive, toggleQuickAmbient, enterDiscreetMode } =
    useSerenity();

  // Soft adaptive watercolor halo tint per theme
  const auraColors: Record<ThemeKey, [string, string]> = {
    default: ['rgba(255, 222, 83, 0.22)', 'rgba(255, 137, 137, 0.14)'],
    sinformer: ['rgba(113, 116, 170, 0.18)', 'rgba(0, 232, 174, 0.14)'],
    primaire: ['rgba(0, 232, 174, 0.20)', 'rgba(130, 215, 255, 0.14)'],
    college: ['rgba(198, 145, 201, 0.22)', 'rgba(113, 116, 170, 0.14)'],
    adulte: ['rgba(113, 116, 170, 0.15)', 'rgba(155, 165, 190, 0.12)'],
    parent: ['rgba(140, 87, 52, 0.16)', 'rgba(255, 214, 153, 0.18)'],
  };

  const [auraA, auraB] = auraColors[theme];

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none flex flex-col transition-colors duration-500 ${
        nightMode ? 'bg-[#141724] text-[#eef0fa]' : 'bg-[#fdfdff] text-[#1d1b20]'
      }`}
    >
      {/* Living Breathing Serenity Aura (12s slow parasympathetic drift) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
        <motion.div
          animate={{ scale: [1, 1.14, 1], x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-12 w-[270px] h-[270px] rounded-full blur-[68px]"
          style={{ background: auraA, opacity: nightMode ? 0.55 : 0.9 }}
        />
        <motion.div
          animate={{ scale: [1.06, 0.94, 1.06], x: [0, -14, 0], y: [0, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 -left-14 w-[280px] h-[280px] rounded-full blur-[74px]"
          style={{ background: auraB, opacity: nightMode ? 0.5 : 0.85 }}
        />

        {/* Decorative Figma Watermarks (exact positions & rotation, subtly floating) */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[160px] top-[22px] w-[289.667px] h-[289.667px] flex items-center justify-center"
        >
          <div className="rotate-[20deg] w-[226px] h-[226px]">
            <div
              className="w-full h-full watermark-mask watermark-warning transition-colors duration-500"
              style={{
                backgroundColor: palette.watermarkColor,
                opacity: nightMode ? 0.42 : 0.95,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-31px] top-[522px] w-[201px] h-[201px] watermark-mask watermark-call transition-colors duration-500"
          style={{
            backgroundColor: palette.watermarkColor,
            opacity: nightMode ? 0.42 : 0.95,
          }}
        />

        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[228px] top-[662px] w-[211px] h-[211px] flex items-center justify-center rotate-[14deg]"
        >
          <Heart
            className="w-[185px] h-[185px] transition-colors duration-500"
            style={{
              color: palette.watermarkColor,
              opacity: nightMode ? 0.42 : 0.95,
            }}
            strokeWidth={1.35}
          />
        </motion.div>
      </div>

      {/* Top Bar: Back Chevron + Whisper-Quiet Serenity Utility Pills (Sound / Night / Discreet Exit) */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-3.5 h-12 shrink-0">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className={`w-9 h-9 -ml-1 flex items-center justify-center rounded-full active:scale-90 transition cursor-pointer ${
              nightMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'
            }`}
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2} />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <div className="flex items-center gap-1.5">
          {topRight && <div className="mr-1">{topRight}</div>}

          {/* Quick Ambient Sound Toggle */}
          <button
            type="button"
            onClick={toggleQuickAmbient}
            title={isSoundActive ? 'Couper l’ambiance sonore' : 'Activer l’ambiance pluie & 432 Hz'}
            aria-label="Ambiance sonore apaisante"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-sm border ${
              isSoundActive
                ? 'bg-[#00e8ae]/20 border-[#00c492]/50 text-[#00a87e]'
                : nightMode
                ? 'bg-white/8 border-white/10 text-white/70 hover:text-white'
                : 'bg-white/75 border-black/8 text-[#666] hover:text-black'
            }`}
          >
            {isSoundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Nuit Sereine (Warm Low-Light Mode) */}
          <button
            type="button"
            onClick={toggleNightMode}
            title={nightMode ? 'Passer en mode Jour doux' : 'Passer en mode Nuit Sereine'}
            aria-label="Mode Nuit Sereine"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-sm border ${
              nightMode
                ? 'bg-[#ffde53]/20 border-[#ffde53]/40 text-[#ffde53]'
                : 'bg-white/75 border-black/8 text-[#666] hover:text-black'
            }`}
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Trauma-Informed Instant Quick Exit (Mode Discret) */}
          <button
            type="button"
            onClick={enterDiscreetMode}
            title="Mode Discret instantané (masquer l’écran)"
            aria-label="Mode Discret"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-sm border ${
              nightMode
                ? 'bg-white/8 border-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                : 'bg-white/75 border-black/8 text-[#666] hover:bg-black/5 hover:text-black'
            }`}
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 flex-1 flex flex-col ${
          scrollable ? 'overflow-y-auto no-scrollbar pb-32' : 'overflow-hidden'
        }`}
      >
        {showBrand && (
          <div className="px-[35px] pt-0">
            <button
              type="button"
              onClick={onBrandClick}
              title="Retour à l'accueil MBT"
              className="font-ubuntu font-medium text-[64px] leading-[1.05] tracking-[-0.64px] text-left cursor-pointer hover:opacity-80 active:scale-[0.98] transition"
              style={{
                color:
                  nightMode && theme === 'adulte'
                    ? '#d7dbe8'
                    : nightMode && theme === 'default'
                    ? 'rgba(255, 222, 83, 0.72)'
                    : palette.brandColor,
              }}
            >
              MBT
            </button>
          </div>
        )}
        {children}
      </motion.div>

      {/* Floating Emergency Call FAB (Bottom Center — exact Figma geometry) */}
      {showPhoneFab && onPhoneFabClick && (
        <div className="pointer-events-none absolute bottom-[22px] inset-x-0 z-30 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onPhoneFabClick}
            aria-label="Appeler le service d'assistance d'urgence"
            title="Appel d'urgence"
            className={`pointer-events-auto mbt-phone-fab w-[88px] h-[84px] rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${
              nightMode
                ? 'bg-[#21253a] text-white border border-white/15 hover:text-[#ff8989]'
                : 'bg-white text-[#1d1b20] hover:bg-[#fff8f8] hover:text-[#e5484d]'
            }`}
          >
            <Phone className="w-[40px] h-[40px]" strokeWidth={2.3} />
          </motion.button>
        </div>
      )}
    </div>
  );
};
