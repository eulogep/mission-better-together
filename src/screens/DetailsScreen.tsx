import React from 'react';
import { EyeOff, Lock, LogOut, MapPin, Phone, ServerOff, Smartphone } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { useSerenity } from '../context/SerenityContext';

interface DetailsScreenProps {
  onBack: () => void;
  onHome: () => void;
  onUrgence: () => void;
  onSinformer: () => void;
  /** @deprecated SOS dans la navigation */
  onEmergencyCall?: () => void;
}

/** « Comment ça marche » : les rubriques (Figma « Détails ») + vie privée, en langage clair. */
export const DetailsScreen: React.FC<DetailsScreenProps> = ({ onBack, onHome, onUrgence, onSinformer }) => {
  const { nightMode } = useSerenity();
  const cardBg = nightMode ? 'bg-[#1c2033]/90 backdrop-blur-md' : 'bg-white/95';
  const violet = nightMode ? 'text-[#a8abe0]' : 'text-[#7174AA]';
  const text = nightMode ? 'text-[#dfe2f3]' : 'text-[#3b3b3b]';

  const privacy = [
    { icon: ServerOff, title: 'Pas de compte, pas de serveur MBT', text: 'MBT ne collecte rien : il n’existe pas de base de données MBT où tes informations seraient envoyées.' },
    { icon: Lock, title: 'Carnet chiffré', text: 'Tes notes et captures sont chiffrées sur ton appareil avec ton code. Sans ce code, personne ne peut les lire, pas même MBT.' },
    { icon: Smartphone, title: 'Contacts sur ton téléphone', text: 'Tes personnes de confiance restent sur ton appareil. Elles ne sont pas chiffrées pour rester utilisables en urgence sans code.' },
    { icon: MapPin, title: 'Position seulement si tu le demandes', text: 'Elle sert à chercher des lieux d’aide (service OpenStreetMap) ou à l’ajouter à un SMS que tu prépares. Elle n’est jamais suivie ni enregistrée.' },
    { icon: Phone, title: 'Appels et SMS par ton téléphone', text: 'MBT ouvre ton composeur ou ton appli SMS : rien n’est envoyé sans ton action, et MBT n’est relié à aucun service d’urgence.' },
    { icon: LogOut, title: 'Sortie rapide', text: 'Un appui ferme l’application et ouvre une page neutre. La conversation de l’assistant est effacée.' },
    { icon: EyeOff, title: 'Mode discret', text: 'Masque l’app derrière une fausse page de révisions et verrouille le carnet. Double appui sur le titre pour revenir.' },
  ];

  return (
    <ScreenShell
      theme="default"
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      topRight={
        <img
          src="/assets/mission-logo.png"
          alt="Mission Better Together"
          className={`h-[22px] w-auto object-contain ${nightMode ? 'brightness-125' : ''}`}
        />
      }
    >
      <div className="px-4 mt-4 flex flex-col gap-5">
        <button
          type="button"
          onClick={onUrgence}
          className={`${cardBg} border-[6px] border-[#FF8989] rounded-[30px] px-5 py-6 text-left cursor-pointer hover:shadow-md active:scale-[0.98] transition`}
        >
          <p className="font-ubuntu font-medium text-[20px] leading-[1.32] tracking-[-0.2px] text-[#FF8989]">
            La rubrique « URGENCE » t’accompagne pas à pas, que tu sois témoin ou victime : qui appeler, prévenir un proche,
            trouver un lieu d’aide.
          </p>
        </button>

        <button
          type="button"
          onClick={onSinformer}
          className={`${cardBg} border-[6px] border-[#7174AA] rounded-[30px] px-5 py-6 text-left cursor-pointer hover:shadow-md active:scale-[0.98] transition`}
        >
          <p className={`font-ubuntu font-medium text-[20px] leading-[1.32] tracking-[-0.2px] ${violet}`}>
            La rubrique « S’INFORMER » propose des fiches sourcées, des conseils selon ton âge et un annuaire de structures
            d’aide vérifiées.
          </p>
        </button>

        <div className={`${cardBg} border-[6px] border-[#7174AA] rounded-[30px] px-5 py-5`}>
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-[#FF5B5B] text-white flex items-center justify-center shrink-0 mbt-phone-fab">
              <Phone className="w-6 h-6" strokeWidth={2.3} />
            </span>
            <p className={`font-ubuntu font-medium text-[18px] leading-[1.3] ${violet}`}>Le bouton SOS appelle le 112.</p>
          </div>
          <p className={`mt-3 text-[14.5px] leading-[1.5] ${text}`}>
            Maintiens-le appuyé une seconde (un anneau se remplit) : cela évite les appels par erreur. Le 112 met en relation
            avec les secours : police, gendarmerie, SAMU, pompiers.
          </p>
        </div>

        <section className="mt-2">
          <h2 className="px-2 font-ubuntu font-bold text-[24px] text-[#7174AA]">Ta vie privée</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {privacy.map((p) => (
              <li key={p.title} className={`${cardBg} rounded-[22px] border-2 ${nightMode ? 'border-white/10' : 'border-black/[0.07]'} px-4 py-3 flex gap-3`}>
                <p.icon className="w-5 h-5 mt-0.5 shrink-0 text-[#7174AA]" />
                <span>
                  <span className={`block font-ubuntu font-medium text-[15px] ${nightMode ? 'text-white' : 'text-[#1d1b20]'}`}>{p.title}</span>
                  <span className={`block mt-0.5 text-[13.5px] leading-[1.45] ${text}`}>{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ScreenShell>
  );
};
