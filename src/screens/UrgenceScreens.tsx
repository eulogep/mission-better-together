import React from 'react';
import { Phone } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { MbtButton } from '../components/MbtButton';
import { useSerenity } from '../context/SerenityContext';

interface UrgenceRoleProps {
  onBack: () => void;
  onHome: () => void;
  onTemoin: () => void;
  onVictime: () => void;
  onEmergencyCall: () => void;
}

export const UrgenceRoleScreen: React.FC<UrgenceRoleProps> = ({
  onBack,
  onHome,
  onTemoin,
  onVictime,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
    >
      <div className="px-4 flex flex-col items-center mt-20">
        <h1
          className={`font-ubuntu font-bold text-[32px] leading-[1.3] text-center mb-10 ${
            nightMode ? 'text-[#f3f4fa]' : 'text-black'
          }`}
        >
          Êtes-vous...
        </h1>
        <div className="w-full flex flex-col gap-6">
          <MbtButton color="#FF8989" size="lg" onClick={onTemoin}>
            TEMOIN
          </MbtButton>
          <MbtButton color="#FF8989" size="lg" onClick={onVictime}>
            VICTIME
          </MbtButton>
        </div>
      </div>
    </ScreenShell>
  );
};

interface VictimeActionsProps {
  onBack: () => void;
  onHome: () => void;
  onMap: () => void;
  onCall: (serviceKey: string) => void;
}

export const VictimeActionsScreen: React.FC<VictimeActionsProps> = ({
  onBack,
  onHome,
  onMap,
  onCall,
}) => (
  <ScreenShell
    theme="default"
    showBack
    onBack={onBack}
    onBrandClick={onHome}
    onPhoneFabClick={() => onCall('urgence')}
  >
    <div className="px-4 mt-4 flex flex-col gap-[16px]">
      <MbtButton color="#FF8989" size="lg" onClick={onMap}>
        Carte de lieux sécurisés
      </MbtButton>
      <MbtButton color="#FF8989" size="lg" onClick={() => onCall('3018')}>
        3018 - Harcèlement
      </MbtButton>
      <MbtButton color="#FF8989" size="lg" onClick={() => onCall('3114')}>
        3114 - Suicide
      </MbtButton>
      <MbtButton color="#FF8989" size="lg" onClick={() => onCall('17')}>
        17 - POLICE
      </MbtButton>
    </div>
  </ScreenShell>
);

interface TemoinQuestionProps {
  step: 'blessee' | 'harceleurs' | 'danger';
  onBack: () => void;
  onHome: () => void;
  onYes: () => void;
  onNo: () => void;
  onEmergencyCall: () => void;
}

export const TemoinQuestionScreen: React.FC<TemoinQuestionProps> = ({
  step,
  onBack,
  onHome,
  onYes,
  onNo,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  const copy = {
    blessee: {
      subtitle: null,
      question: 'La victime est-elle blessée ?',
    },
    harceleurs: {
      subtitle: 'La victime n’est pas blessée',
      question: 'Les harceleurs sont-ils présents ?',
    },
    danger: {
      subtitle: 'Les harceleurs ne sont pas présents',
      question: 'La victime est-elle en danger ?',
    },
  }[step];

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
    >
      <div className="px-4 flex flex-col items-center mt-8">
        <div className="min-h-[56px] flex items-center justify-center mb-2">
          {copy.subtitle && (
            <p
              className={`font-ubuntu font-normal text-[21px] leading-[1.3] text-center px-2 ${
                nightMode ? 'text-[#cfd4ea]' : 'text-black'
              }`}
            >
              {copy.subtitle}
            </p>
          )}
        </div>
        <h1
          className={`font-ubuntu font-bold text-[30px] leading-[1.25] text-center mb-10 px-2 ${
            nightMode ? 'text-[#f3f4fa]' : 'text-black'
          }`}
        >
          {copy.question}
        </h1>
        <div className="w-full flex flex-col gap-6">
          <MbtButton color="#FF8989" size="lg" onClick={onYes}>
            OUI
          </MbtButton>
          <MbtButton color="#FF8989" size="lg" onClick={onNo}>
            NON
          </MbtButton>
        </div>
      </div>
    </ScreenShell>
  );
};

interface SecoursCallProps {
  reason: 'blessee' | 'harceleurs' | 'danger';
  onBack: () => void;
  onHome: () => void;
  onCall: (serviceKey: string) => void;
}

export const SecoursCallScreen: React.FC<SecoursCallProps> = ({
  reason,
  onBack,
  onHome,
  onCall,
}) => {
  const { nightMode } = useSerenity();
  const subtitle = {
    blessee: 'La victime est blessée.',
    harceleurs: 'Les harceleurs sont présents',
    danger: 'La victime n’est pas hors de danger.',
  }[reason];

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      showPhoneFab={false}
    >
      <div className="px-5 flex flex-col items-center mt-12">
        <p
          className={`font-ubuntu font-normal text-[23px] leading-[1.3] text-center mb-3 ${
            nightMode ? 'text-[#cfd4ea]' : 'text-black'
          }`}
        >
          {subtitle}
        </p>
        <h1
          className={`font-ubuntu font-bold text-[32px] leading-[1.2] text-center mb-14 ${
            nightMode ? 'text-[#f3f4fa]' : 'text-black'
          }`}
        >
          Appelez les secours.
        </h1>

        <button
          type="button"
          onClick={() => onCall('urgence')}
          aria-label="Appeler les secours"
          className={`animate-emergency-pulse w-[142px] h-[136px] rounded-full flex items-center justify-center active:scale-95 transition cursor-pointer ${
            nightMode
              ? 'bg-[#22263b] text-white border border-white/15 hover:text-[#ff8989]'
              : 'bg-white text-[#1d1b20] hover:text-[#e5484d]'
          }`}
        >
          <Phone className="w-[68px] h-[68px]" strokeWidth={2.2} />
        </button>

        <div className="mt-14 flex flex-wrap justify-center gap-2.5">
          {[
            { key: '15', label: '15 · SAMU' },
            { key: '17', label: '17 · Police' },
            { key: '3018', label: '3018 · Harcèlement' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onCall(item.key)}
              className={`px-4 py-2 rounded-full border-2 border-[#FF8989] text-[#FF8989] font-ubuntu font-medium text-[14px] hover:bg-[#FF8989] hover:text-white active:scale-95 transition cursor-pointer ${
                nightMode ? 'bg-[#1c2033]' : 'bg-white/95'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
};
