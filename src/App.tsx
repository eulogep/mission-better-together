import React, { useState } from 'react';
import {
  BellRing,
  BookHeart,
  BookOpen,
  EyeOff,
  HeartHandshake,
  Home,
  MapPin,
  Maximize2,
  MessageCircle,
  Moon,
  PhoneCall,
  PlayCircle,
  ShieldAlert,
  Smartphone,
  Sun,
  Users,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { AdviceTopic, ContactItem, EMERGENCY_SERVICES, findServiceKey, ProfileId, ThemeKey } from './data/content';
import { SerenityProvider, useSerenity } from './context/SerenityContext';
import { DiscreetCamouflage } from './components/DiscreetCamouflage';
import { ToastViewport } from './components/ToastViewport';
import { isOnboarded } from './lib/profile';
import { dial, isTouchDevice } from './lib/device';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AccueilScreen } from './screens/AccueilScreen';
import { DetailsScreen } from './screens/DetailsScreen';
import { AlertScreen } from './screens/AlertScreen';
import {
  SecoursCallScreen,
  TemoinQuestionScreen,
  UrgenceRoleScreen,
  VictimeActionsScreen,
} from './screens/UrgenceScreens';
import {
  ConseilDetailScreen,
  ConseilsMenuScreen,
  ProfileHubScreen,
  SinformerScreen,
} from './screens/SinformerScreens';
import { SafePlacesScreen } from './screens/SafePlacesScreen';
import { TemoignageGridScreen, TestimonyPlayerScreen } from './screens/TemoignagesScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { ChatPsyScreen } from './screens/ChatPsyScreen';
import { CallScreen } from './screens/CallScreen';
import { SanctuaryScreen } from './screens/SanctuaryScreen';
import { JournalScreen } from './screens/JournalScreen';

type Route =
  | { name: 'onboarding' }
  | { name: 'accueil' }
  | { name: 'details' }
  | { name: 'alert' }
  | { name: 'urgence-role' }
  | { name: 'urgence-victime' }
  | { name: 'urgence-temoin'; step: 'blessee' | 'harceleurs' | 'danger' }
  | { name: 'urgence-secours'; reason: 'blessee' | 'harceleurs' | 'danger' }
  | { name: 'sinformer' }
  | { name: 'profile-hub'; profileId: ProfileId }
  | { name: 'conseils-menu'; profileId: ProfileId }
  | { name: 'conseil-detail'; profileId: ProfileId; topic: AdviceTopic }
  | { name: 'safe-places'; theme: ThemeKey }
  | { name: 'temoignages-grid' }
  | { name: 'temoignage-player'; index: number }
  | { name: 'contacts' }
  | { name: 'chat-psy' }
  | { name: 'sanctuary' }
  | { name: 'journal' }
  | { name: 'call'; serviceKey: string; customName?: string; customPhone?: string };

const AppContent: React.FC = () => {
  const {
    nightMode,
    toggleNightMode,
    discreetMode,
    enterDiscreetMode,
    exitDiscreetMode,
    isSoundActive,
    toggleQuickAmbient,
  } = useSerenity();

  const [stack, setStack] = useState<Route[]>(() =>
    isOnboarded() ? [{ name: 'accueil' }] : [{ name: 'onboarding' }]
  );
  const [phoneFrameMode, setPhoneFrameMode] = useState(true);

  const current = stack[stack.length - 1];

  const push = (route: Route) => setStack((prev) => [...prev, route]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goHome = () => setStack([{ name: 'accueil' }]);

  const callService = (serviceKey: string, customName?: string, customPhone?: string) => {
    const svc = EMERGENCY_SERVICES[serviceKey];
    const num = svc ? svc.dialNumber : customPhone || serviceKey;
    if (isTouchDevice() && num && !svc?.smsOnly) {
      dial(num);
    }
    push({ name: 'call', serviceKey, customName, customPhone });
  };

  const callContact = (contact: ContactItem) => {
    const label = contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName;
    const svcKey = findServiceKey(contact.phone);
    if (svcKey) {
      callService(svcKey);
    } else {
      callService('custom', label, contact.phone);
    }
  };

  const renderScreen = () => {
    if (discreetMode) {
      return <DiscreetCamouflage onExit={exitDiscreetMode} />;
    }

    switch (current.name) {
      case 'onboarding':
        return (
          <OnboardingScreen
            onFinish={(next) => {
              if (next === 'contacts') {
                setStack([{ name: 'accueil' }, { name: 'contacts' }]);
              } else if (next === 'urgence') {
                setStack([{ name: 'accueil' }, { name: 'urgence-role' }]);
              } else {
                setStack([{ name: 'accueil' }]);
              }
            }}
          />
        );

      case 'accueil':
        return (
          <AccueilScreen
            onUrgence={() => push({ name: 'urgence-role' })}
            onSinformer={() => push({ name: 'sinformer' })}
            onDetails={() => push({ name: 'details' })}
            onContacts={() => push({ name: 'contacts' })}
            onSpecialistes={() => push({ name: 'chat-psy' })}
            onSanctuary={() => push({ name: 'sanctuary' })}
            onJournal={() => push({ name: 'journal' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'details':
        return (
          <DetailsScreen
            onBack={pop}
            onHome={goHome}
            onUrgence={() => push({ name: 'urgence-role' })}
            onSinformer={() => push({ name: 'sinformer' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'alert':
        return (
          <AlertScreen
            onBack={pop}
            onHome={goHome}
            onContacts={() => push({ name: 'contacts' })}
            onCall={callService}
            onCallContact={callContact}
          />
        );

      case 'urgence-role':
        return (
          <UrgenceRoleScreen
            onBack={pop}
            onHome={goHome}
            onTemoin={() => push({ name: 'urgence-temoin', step: 'blessee' })}
            onVictime={() => push({ name: 'urgence-victime' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'urgence-victime':
        return (
          <VictimeActionsScreen
            onBack={pop}
            onHome={goHome}
            onMap={() => push({ name: 'safe-places', theme: 'default' })}
            onCall={callService}
          />
        );

      case 'urgence-temoin':
        return (
          <TemoinQuestionScreen
            step={current.step}
            onBack={pop}
            onHome={goHome}
            onEmergencyCall={() => callService('urgence')}
            onYes={() => push({ name: 'urgence-secours', reason: current.step })}
            onNo={() => {
              if (current.step === 'blessee') {
                push({ name: 'urgence-temoin', step: 'harceleurs' });
              } else if (current.step === 'harceleurs') {
                push({ name: 'urgence-temoin', step: 'danger' });
              } else {
                push({ name: 'sinformer' });
              }
            }}
          />
        );

      case 'urgence-secours':
        return (
          <SecoursCallScreen
            reason={current.reason}
            onBack={pop}
            onHome={goHome}
            onCall={callService}
          />
        );

      case 'sinformer':
        return (
          <SinformerScreen
            onBack={pop}
            onHome={goHome}
            onSelectProfile={(profileId) => push({ name: 'profile-hub', profileId })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'profile-hub':
        return (
          <ProfileHubScreen
            profileId={current.profileId}
            onBack={pop}
            onHome={goHome}
            onConseils={() => push({ name: 'conseils-menu', profileId: current.profileId })}
            onTemoignages={() => push({ name: 'temoignages-grid' })}
            onSpecialistes={() => push({ name: 'chat-psy' })}
            onContacts={() => push({ name: 'contacts' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'conseils-menu':
        return (
          <ConseilsMenuScreen
            profileId={current.profileId}
            onBack={pop}
            onHome={goHome}
            onSelectTopic={(topic) =>
              push({ name: 'conseil-detail', profileId: current.profileId, topic })
            }
            onMap={() => push({ name: 'safe-places', theme: current.profileId })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'conseil-detail':
        return (
          <ConseilDetailScreen
            profileId={current.profileId}
            topic={current.topic}
            onBack={pop}
            onHome={goHome}
            onCall={callService}
            onJournal={() => push({ name: 'journal' })}
          />
        );

      case 'safe-places':
        return (
          <SafePlacesScreen
            theme={current.theme}
            onBack={pop}
            onHome={goHome}
            onCall={callService}
          />
        );

      case 'temoignages-grid':
        return (
          <TemoignageGridScreen
            onBack={pop}
            onHome={goHome}
            onSelect={(index) => push({ name: 'temoignage-player', index })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'temoignage-player':
        return (
          <TestimonyPlayerScreen
            initialIndex={current.index}
            onBack={pop}
            onHome={goHome}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'contacts':
        return (
          <ContactsScreen
            onBack={pop}
            onCallContact={callContact}
            onAlert={() => push({ name: 'alert' })}
          />
        );

      case 'chat-psy':
        return (
          <ChatPsyScreen
            onBack={pop}
            onCallService={callService}
            onOpenSanctuary={() => push({ name: 'sanctuary' })}
          />
        );

      case 'sanctuary':
        return (
          <SanctuaryScreen
            onBack={pop}
            onHome={goHome}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'journal':
        return (
          <JournalScreen
            onBack={pop}
            onHome={goHome}
            onOpenSanctuary={() => push({ name: 'sanctuary' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'call':
        return (
          <CallScreen
            serviceKey={current.serviceKey}
            customName={current.customName}
            customPhone={current.customPhone}
            onBack={pop}
          />
        );
    }
  };

  const quickNavItems: { label: string; icon: React.ReactNode; route: Route; active: boolean }[] = [
    {
      label: 'Accueil',
      icon: <Home className="w-4 h-4" />,
      route: { name: 'accueil' },
      active: current.name === 'accueil',
    },
    {
      label: 'Sérénité',
      icon: <Wind className="w-4 h-4 text-[#00c492]" />,
      route: { name: 'sanctuary' },
      active: current.name === 'sanctuary',
    },
    {
      label: 'Carnet',
      icon: <BookHeart className="w-4 h-4 text-[#C691C9]" />,
      route: { name: 'journal' },
      active: current.name === 'journal',
    },
    {
      label: 'Alerter SMS',
      icon: <BellRing className="w-4 h-4 text-[#FF8989]" />,
      route: { name: 'alert' },
      active: current.name === 'alert',
    },
    {
      label: 'Urgence',
      icon: <ShieldAlert className="w-4 h-4 text-[#FF8989]" />,
      route: { name: 'urgence-role' },
      active: current.name.startsWith('urgence'),
    },
    {
      label: "S'informer",
      icon: <BookOpen className="w-4 h-4 text-[#7174AA]" />,
      route: { name: 'sinformer' },
      active:
        current.name === 'sinformer' ||
        current.name === 'profile-hub' ||
        current.name.startsWith('conseil'),
    },
    {
      label: 'Lieux sûrs',
      icon: <MapPin className="w-4 h-4 text-[#00c492]" />,
      route: { name: 'safe-places', theme: 'primaire' },
      active: current.name === 'safe-places',
    },
    {
      label: 'Témoignages',
      icon: <PlayCircle className="w-4 h-4 text-[#C691C9]" />,
      route: { name: 'temoignages-grid' },
      active: current.name.startsWith('temoignage'),
    },
    {
      label: 'Contacts',
      icon: <Users className="w-4 h-4 text-[#007AFF]" />,
      route: { name: 'contacts' },
      active: current.name === 'contacts',
    },
    {
      label: 'Spécialiste',
      icon: <MessageCircle className="w-4 h-4 text-[#2663FF]" />,
      route: { name: 'chat-psy' },
      active: current.name === 'chat-psy',
    },
    {
      label: 'Appel 3018',
      icon: <PhoneCall className="w-4 h-4 text-[#FF3B30]" />,
      route: { name: 'call', serviceKey: '3018' },
      active: current.name === 'call',
    },
  ];

  if (!phoneFrameMode) {
    return (
      <div
        className={`relative w-screen h-[100dvh] overflow-hidden ${
          nightMode ? 'bg-[#0e101a]' : 'bg-white'
        }`}
      >
        <div className="w-full max-w-[430px] h-full mx-auto relative shadow-xl overflow-hidden">
          {renderScreen()}
          <ToastViewport />
        </div>
        <button
          type="button"
          onClick={() => setPhoneFrameMode(true)}
          title="Revenir en mode aperçu téléphone"
          className="hidden sm:flex fixed top-4 right-4 z-50 items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 border border-black/10 shadow-md text-[12px] font-medium text-[#3b3b3b] hover:bg-white cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Cadre mobile
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[100dvh] w-full flex items-center justify-center sm:p-6 transition-colors duration-700 ${
        nightMode
          ? 'sm:bg-gradient-to-br sm:from-[#0e1120] sm:via-[#161a2e] sm:to-[#1d192b]'
          : 'sm:bg-gradient-to-br sm:from-[#edf4f8] sm:via-[#f6f4fb] sm:to-[#fff8ea]'
      }`}
    >
      <div className="w-full sm:w-auto flex flex-col lg:flex-row items-center gap-8">
        {/* Desktop Serenity Companion Sidebar */}
        <aside
          className={`hidden lg:flex flex-col w-[305px] backdrop-blur-md border rounded-[28px] p-6 transition-colors duration-500 ${
            nightMode
              ? 'bg-[#1a1e30]/85 border-white/10 text-[#eef0fa] shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
              : 'bg-white/85 border-black/8 text-[#1d1b20] shadow-[0_20px_50px_rgba(30,35,60,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between mb-3.5">
            <img
              src="/assets/mission-logo.png"
              alt="Mission Better Together"
              className={`h-7 w-auto object-contain ${nightMode ? 'brightness-125' : ''}`}
            />
            <button
              type="button"
              onClick={() => setPhoneFrameMode(false)}
              title="Plein écran"
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                nightMode
                  ? 'bg-white/10 text-white/80 hover:bg-white/15'
                  : 'bg-black/5 text-[#555] hover:bg-black/10'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <p
            className={`text-[12.5px] leading-relaxed mb-4 ${
              nightMode ? 'text-[#adb3cc]' : 'text-[#555]'
            }`}
          >
            Un refuge bienveillant contre le harcèlement : apaisement sensoriel, respiration guidée,
            carnet protégé, carte OpenStreetMap de lieux sûrs et écoute d’urgence.
          </p>

          {/* Instant Serenity Controls */}
          <div className="grid grid-cols-3 gap-1.5 mb-5">
            <button
              type="button"
              onClick={toggleQuickAmbient}
              className={`py-2 px-2 rounded-xl text-[11px] font-medium flex flex-col items-center gap-1 border transition cursor-pointer ${
                isSoundActive
                  ? 'bg-[#00e8ae]/18 border-[#00c492]/50 text-[#00a87e]'
                  : nightMode
                  ? 'bg-white/6 border-white/10 text-[#c2c7df] hover:bg-white/10'
                  : 'bg-[#f4f5f9] border-transparent text-[#444] hover:bg-[#eaecf4]'
              }`}
            >
              {isSoundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>Pluie 432Hz</span>
            </button>

            <button
              type="button"
              onClick={toggleNightMode}
              className={`py-2 px-2 rounded-xl text-[11px] font-medium flex flex-col items-center gap-1 border transition cursor-pointer ${
                nightMode
                  ? 'bg-[#ffde53]/18 border-[#ffde53]/40 text-[#ffde53]'
                  : 'bg-[#f4f5f9] border-transparent text-[#444] hover:bg-[#eaecf4]'
              }`}
            >
              {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{nightMode ? 'Jour doux' : 'Nuit'}</span>
            </button>

            <button
              type="button"
              onClick={discreetMode ? exitDiscreetMode : enterDiscreetMode}
              className={`py-2 px-2 rounded-xl text-[11px] font-medium flex flex-col items-center gap-1 border transition cursor-pointer ${
                discreetMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-600'
                  : nightMode
                  ? 'bg-white/6 border-white/10 text-[#c2c7df] hover:bg-white/10'
                  : 'bg-[#f4f5f9] border-transparent text-[#444] hover:bg-[#eaecf4]'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span>Discret</span>
            </button>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8e8e93] mb-2">
            Explorer les écrans
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {quickNavItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (discreetMode) exitDiscreetMode();
                  setStack([
                    { name: 'accueil' },
                    ...(item.route.name === 'accueil' ? [] : [item.route]),
                  ]);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12px] font-medium transition cursor-pointer text-left ${
                  item.active && !discreetMode
                    ? nightMode
                      ? 'bg-white text-[#141724] shadow-sm'
                      : 'bg-[#1d1b20] text-white shadow-sm'
                    : nightMode
                    ? 'bg-white/6 text-[#d2d6eb] hover:bg-white/12'
                    : 'bg-[#f4f5f8] text-[#333] hover:bg-[#e8ebf2]'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

          <div
            className={`mt-4 pt-3.5 border-t flex flex-col gap-1.5 text-[11.5px] ${
              nightMode ? 'border-white/10 text-[#9aa0bc]' : 'border-black/8 text-[#666]'
            }`}
          >
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#7174AA] shrink-0" />
              <span>3018 · 3020 · 3114 · 17 (gratuits)</span>
            </div>
            <span className="text-[10.5px] opacity-75">
              Astuce sécurité : appuyez 2× sur{' '}
              <kbd className="px-1 py-0.5 rounded bg-black/10">Échap</kbd> pour le Mode Discret.
            </span>
          </div>
        </aside>

        {/* Mobile Device Frame */}
        <main className="relative w-full h-[100dvh] sm:w-[390px] sm:h-[844px] sm:max-h-[94dvh] bg-white sm:rounded-[48px] sm:border-[10px] sm:border-[#1c1c1e] sm:shadow-[0_32px_90px_rgba(20,24,45,0.24)] overflow-hidden">
          {renderScreen()}
          <ToastViewport />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <SerenityProvider>
    <AppContent />
  </SerenityProvider>
);

export default App;
