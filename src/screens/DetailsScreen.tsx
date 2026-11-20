import React from 'react';
import { Phone } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { useSerenity } from '../context/SerenityContext';

interface DetailsScreenProps {
  onBack: () => void;
  onHome: () => void;
  onUrgence: () => void;
  onSinformer: () => void;
  onEmergencyCall: () => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  onBack,
  onHome,
  onUrgence,
  onSinformer,
  onEmergencyCall,
}) => {
  const { nightMode } = useSerenity();
  const cardBg = nightMode ? 'bg-[#1c2033]/90 backdrop-blur-md' : 'bg-white/95';

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
      scrollable
      topRight={
        <img
          src="/assets/mission-logo.png"
          alt="Mission Better Together"
          className={`h-[22px] w-auto object-contain ${nightMode ? 'brightness-125' : ''}`}
        />
      }
    >
      <div className="px-4 mt-4 flex flex-col gap-6">
        <button
          type="button"
          onClick={onUrgence}
          className={`${cardBg} border-[6px] border-[#FF8989] rounded-[30px] px-5 py-6 text-left cursor-pointer hover:shadow-md active:scale-[0.98] transition`}
        >
          <p className="font-ubuntu font-medium text-[21px] leading-[1.32] tracking-[-0.21px] text-[#FF8989]">
            La rubrique “ALERTER” fournit un quizz adaptatif vous accompagnant et fournissant des
            solutions, des contacts ainsi que des lieux sécurisés, que vous soyez témoin ou victime.
          </p>
        </button>

        <button
          type="button"
          onClick={onSinformer}
          className={`${cardBg} border-[6px] border-[#7174AA] rounded-[30px] px-5 py-6 text-left cursor-pointer hover:shadow-md active:scale-[0.98] transition`}
        >
          <p
            className={`font-ubuntu font-medium text-[21px] leading-[1.32] tracking-[-0.21px] ${
              nightMode ? 'text-[#a8abe0]' : 'text-[#7174AA]'
            }`}
          >
            La rubrique “S’INFORMER” vous donne accès à des conseils, des témoignages, des
            ressources téléphoniques ainsi qu’un ensemble de lieux sécurisés où se réfugier.
          </p>
        </button>

        <div className="relative pt-8">
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[64px] h-[62px] rounded-full mbt-phone-fab flex items-center justify-center ${
              nightMode ? 'bg-[#22263b] text-white border border-white/15' : 'bg-white text-[#1d1b20]'
            }`}
          >
            <Phone className="w-7 h-7" strokeWidth={2.3} />
          </div>
          <button
            type="button"
            onClick={onEmergencyCall}
            className={`w-full ${cardBg} border-[6px] border-[#7174AA] rounded-[30px] px-5 pt-11 pb-6 text-left cursor-pointer hover:shadow-md active:scale-[0.98] transition`}
          >
            <p
              className={`font-ubuntu font-medium text-[21px] leading-[1.32] tracking-[-0.21px] ${
                nightMode ? 'text-[#a8abe0]' : 'text-[#7174AA]'
              }`}
            >
              Sert à appeler un service d’assistance qui vous redirigera vers le service adéquat.
            </p>
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};
