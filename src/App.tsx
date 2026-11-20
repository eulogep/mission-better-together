import React, { Suspense, lazy, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ContactItem, EMERGENCY_SERVICES, TestimonyTheme, findServiceKey } from './data/content';
import { SerenityProvider, useSerenity } from './context/SerenityContext';
import { DiscreetCamouflage } from './components/DiscreetCamouflage';
import { ToastViewport } from './components/ToastViewport';
import { AppLayout } from './app/AppLayout';
import { Route } from './app/routes';
import { useNavigation } from './app/useNavigation';
import { isOnboarded } from './lib/profile';
import { dial, isTouchDevice, vibrate } from './lib/device';
import { usePreferences } from './lib/preferences';
import { MoodReport, loadSessionMood, saveSessionMood } from './lib/mood';
import { lockCarnet } from './features/carnet/session';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AccueilScreen } from './screens/AccueilScreen';
import { DetailsScreen } from './screens/DetailsScreen';
import { AlertScreen } from './screens/AlertScreen';
import { SecoursCallScreen, TemoinQuestionScreen, UrgenceRoleScreen, VictimeActionsScreen } from './screens/UrgenceScreens';
import { ConseilDetailScreen, ConseilsMenuScreen, ProfileHubScreen, SinformerScreen } from './screens/SinformerScreens';
import { ContactsScreen } from './screens/ContactsScreen';
import { CallScreen } from './screens/CallScreen';

/*
 * Les écrans d'urgence (accueil, urgence, alerte, contacts, appel) sont chargés immédiatement.
 * Les autres sont chargés à la demande (premier affichage plus rapide) ; le service worker
 * les met tous en cache pour le mode hors ligne.
 */
const SafePlacesScreen = lazy(() => import('./screens/SafePlacesScreen').then((m) => ({ default: m.SafePlacesScreen })));
const SanctuaryScreen = lazy(() => import('./screens/SanctuaryScreen').then((m) => ({ default: m.SanctuaryScreen })));
const CarnetScreen = lazy(() => import('./features/carnet/CarnetScreen').then((m) => ({ default: m.CarnetScreen })));
const ChatPsyScreen = lazy(() => import('./screens/ChatPsyScreen').then((m) => ({ default: m.ChatPsyScreen })));
const LibraryScreen = lazy(() => import('./features/info/LibraryScreens').then((m) => ({ default: m.LibraryScreen })));
const ArticleScreen = lazy(() => import('./features/info/LibraryScreens').then((m) => ({ default: m.ArticleScreen })));
const StructuresScreen = lazy(() => import('./features/specialistes/StructuresScreens').then((m) => ({ default: m.StructuresScreen })));
const StructureScreen = lazy(() => import('./features/specialistes/StructuresScreens').then((m) => ({ default: m.StructureScreen })));
const TemoignageGridScreen = lazy(() => import('./screens/TemoignagesScreen').then((m) => ({ default: m.TemoignageGridScreen })));
const TestimonyPlayerScreen = lazy(() => import('./screens/TemoignagesScreen').then((m) => ({ default: m.TestimonyPlayerScreen })));
const PracticeScreen = lazy(() => import('./features/practice/PracticeScreen').then((m) => ({ default: m.PracticeScreen })));
const ConversationScreen = lazy(() => import('./features/conversation/ConversationScreen').then((m) => ({ default: m.ConversationScreen })));
const GardenScreen = lazy(() => import('./features/garden/GardenScreen').then((m) => ({ default: m.GardenScreen })));

const AppContent: React.FC = () => {
  const { discreetMode, exitDiscreetMode } = useSerenity();
  const nav = useNavigation();
  const { current, push, replace, pop, goHome, openSection } = nav;
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded() && current.name === 'accueil');
  const [testimonyTheme, setTestimonyTheme] = useState<TestimonyTheme | null>(null);
  const [mood, setMood] = useState<MoodReport | null>(loadSessionMood);

  // Mode discret : l'écran de camouflage remplace tout et le carnet se verrouille
  useEffect(() => {
    if (discreetMode) {
      lockCarnet();
      saveSessionMood(null);
      setMood(null);
    }
  }, [discreetMode]);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) setMood(loadSessionMood());
    };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  const chooseMood = (next: MoodReport | null) => {
    saveSessionMood(next);
    setMood(next);
  };

  /**
   * Appel réel : sur téléphone, le composeur s'ouvre (le système demande confirmation).
   * L'écran d'appel sert de relais : rappeler, écrire plutôt qu'appeler, informations.
   */
  const callService = (serviceKey: string, customName?: string, customPhone?: string) => {
    const svc = EMERGENCY_SERVICES[serviceKey];
    const number = svc ? svc.dialNumber : customPhone;
    if (number && !svc?.smsOnly && isTouchDevice()) {
      vibrate(40);
      dial(number);
    }
    push({ name: 'appel', serviceKey: svc ? serviceKey : 'custom', customName, customPhone });
  };

  const callContact = (contact: ContactItem) => {
    const label = contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName;
    const key = findServiceKey(contact.phone);
    if (key) callService(key);
    else callService('custom', label, contact.phone);
  };

  const go = (route: Route) => (route.name === 'accueil' ? goHome() : push(route));

  if (discreetMode) {
    return (
      <div className="h-[100dvh] w-full">
        <DiscreetCamouflage onExit={exitDiscreetMode} />
      </div>
    );
  }

  const renderScreen = (): React.ReactNode => {
    switch (current.name) {
      case 'accueil':
        return <AccueilScreen onNavigate={go} onCall={callService} mood={mood} onMood={(value) => chooseMood({ kind: 'quick', mood: value })} />;

      case 'a-propos':
        return (
          <DetailsScreen
            onBack={pop}
            onHome={goHome}
            onUrgence={() => push({ name: 'urgence' })}
            onSinformer={() => push({ name: 'sinformer' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'urgence':
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
            onMap={() => push({ name: 'lieux' })}
            onAlert={() => push({ name: 'alerte' })}
            onJournal={() => push({ name: 'carnet' })}
            onBreathe={() => push({ name: 'serenite' })}
            onWhoToCall={() => push({ name: 'article', id: 'a-qui-s-adresser' })}
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
              if (current.step === 'blessee') push({ name: 'urgence-temoin', step: 'harceleurs' });
              else if (current.step === 'harceleurs') push({ name: 'urgence-temoin', step: 'danger' });
              else push({ name: 'article', id: 'je-suis-temoin' });
            }}
          />
        );

      case 'urgence-secours':
        return <SecoursCallScreen reason={current.reason} onBack={pop} onHome={goHome} onCall={callService} />;

      case 'alerte':
        return (
          <AlertScreen
            onBack={pop}
            onHome={goHome}
            onContacts={() => push({ name: 'contacts' })}
            onCall={callService}
            onCallContact={callContact}
          />
        );

      case 'sinformer':
        return (
          <SinformerScreen
            onBack={pop}
            onHome={goHome}
            onSelectProfile={(profileId) => push({ name: 'profil', profileId })}
            onLibrary={() => push({ name: 'articles' })}
            onStructures={() => push({ name: 'specialistes' })}
            onTemoignages={() => push({ name: 'temoignages' })}
            onPractice={() => push({ name: 'entrainement' })}
            onPrepareConversation={() => push({ name: 'preparer-conversation' })}
          />
        );

      case 'articles':
        return (
          <LibraryScreen
            initialCategory={current.category}
            onBack={pop}
            onHome={goHome}
            onOpen={(id) => push({ name: 'article', id })}
          />
        );

      case 'article':
        return <ArticleScreen key={current.id} id={current.id} onBack={pop} onHome={goHome} onOpen={(id) => push({ name: 'article', id })} />;

      case 'profil':
        return (
          <ProfileHubScreen
            profileId={current.profileId}
            onBack={pop}
            onHome={goHome}
            onConseils={() => push({ name: 'conseils', profileId: current.profileId })}
            onTemoignages={() => push({ name: 'temoignages' })}
            onSpecialistes={() => push({ name: 'specialistes' })}
            onContacts={() => push({ name: 'contacts' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'conseils':
        return (
          <ConseilsMenuScreen
            profileId={current.profileId}
            onBack={pop}
            onHome={goHome}
            onSelectTopic={(topic) => push({ name: 'conseil', profileId: current.profileId, topic })}
            onMap={() => push({ name: 'lieux', theme: current.profileId })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'conseil':
        return (
          <ConseilDetailScreen
            profileId={current.profileId}
            topic={current.topic}
            onBack={pop}
            onHome={goHome}
            onCall={callService}
            onJournal={() => push({ name: 'carnet' })}
          />
        );

      case 'lieux':
        return <SafePlacesScreen theme={current.theme} onBack={pop} onHome={goHome} onCall={callService} />;

      case 'temoignages':
        return (
          <TemoignageGridScreen
            themeFilter={testimonyTheme}
            onFilter={setTestimonyTheme}
            onBack={pop}
            onHome={goHome}
            onSelect={(index) => push({ name: 'temoignage', index })}
            onPractice={() => push({ name: 'entrainement' })}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'temoignage':
        return (
          <TestimonyPlayerScreen
            selectedIndex={current.index}
            themeFilter={testimonyTheme}
            onSelect={(index) => replace({ name: 'temoignage', index })}
            onOpenArticle={(id) => push({ name: 'article', id })}
            onOpenPractice={(scenarioId) => push({ name: 'entrainement', scenarioId })}
            onBack={pop}
            onHome={goHome}
            onEmergencyCall={() => callService('urgence')}
          />
        );

      case 'entrainement':
        return (
          <PracticeScreen
            key={current.scenarioId ?? 'list'}
            scenarioId={current.scenarioId}
            onOpenScenario={(scenarioId) => push({ name: 'entrainement', scenarioId })}
            onOpenArticle={(id) => push({ name: 'article', id })}
            onPrepareConversation={() => push({ name: 'preparer-conversation' })}
            onBack={pop}
            onHome={goHome}
          />
        );

      case 'preparer-conversation':
        return <ConversationScreen onBack={pop} />;

      case 'contacts':
        return <ContactsScreen onBack={pop} onCallContact={callContact} onAlert={() => push({ name: 'alerte' })} />;

      case 'specialistes':
        return (
          <StructuresScreen
            onBack={pop}
            onHome={goHome}
            onOpen={(id) => push({ name: 'specialiste', id })}
            onAssistant={() => push({ name: 'assistant' })}
          />
        );

      case 'specialiste':
        return <StructureScreen id={current.id} onBack={pop} onHome={goHome} onCall={callService} />;

      case 'assistant':
        return <ChatPsyScreen onBack={pop} onCallService={callService} onOpenSanctuary={() => push({ name: 'serenite' })} />;

      case 'serenite':
        return <SanctuaryScreen onBack={pop} onHome={goHome} onOpenGarden={() => push({ name: 'jardin' })} />;

      case 'jardin':
        return (
          <GardenScreen
            mood={mood}
            onMood={chooseMood}
            onBack={pop}
            onPrepareConversation={() => push({ name: 'preparer-conversation' })}
            onFindHelp={() => push({ name: 'specialistes' })}
          />
        );

      case 'carnet':
        return <CarnetScreen onBack={pop} onHome={goHome} />;

      case 'appel':
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

  if (showOnboarding) {
    return (
      <AppLayout current={current} onNavigate={openSection} onSos={() => callService('urgence')} hideNav>
        <OnboardingScreen
          onFinish={(next) => {
            setShowOnboarding(false);
            if (next === 'contacts') push({ name: 'contacts' });
            if (next === 'urgence') push({ name: 'urgence' });
          }}
        />
        <ToastViewport />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      current={current}
      onNavigate={openSection}
      onSos={() => callService('urgence')}
      hideNav={current.name === 'appel'}
    >
      <div key={`${nav.depth}-${current.name}`} className={`mbt-screen mbt-enter-${nav.direction} absolute inset-0`}>
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#7174AA]" />
            </div>
          }
        >
          {renderScreen()}
        </Suspense>
      </div>
      <ToastViewport />
    </AppLayout>
  );
};

export const App: React.FC = () => {
  const prefs = usePreferences();
  return (
    // « Sans animation » (préférence MBT) ou réglage système → animations décoratives désactivées
    <MotionConfig reducedMotion={prefs.reduceMotion ? 'always' : 'user'}>
      <SerenityProvider>
        <AppContent />
      </SerenityProvider>
    </MotionConfig>
  );
};

export default App;
