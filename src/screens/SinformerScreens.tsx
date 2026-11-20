import React from 'react';
import { BookOpenText, Building2, ChevronRight, ExternalLink, NotebookPen, Phone, PlayCircle } from 'lucide-react';
import { useSerenity } from '../context/SerenityContext';
import { ScreenShell } from '../components/ScreenShell';
import { MbtButton } from '../components/MbtButton';
import { AdviceTopic, PROFILES, ProfileId, REPORT_LINKS, THEMES } from '../data/content';
import { getSavedProfile } from '../lib/profile';

interface SinformerScreenProps {
  onBack: () => void;
  onHome: () => void;
  onSelectProfile: (profile: ProfileId) => void;
  onLibrary: () => void;
  onStructures: () => void;
  onTemoignages: () => void;
  /** @deprecated SOS dans la navigation */
  onEmergencyCall?: () => void;
}

export const SinformerScreen: React.FC<SinformerScreenProps> = ({
  onBack,
  onHome,
  onSelectProfile,
  onLibrary,
  onStructures,
  onTemoignages,
}) => {
  const { nightMode } = useSerenity();
  const saved = getSavedProfile();
  const hubCard = nightMode ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-white/95 border-black/[0.08] text-[#1d1b20]';
  const hubItems = [
    { label: 'Comprendre et agir', hint: 'Fiches sourcées : formes, preuves, loi, à qui parler', icon: BookOpenText, color: '#7174AA', onClick: onLibrary },
    { label: 'Structures d’aide', hint: '3018, 119, 3114, Ma Sécurité… coordonnées vérifiées', icon: Building2, color: '#2663FF', onClick: onStructures },
    { label: 'Témoignages', hint: 'Récits illustratifs, lus à voix haute', icon: PlayCircle, color: '#C691C9', onClick: onTemoignages },
  ];
  // Petite étiquette « Toi » sur le profil choisi au premier lancement
  const mine = (id: ProfileId) =>
    saved === id ? (
      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#1d1b20] text-white text-[10px] font-bold tracking-wide z-10">
        TOI
      </span>
    ) : null;
  return (
  <ScreenShell theme="sinformer" showBack onBack={onBack} onBrandClick={onHome}>
    <div className="px-4 mt-4">
      <div className="flex flex-col gap-2.5 mb-8">
        {hubItems.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={it.onClick}
            className={`flex items-center gap-3 rounded-[22px] border-2 px-4 py-3 text-left hover:shadow-md active:scale-[0.99] transition cursor-pointer ${hubCard}`}
          >
            <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${it.color}1f`, color: it.color }}>
              <it.icon className="w-6 h-6" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-ubuntu font-medium text-[16px]">{it.label}</span>
              <span className="block text-[12.5px] opacity-70 leading-snug">{it.hint}</span>
            </span>
            <ChevronRight className="w-5 h-5 opacity-50 shrink-0" />
          </button>
        ))}
      </div>

      <h2 className="font-ubuntu font-bold text-[26px] leading-[1.3] text-[#7174AA] pl-2 mb-6">
        Des conseils pour moi : je suis…
      </h2>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <div className="relative">
          {mine('primaire')}
          <MbtButton color="#00E8AE" size="grid" className="!text-[23px]" onClick={() => onSelectProfile('primaire')}>
            PRIMAIRE
          </MbtButton>
        </div>
        <div className="relative">
          {mine('college')}
          <MbtButton color="#C691C9" size="grid" className="!text-[23px]" onClick={() => onSelectProfile('college')}>
            <span className="leading-[1.15]">
              COLLÈGE
              <br />
              LYCÉE
            </span>
          </MbtButton>
        </div>
        <div className="relative">
          {mine('adulte')}
          <MbtButton color="#3B3B3B" size="grid" className="!text-[23px]" onClick={() => onSelectProfile('adulte')}>
            ADULTE
          </MbtButton>
        </div>
        <div className="relative">
          {mine('parent')}
          <MbtButton color="#8C5734" size="grid" className="!text-[23px]" onClick={() => onSelectProfile('parent')}>
            PARENT
          </MbtButton>
        </div>
      </div>
    </div>
  </ScreenShell>
  );
};

interface ProfileHubScreenProps {
  profileId: ProfileId;
  onBack: () => void;
  onHome: () => void;
  onConseils: () => void;
  onTemoignages: () => void;
  onSpecialistes: () => void;
  onContacts: () => void;
  onEmergencyCall: () => void;
}

export const ProfileHubScreen: React.FC<ProfileHubScreenProps> = ({
  profileId,
  onBack,
  onHome,
  onConseils,
  onTemoignages,
  onSpecialistes,
  onContacts,
  onEmergencyCall,
}) => {
  const profile = PROFILES[profileId];
  const color = THEMES[profileId].accent;

  return (
    <ScreenShell
      theme={profileId}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
    >
      <div className="px-4 mt-8">
        <div className="inline-block mb-12">
          <MbtButton color={color} size="badge" interactive={false}>
            {profile.badge}
          </MbtButton>
        </div>

        {profile.hubLayout === 'primaire-3' ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-5">
              <MbtButton color={color} size="grid" onClick={onConseils}>
                {profile.buttons.conseils}
              </MbtButton>
              <MbtButton color={color} size="grid" onClick={onTemoignages}>
                {profile.buttons.temoignages}
              </MbtButton>
            </div>
            <MbtButton color={color} size="grid" onClick={onContacts}>
              <span className="whitespace-pre-line">{profile.buttons.contacts}</span>
            </MbtButton>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <MbtButton color={color} size="grid" onClick={onConseils}>
              {profile.buttons.conseils}
            </MbtButton>
            <MbtButton color={color} size="grid" onClick={onTemoignages}>
              <span className="whitespace-pre-line">{profile.buttons.temoignages}</span>
            </MbtButton>
            <MbtButton color={color} size="grid" onClick={onSpecialistes}>
              <span className="whitespace-pre-line">{profile.buttons.specialistes}</span>
            </MbtButton>
            <MbtButton color={color} size="grid" onClick={onContacts}>
              {profile.buttons.contacts}
            </MbtButton>
          </div>
        )}
      </div>
    </ScreenShell>
  );
};

interface ConseilsMenuScreenProps {
  profileId: ProfileId;
  onBack: () => void;
  onHome: () => void;
  onSelectTopic: (topic: AdviceTopic) => void;
  onMap: () => void;
  onEmergencyCall: () => void;
}

export const ConseilsMenuScreen: React.FC<ConseilsMenuScreenProps> = ({
  profileId,
  onBack,
  onHome,
  onSelectTopic,
  onMap,
  onEmergencyCall,
}) => {
  const profile = PROFILES[profileId];
  const color = THEMES[profileId].accent;

  return (
    <ScreenShell
      theme={profileId}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={onEmergencyCall}
    >
      <div className="px-4 mt-8">
        <div className="inline-block mb-12">
          <MbtButton color={color} size="badge" interactive={false}>
            {profile.badge}
          </MbtButton>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <MbtButton color={color} size="grid" onClick={() => onSelectTopic('que-dire')}>
            QUE DIRE ?
          </MbtButton>
          <MbtButton color={color} size="grid" onClick={() => onSelectTopic('que-faire')}>
            QUE FAIRE ?
          </MbtButton>
          <MbtButton color={color} size="grid" onClick={() => onSelectTopic('qui-appeler')}>
            QUI APPELER ?
          </MbtButton>
          <MbtButton color={color} size="grid" onClick={onMap}>
            OÙ ALLER ?
          </MbtButton>
        </div>
      </div>
    </ScreenShell>
  );
};

interface ConseilDetailScreenProps {
  profileId: ProfileId;
  topic: AdviceTopic;
  onBack: () => void;
  onHome: () => void;
  onCall: (serviceKey: string) => void;
  onJournal: () => void;
}

export const ConseilDetailScreen: React.FC<ConseilDetailScreenProps> = ({
  profileId,
  topic,
  onBack,
  onHome,
  onCall,
  onJournal,
}) => {
  const palette = THEMES[profileId];
  const content = PROFILES[profileId].advice[topic];

  return (
    <ScreenShell
      theme={profileId}
      showBack
      onBack={onBack}
      onBrandClick={onHome}
      onPhoneFabClick={() => onCall('urgence')}
      scrollable
    >
      <div className="px-4 mt-7">
        {/* Topic Badge (Figma 165x79 rounded pill) */}
        <div className="inline-block mb-8">
          <MbtButton color={palette.accent} size="badge" className="!h-[68px]" interactive={false}>
            {content.title}
          </MbtButton>
        </div>

        {/* Advice Card (Figma Rectangle 1 — themed fill + readable contrast text) */}
        <div
          className="mx-3 rounded-[28px] px-6 py-6 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: palette.cardBg, color: palette.cardText }}
        >
          <div className="flex flex-col gap-3.5 font-ubuntu text-[16px] leading-[1.5]">
            {content.paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line font-normal">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Direct call shortcuts when viewing QUI APPELER ? */}
        {content.quickNumbers && content.quickNumbers.length > 0 && (
          <div className="mx-3 mt-5 flex flex-col gap-2.5">
            {content.quickNumbers.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => onCall(item.number)}
                className="w-full bg-white border-[3px] rounded-[20px] px-4 py-3 flex items-center justify-between font-ubuntu font-medium text-[15px] hover:shadow-md active:scale-[0.98] transition cursor-pointer"
                style={{ borderColor: palette.accent, color: palette.accent }}
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-1.5 text-[13px] font-bold">
                  <Phone className="w-4 h-4" />
                  Appeler
                </span>
              </button>
            ))}
          </div>
        )}

        {/* QUE FAIRE ? → noter les faits dans le journal de preuves */}
        {topic === 'que-faire' && (
          <button
            type="button"
            onClick={onJournal}
            className="mx-3 mt-5 w-[calc(100%-1.5rem)] bg-white border-[3px] rounded-[20px] px-4 py-3 flex items-center gap-3 font-ubuntu font-medium text-[15px] text-left hover:shadow-md active:scale-[0.98] transition cursor-pointer"
            style={{ borderColor: palette.accent, color: palette.accent }}
          >
            <NotebookPen className="w-5 h-5 shrink-0" />
            <span className="flex-1">Noter ce qui s’est passé dans mon journal</span>
          </button>
        )}

        {/* QUI APPELER ? → démarches officielles en ligne (hors primaire) */}
        {topic === 'qui-appeler' && profileId !== 'primaire' && (
          <div className="mx-3 mt-5 flex flex-col gap-2">
            <p className="px-1 text-[12px] font-bold uppercase tracking-wider text-[#8e8e93]">Signaler en ligne</p>
            {REPORT_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border-2 border-black/10 rounded-[18px] px-4 py-3 flex items-start gap-3 hover:shadow-md active:scale-[0.98] transition"
              >
                <ExternalLink className="w-4 h-4 mt-0.5 shrink-0" style={{ color: palette.accent }} />
                <span>
                  <span className="block font-ubuntu font-medium text-[14px] text-[#1d1b20]">{link.label}</span>
                  <span className="block text-[12px] leading-snug text-[#666]">{link.detail}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </ScreenShell>
  );
};
