import React, { useState } from 'react';
import { ArrowRight, Heart, Lock, LogOut, Phone, ShieldAlert, UserPlus } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { ProfileId, THEMES } from '../data/content';
import { saveProfile, setOnboarded } from '../lib/profile';
import { vibrate } from '../lib/device';

interface OnboardingScreenProps {
  /** Fin de l'accueil : vers l'accueil, les contacts (ajout d'un proche) ou l'urgence */
  onFinish: (next: 'home' | 'contacts' | 'urgence') => void;
}

const PROFILES: { id: ProfileId; label: string }[] = [
  { id: 'primaire', label: 'PRIMAIRE' },
  { id: 'college', label: 'COLLÈGE\nLYCÉE' },
  { id: 'adulte', label: 'ADULTE' },
  { id: 'parent', label: 'PARENT' },
];

/** Bulles flottantes reprenant les rubriques de l'app (même style que les boutons MBT). */
const FloatingPill: React.FC<{ label: string; color: string; className: string; rotate: number; delay: number }> = ({
  label,
  color,
  className,
  rotate,
  delay,
}) => (
  <span
    className={`absolute mbt-float px-4 py-2 rounded-[22px] bg-white border-[4px] font-ubuntu font-medium text-[15px] shadow-[0_10px_24px_rgba(0,0,0,0.08)] ${className}`}
    style={{ borderColor: color, color, ['--r' as string]: `${rotate}deg`, animationDelay: `${delay}s` }}
  >
    {label}
  </span>
);

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId | null>(null);

  const finish = (next: 'home' | 'contacts' | 'urgence') => {
    if (profile) saveProfile(profile);
    setOnboarded();
    vibrate(20);
    onFinish(next);
  };

  const next = () => (step < 2 ? setStep(step + 1) : finish('home'));

  return (
    <ScreenShell theme="default" showBrand={false} showPhoneFab={false}>
      <div className="flex-1 flex flex-col px-5 pt-5 pb-7">
        {/* Haut : urgence toujours accessible + passer */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => finish('urgence')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF8989]/15 text-[#d4474c] text-[13px] font-semibold cursor-pointer active:scale-95 transition"
          >
            <ShieldAlert className="w-4 h-4" />
            Urgence
          </button>
          {step < 2 && (
            <button
              type="button"
              onClick={() => finish('home')}
              className="text-[14px] font-medium text-[#8e8e93] hover:text-[#1d1b20] cursor-pointer"
            >
              Passer
            </button>
          )}
        </div>

        <div key={step} className="flex-1 flex flex-col mbt-enter-forward">
          {step === 0 && (
            <>
              <div className="relative h-[300px] mt-2" aria-hidden="true">
                <span className="absolute left-1/2 top-[86px] -translate-x-1/2 font-ubuntu font-medium text-[96px] leading-none tracking-[-1px] text-[#FFDE53]">
                  MBT
                </span>
                <div className="absolute left-1/2 top-[30px] -translate-x-1/2">
                  <Heart className="w-12 h-12 text-[#FF8989] fill-[#FF8989]/30 mbt-float" strokeWidth={2.2} />
                </div>
                <FloatingPill label="URGENCE" color="#FF8989" className="left-0 top-[200px]" rotate={-6} delay={0} />
                <FloatingPill label="S’INFORMER" color="#7174AA" className="right-0 top-[176px]" rotate={5} delay={0.8} />
                <FloatingPill label="RESPIRER" color="#C691C9" className="left-[30%] top-[252px]" rotate={-2} delay={1.6} />
              </div>
              <h1 className="mt-2 font-ubuntu font-bold text-[32px] leading-[1.15] text-[#1d1b20]">
                Ici, tu n’es jamais seul·e.
              </h1>
              <p className="mt-3 font-ubuntu text-[16px] leading-[1.5] text-[#3b3b3b]">
                MBT t’aide face au harcèlement : alerter, t’informer, trouver un lieu sûr, garder des preuves et souffler
                un peu.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="mt-6 font-ubuntu font-bold text-[30px] leading-[1.15] text-[#1d1b20]">
                Ton espace reste secret.
              </h1>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-start gap-4 rounded-[24px] bg-white border-[3px] border-[#7174AA]/40 px-4 py-4">
                  <span className="w-12 h-12 shrink-0 rounded-full bg-[#7174AA]/12 text-[#7174AA] flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </span>
                  <p className="text-[14.5px] leading-[1.45] text-[#3b3b3b]">
                    <strong className="text-[#1d1b20]">Rien ne quitte ton téléphone.</strong> Tes contacts et ton journal
                    restent ici, sans compte ni inscription.
                  </p>
                </div>
                <div className="flex items-start gap-4 rounded-[24px] bg-white border-[3px] border-black/10 px-4 py-4">
                  <span className="shrink-0 mt-1 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#1d1b20] text-white text-[11px] font-semibold">
                    <LogOut className="w-3 h-3" />
                    Sortie rapide
                  </span>
                  <p className="text-[14.5px] leading-[1.45] text-[#3b3b3b]">
                    Quelqu’un regarde ? <strong className="text-[#1d1b20]">Un appui</strong> et l’app disparaît derrière
                    une page météo.
                  </p>
                </div>
                <div className="flex items-start gap-4 rounded-[24px] bg-white border-[3px] border-[#FF8989]/50 px-4 py-4">
                  <span className="relative w-12 h-12 shrink-0 rounded-full bg-white mbt-phone-fab flex items-center justify-center text-[#1d1b20]">
                    <Phone className="w-6 h-6" strokeWidth={2.3} />
                    <svg className="absolute -inset-1.5 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                      <circle cx="30" cy="30" r="27" fill="none" stroke="#FF5B5B" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="170" strokeDashoffset="55" />
                    </svg>
                  </span>
                  <p className="text-[14.5px] leading-[1.45] text-[#3b3b3b]">
                    <strong className="text-[#1d1b20]">Maintiens le bouton téléphone</strong> une seconde pour appeler les
                    secours. Pas d’appel par erreur dans ta poche.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="mt-6 font-ubuntu font-bold text-[30px] leading-[1.15] text-[#1d1b20]">Tu es…</h1>
              <p className="mt-2 text-[14.5px] text-[#666]">Pour te proposer les conseils qui te correspondent.</p>
              <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Ton profil">
                {PROFILES.map((p) => {
                  const color = THEMES[p.id].accent;
                  const active = profile === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        vibrate(12);
                        setProfile(p.id);
                      }}
                      className={`h-[96px] rounded-[28px] border-[6px] font-ubuntu font-medium text-[20px] leading-[1.15] whitespace-pre-line transition-all duration-200 cursor-pointer active:scale-95 ${
                        active ? 'shadow-[0_12px_26px_rgba(0,0,0,0.15)] -translate-y-0.5' : ''
                      }`}
                      style={{
                        borderColor: color,
                        backgroundColor: active ? color : '#fff',
                        color: active ? (p.id === 'primaire' || p.id === 'college' ? '#1d1b20' : '#fff') : color,
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => finish('contacts')}
                className="mt-5 flex items-center gap-3 px-4 py-3.5 rounded-[22px] bg-white border-[3px] border-dashed border-[#FF8989] text-left cursor-pointer active:scale-[0.98] transition"
              >
                <UserPlus className="w-6 h-6 text-[#FF8989] shrink-0" />
                <span className="text-[14px] leading-snug text-[#3b3b3b]">
                  <strong className="text-[#1d1b20]">Ajouter une personne de confiance</strong>
                  <span className="block text-[12.5px] text-[#777]">Pour pouvoir la prévenir en un geste.</span>
                </span>
              </button>
            </>
          )}
        </div>

        {/* Bas : progression + bouton principal */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2" aria-label={`Étape ${step + 1} sur 3`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#FF8989]' : 'w-2.5 bg-black/12'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 h-[62px] px-7 rounded-[31px] bg-white border-[6px] border-[#FF8989] text-[#FF8989] font-ubuntu font-medium text-[20px] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] active:scale-95 transition cursor-pointer"
          >
            {step < 2 ? 'Continuer' : 'C’est parti'}
            <ArrowRight className="w-5 h-5" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};
