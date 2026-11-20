import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, EyeOff, Heart, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { THEMES, ThemeKey } from '../data/content';
import { useSerenity } from '../context/SerenityContext';

interface ScreenShellProps {
  theme?: ThemeKey;
  showBrand?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onBrandClick?: () => void;
  /** @deprecated Le bouton SOS est désormais dans la navigation de l'application. */
  showPhoneFab?: boolean;
  /** @deprecated Le bouton SOS est désormais dans la navigation de l'application. */
  onPhoneFabClick?: () => void;
  /** Défilement vertical du contenu (activé par défaut : rien n'est coupé sur petit écran). */
  scrollable?: boolean;
  topRight?: React.ReactNode;
  /** Fenêtre superposée (feuille du bas…) affichée au-dessus du contenu */
  overlay?: React.ReactNode;
  children: React.ReactNode;
}

// Halo aquarelle propre à chaque thème
const AURAS: Record<ThemeKey, [string, string]> = {
  default: ['rgba(255, 222, 83, 0.22)', 'rgba(255, 137, 137, 0.14)'],
  sinformer: ['rgba(113, 116, 170, 0.18)', 'rgba(0, 232, 174, 0.14)'],
  primaire: ['rgba(0, 232, 174, 0.20)', 'rgba(130, 215, 255, 0.14)'],
  college: ['rgba(198, 145, 201, 0.22)', 'rgba(113, 116, 170, 0.14)'],
  adulte: ['rgba(113, 116, 170, 0.15)', 'rgba(155, 165, 190, 0.12)'],
  parent: ['rgba(140, 87, 52, 0.16)', 'rgba(255, 214, 153, 0.18)'],
};

/**
 * Cadre commun des écrans MBT : halos et filigranes de la charte, barre du haut
 * (retour + raccourcis son / nuit / mode discret), titre « MBT », contenu défilable.
 */
export const ScreenShell: React.FC<ScreenShellProps> = ({
  theme = 'default',
  showBrand = true,
  showBack = false,
  onBack,
  onBrandClick,
  scrollable = true,
  topRight,
  overlay,
  children,
}) => {
  const palette = THEMES[theme];
  const { nightMode, toggleNightMode, isSoundActive, toggleQuickAmbient, enterDiscreetMode } = useSerenity();
  const [auraA, auraB] = AURAS[theme];
  const markOpacity = nightMode ? 0.42 : 0.95;

  const pill = `w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-sm border`;

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex flex-col transition-colors duration-500 ${
        nightMode ? 'bg-[#141724] text-[#eef0fa]' : 'bg-[#fdfdff] text-[#1d1b20]'
      }`}
    >
      {/* Décor : halos lents + filigranes de la charte Figma */}
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
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-60px] top-[22px] w-[289.667px] h-[289.667px] flex items-center justify-center"
        >
          <div className="rotate-[20deg] w-[226px] h-[226px]">
            <div
              className="w-full h-full watermark-mask watermark-warning transition-colors duration-500"
              style={{ backgroundColor: palette.watermarkColor, opacity: markOpacity }}
            />
          </div>
        </motion.div>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-31px] top-[58%] w-[201px] h-[201px] watermark-mask watermark-call transition-colors duration-500"
          style={{ backgroundColor: palette.watermarkColor, opacity: markOpacity }}
        />
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-48px] bottom-[-60px] w-[211px] h-[211px] flex items-center justify-center rotate-[14deg]"
        >
          <Heart
            className="w-[185px] h-[185px] transition-colors duration-500"
            style={{ color: palette.watermarkColor, opacity: markOpacity }}
            strokeWidth={1.35}
          />
        </motion.div>
      </div>

      {/* Barre du haut : retour + raccourcis (ambiance sonore, nuit, mode discret) */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-2 h-12 shrink-0">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className={`w-10 h-10 -ml-1.5 flex items-center justify-center rounded-full active:scale-90 transition cursor-pointer ${
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
          <button
            type="button"
            onClick={toggleQuickAmbient}
            title={isSoundActive ? 'Couper l’ambiance sonore' : 'Activer une ambiance sonore douce'}
            aria-label={isSoundActive ? 'Couper l’ambiance sonore' : 'Activer une ambiance sonore douce'}
            aria-pressed={isSoundActive}
            className={`${pill} ${
              isSoundActive
                ? 'bg-[#00e8ae]/20 border-[#00c492]/50 text-[#00a87e]'
                : nightMode
                  ? 'bg-white/8 border-white/10 text-white/70 hover:text-white'
                  : 'bg-white/75 border-black/8 text-[#666] hover:text-black'
            }`}
          >
            {isSoundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={toggleNightMode}
            title={nightMode ? 'Passer en mode jour' : 'Passer en mode nuit'}
            aria-label={nightMode ? 'Passer en mode jour' : 'Passer en mode nuit'}
            aria-pressed={nightMode}
            className={`${pill} ${
              nightMode
                ? 'bg-[#ffde53]/20 border-[#ffde53]/40 text-[#ffde53]'
                : 'bg-white/75 border-black/8 text-[#666] hover:text-black'
            }`}
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={enterDiscreetMode}
            title="Mode discret : masquer l’application derrière une page de révisions"
            aria-label="Mode discret"
            className={`${pill} ${
              nightMode
                ? 'bg-white/8 border-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                : 'bg-white/75 border-black/8 text-[#666] hover:bg-black/5 hover:text-black'
            }`}
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div
        className={`relative z-10 flex-1 min-h-0 flex flex-col ${
          scrollable ? 'overflow-y-auto overscroll-contain no-scrollbar pb-10' : 'overflow-hidden'
        }`}
      >
        {showBrand && (
          <div className="px-[35px]">
            <button
              type="button"
              onClick={onBrandClick}
              title="Retour à l'accueil"
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
      </div>

      {overlay}
    </div>
  );
};
