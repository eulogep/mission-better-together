import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, BookHeart, Building2, Info, MapPin, PlayCircle, Sparkles, Users, Wind } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { MbtButton } from '../components/MbtButton';
import { useMoodCheck } from '../components/MoodCheck';
import { useSerenity } from '../context/SerenityContext';
import { Route } from '../app/routes';

interface AccueilScreenProps {
  onNavigate: (route: Route) => void;
  onCall: (serviceKey: string) => void;
}

const CALM_WHISPERS = [
  'Prends ton temps · Tu n’es pas seul·e',
  'Respire doucement · Un pas à la fois',
  'Ta parole compte',
  'Personne ne mérite de souffrir en silence',
];

/** Tableau de bord : accès direct à tous les services de MBT. */
export const AccueilScreen: React.FC<AccueilScreenProps> = ({ onNavigate, onCall }) => {
  const { nightMode } = useSerenity();
  const [whisperIdx, setWhisperIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setWhisperIdx((i) => (i + 1) % CALM_WHISPERS.length), 5500);
    return () => window.clearInterval(id);
  }, []);

  const mood = useMoodCheck({
    onBreathe: () => onNavigate({ name: 'serenite' }),
    onChat: () => onNavigate({ name: 'specialistes' }),
    onJournal: () => onNavigate({ name: 'carnet' }),
    onAlert: () => onNavigate({ name: 'alerte' }),
    onSinformer: () => onNavigate({ name: 'article', id: 'je-suis-temoin' }),
    onCall,
  });

  const tiles: { label: string; hint: string; icon: typeof Wind; color: string; route: Route }[] = [
    { label: 'Alerter un proche', hint: 'SMS prêt à envoyer', icon: BellRing, color: '#FF5B5B', route: { name: 'alerte' } },
    { label: 'Mes contacts', hint: 'Personnes de confiance', icon: Users, color: '#007AFF', route: { name: 'contacts' } },
    { label: 'Lieux d’aide', hint: 'Carte autour de moi', icon: MapPin, color: '#00A884', route: { name: 'lieux' } },
    { label: 'Structures d’aide', hint: '3018, 119, 3114…', icon: Building2, color: '#2663FF', route: { name: 'specialistes' } },
    { label: 'Sérénité', hint: 'Respirer, s’apaiser', icon: Wind, color: '#00C492', route: { name: 'serenite' } },
    { label: 'Carnet protégé', hint: 'Noter, garder des preuves', icon: BookHeart, color: '#C691C9', route: { name: 'carnet' } },
    { label: 'Récits', hint: 'Histoires illustratives', icon: PlayCircle, color: '#E5A23A', route: { name: 'temoignages' } },
    { label: 'Comment ça marche', hint: 'MBT et ta vie privée', icon: Info, color: '#7174AA', route: { name: 'a-propos' } },
  ];

  const tileClass = nightMode
    ? 'bg-white/[0.06] border-white/10 text-[#eef0fa] hover:bg-white/10'
    : 'bg-white/90 border-black/[0.07] text-[#1d1b20] hover:bg-white';

  return (
    <ScreenShell theme="default" showBrand onBrandClick={() => onNavigate({ name: 'accueil' })} overlay={mood.sheet}>
      <div className="px-4 mt-1 h-7 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={whisperIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border ${
              nightMode ? 'bg-white/6 border-white/10 text-[#cfd5f0]' : 'bg-white/80 border-[#7174aa]/15 text-[#626585]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#00c492]" />
            {CALM_WHISPERS[whisperIdx]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 mt-3">{mood.widget}</div>

      <div className="px-4 mt-5 grid gap-4 lg:grid-cols-2">
        <MbtButton color="#FF8989" size="lg" onClick={() => onNavigate({ name: 'urgence' })}>
          URGENCE
        </MbtButton>
        <MbtButton color="#7174AA" size="lg" onClick={() => onNavigate({ name: 'sinformer' })}>
          S’INFORMER
        </MbtButton>
      </div>

      <div className="px-4 mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => onNavigate(t.route)}
            className={`min-h-[96px] rounded-[24px] border-2 px-3.5 py-3 flex flex-col items-start justify-between gap-2 text-left active:scale-[0.97] transition cursor-pointer ${tileClass}`}
          >
            <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${t.color}1f`, color: t.color }}>
              <t.icon className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block font-ubuntu font-medium text-[14.5px] leading-tight">{t.label}</span>
              <span className="block mt-0.5 text-[11.5px] leading-tight opacity-60">{t.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </ScreenShell>
  );
};
