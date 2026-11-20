import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookHeart, MessageSquare, Sparkles, User, Wind } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { MbtButton } from '../components/MbtButton';
import { useSerenity } from '../context/SerenityContext';

interface AccueilScreenProps {
  onUrgence: () => void;
  onSinformer: () => void;
  onDetails: () => void;
  onContacts: () => void;
  onSpecialistes: () => void;
  onSanctuary: () => void;
  onJournal: () => void;
  onEmergencyCall: () => void;
}

const CALM_WHISPERS = [
  'Tu es en sécurité ici · Prends ton temps',
  'Respire doucement · Tu n’es pas seul·e',
  'Ta parole compte · Un pas à la fois',
  'Personne ne mérite de souffrir en silence',
];

export const AccueilScreen: React.FC<AccueilScreenProps> = ({
  onUrgence,
  onSinformer,
  onDetails,
  onContacts,
  onSpecialistes,
  onSanctuary,
  onJournal,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  const [whisperIdx, setWhisperIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWhisperIdx((i) => (i + 1) % CALM_WHISPERS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ScreenShell theme="default" showBrand onPhoneFabClick={onEmergencyCall}>
      {/* Quick access rows under MBT — exact Figma hierarchy */}
      <div className="px-4 mt-1 flex flex-col gap-2.5 items-start">
        <button
          type="button"
          onClick={onContacts}
          className={`group flex items-center gap-2.5 cursor-pointer rounded-full pr-3 py-0.5 active:scale-[0.97] transition ${
            nightMode ? 'hover:bg-white/8' : 'hover:bg-black/5'
          }`}
        >
          <span
            className={`w-[48px] h-[48px] rounded-full border flex items-center justify-center transition ${
              nightMode
                ? 'border-white/30 bg-white/8 text-white group-hover:border-white'
                : 'border-[#8e8e93] bg-white/85 text-black group-hover:border-black'
            }`}
          >
            <User className="w-7 h-7" strokeWidth={2.1} />
          </span>
          <span
            className={`font-ubuntu font-medium text-[13px] leading-[1.2] tracking-[-0.13px] text-left max-w-[95px] ${
              nightMode ? 'text-[#eef0fa]' : 'text-black'
            }`}
          >
            Contacts d’urgence
          </span>
        </button>

        <button
          type="button"
          onClick={onSpecialistes}
          className={`group flex items-center gap-3 pl-2 cursor-pointer rounded-full pr-3 py-1 active:scale-[0.97] transition ${
            nightMode ? 'hover:bg-white/8' : 'hover:bg-black/5'
          }`}
        >
          <span className="w-[32px] h-[32px] flex items-center justify-center">
            <MessageSquare
              className={`w-7 h-7 ${
                nightMode ? 'fill-[#eef0fa] text-[#eef0fa]' : 'fill-[#1d1b20] text-[#1d1b20]'
              }`}
            />
          </span>
          <span
            className={`font-ubuntu font-medium text-[13px] leading-[1.2] tracking-[-0.13px] text-left max-w-[95px] ${
              nightMode ? 'text-[#eef0fa]' : 'text-black'
            }`}
          >
            Contacter spécialistes
          </span>
        </button>
      </div>

      {/* Gentle Breathing Affirmation Pill */}
      <div className="px-5 mt-3 mb-2 h-7 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={whisperIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.55 }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11.5px] font-medium backdrop-blur-xs border ${
              nightMode
                ? 'bg-white/6 border-white/10 text-[#cfd5f0]'
                : 'bg-white/80 border-[#7174aa]/15 text-[#626585]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#00c492]" />
            <span>{CALM_WHISPERS[whisperIdx]}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Figma CTA Buttons Stack */}
      <div className="px-4 mt-1 flex flex-col gap-[18px]">
        <MbtButton color="#FF8989" size="lg" onClick={onUrgence}>
          URGENCE
        </MbtButton>

        <MbtButton color="#7174AA" size="lg" onClick={onSinformer}>
          S’INFORMER
        </MbtButton>

        <div className="flex justify-center">
          <MbtButton color="#3B3B3B" size="md" className="w-[228px]" onClick={onDetails}>
            Détails
          </MbtButton>
        </div>

        {/* Serene Sanctuary & Protected Journal Companion Pills */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSanctuary}
            className={`h-[48px] rounded-[22px] px-3.5 flex items-center justify-center gap-2 text-[13px] font-ubuntu font-medium border-2 transition cursor-pointer backdrop-blur-sm ${
              nightMode
                ? 'bg-[#00e8ae]/12 border-[#00e8ae]/45 text-[#7ef7d6] hover:bg-[#00e8ae]/20'
                : 'bg-[#effcf8]/90 border-[#00e8ae]/65 text-[#008564] hover:bg-[#e2f9f2]'
            }`}
          >
            <Wind className="w-4 h-4 shrink-0" />
            <span>Espace Sérénité</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onJournal}
            className={`h-[48px] rounded-[22px] px-3.5 flex items-center justify-center gap-2 text-[13px] font-ubuntu font-medium border-2 transition cursor-pointer backdrop-blur-sm ${
              nightMode
                ? 'bg-[#c691c9]/14 border-[#c691c9]/45 text-[#ecc6ee] hover:bg-[#c691c9]/22'
                : 'bg-[#fbf4fc]/90 border-[#c691c9]/65 text-[#8a4d8e] hover:bg-[#f5e7f7]'
            }`}
          >
            <BookHeart className="w-4 h-4 shrink-0" />
            <span>Carnet Protégé</span>
          </motion.button>
        </div>
      </div>
    </ScreenShell>
  );
};
