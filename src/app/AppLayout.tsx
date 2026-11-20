import React from 'react';
import {
  BellRing,
  BookOpen,
  Building2,
  Home,
  LogOut,
  MapPin,
  NotebookPen,
  PlayCircle,
  ShieldAlert,
  Users,
  Wind,
} from 'lucide-react';
import { HoldToCallButton } from '../components/HoldToCallButton';
import { quickExit } from '../components/QuickExitBar';
import { useSerenity } from '../context/SerenityContext';
import { Route, Section, sectionOf } from './routes';

interface NavItem {
  label: string;
  route: Route;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  section?: Section;
  match?: (r: Route) => boolean;
}

/** Onglets mobiles (le bouton SOS occupe le centre). */
const TABS: NavItem[] = [
  { label: 'Accueil', route: { name: 'accueil' }, icon: Home, section: 'accueil' },
  { label: 'S’informer', route: { name: 'sinformer' }, icon: BookOpen, section: 'sinformer' },
  { label: 'Sérénité', route: { name: 'serenite' }, icon: Wind, section: 'serenite' },
  { label: 'Carnet', route: { name: 'carnet' }, icon: NotebookPen, section: 'carnet' },
];

/** Navigation complète (barre latérale sur ordinateur). */
const SIDE_ITEMS: NavItem[] = [
  { label: 'Accueil', route: { name: 'accueil' }, icon: Home, match: (r) => r.name === 'accueil' },
  { label: 'Urgence', route: { name: 'urgence' }, icon: ShieldAlert, match: (r) => r.name.startsWith('urgence') },
  { label: 'Alerter un proche', route: { name: 'alerte' }, icon: BellRing, match: (r) => r.name === 'alerte' },
  { label: 'Contacts', route: { name: 'contacts' }, icon: Users, match: (r) => r.name === 'contacts' },
  { label: 'Lieux d’aide', route: { name: 'lieux' }, icon: MapPin, match: (r) => r.name === 'lieux' },
  {
    label: 'S’informer',
    route: { name: 'sinformer' },
    icon: BookOpen,
    match: (r) => ['sinformer', 'articles', 'article', 'profil', 'conseils', 'conseil', 'entrainement', 'preparer-conversation'].includes(r.name),
  },
  {
    label: 'Structures d’aide',
    route: { name: 'specialistes' },
    icon: Building2,
    match: (r) => r.name === 'specialistes' || r.name === 'specialiste' || r.name === 'assistant',
  },
  { label: 'Récits', route: { name: 'temoignages' }, icon: PlayCircle, match: (r) => r.name.startsWith('temoignage') },
  { label: 'Sérénité', route: { name: 'serenite' }, icon: Wind, match: (r) => r.name === 'serenite' || r.name === 'jardin' },
  { label: 'Carnet', route: { name: 'carnet' }, icon: NotebookPen, match: (r) => r.name === 'carnet' },
];

interface AppLayoutProps {
  current: Route;
  onNavigate: (route: Route) => void;
  onSos: () => void;
  /** Barre d'onglets masquée (appel en cours, premier lancement) */
  hideNav?: boolean;
  children: React.ReactNode;
}

/**
 * Mise en page de l'application :
 * - mobile : barre « Sortie rapide » en haut, écran, barre d'onglets avec SOS au centre ;
 * - ordinateur (≥ 1024 px) : barre latérale de navigation + contenu centré.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ current, onNavigate, onSos, hideNav, children }) => {
  const { nightMode } = useSerenity();
  const section = sectionOf(current);

  return (
    <div
      className={`h-[100dvh] w-full flex overflow-hidden ${
        nightMode ? 'bg-[#0f1220] text-[#eef0fa]' : 'bg-[#f6f6fb] text-[#1d1b20]'
      }`}
    >
      {/* ---------- Barre latérale (ordinateur) ---------- */}
      {!hideNav && (
        <aside
          className={`hidden lg:flex w-[268px] shrink-0 flex-col border-r px-4 pt-6 pb-5 overflow-y-auto no-scrollbar ${
            nightMode ? 'bg-[#141727] border-white/10' : 'bg-white border-black/[0.07]'
          }`}
>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'accueil' })}
            className="px-2 text-left cursor-pointer"
          >
            <span className="font-ubuntu font-medium text-[40px] leading-none tracking-[-0.4px] text-[#FFDE53]">
              MBT
            </span>
            <span className={`block mt-1 text-[12px] ${nightMode ? 'text-white/55' : 'text-[#8e8e93]'}`}>
              Mission Better Together
            </span>
          </button>

          <nav className="mt-6 flex flex-col gap-0.5" aria-label="Navigation principale">
            {SIDE_ITEMS.map((item) => {
              const active = item.match?.(current) ?? false;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14.5px] font-ubuntu font-medium text-left transition cursor-pointer ${
                    active
                      ? nightMode
                        ? 'bg-white text-[#141724]'
                        : 'bg-[#1d1b20] text-white'
                      : nightMode
                        ? 'text-[#cfd3e8] hover:bg-white/8'
                        : 'text-[#3b3b3b] hover:bg-black/[0.04]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={2.1} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 flex flex-col items-center gap-3">
            <div className="pt-6">
              <HoldToCallButton variant="nav" onConfirm={onSos} label="Appeler le 112" />
            </div>
            <p className={`text-[12px] text-center leading-snug ${nightMode ? 'text-white/55' : 'text-[#8e8e93]'}`}>
              Maintenir pour appeler le <strong>112</strong>
            </p>
            <button
              type="button"
              onClick={quickExit}
              className="mt-2 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-[#1d1b20] text-white text-[12px] font-semibold cursor-pointer hover:bg-black"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sortie rapide
            </button>
          </div>
        </aside>
      )}

      {/* ---------- Contenu ---------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sortie rapide (mobile ; sur ordinateur elle est dans la barre latérale) */}
        <div
          className={`${hideNav ? 'flex' : 'flex lg:hidden'} shrink-0 items-center justify-end px-3 ${
            nightMode ? 'bg-[#141724]' : 'bg-[#fdfdff]'
          }`}
          style={{ paddingTop: 'max(6px, env(safe-area-inset-top))', paddingBottom: 4 }}
        >
          <button
            type="button"
            onClick={quickExit}
            title="Quitter immédiatement vers un site neutre"
            className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[#1d1b20] text-white text-[11px] font-semibold tracking-wide hover:bg-black active:scale-95 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8989]"
          >
            <LogOut className="w-3 h-3" strokeWidth={2.5} />
            Sortie rapide
          </button>
        </div>

        <main className="relative flex-1 min-h-0 w-full lg:max-w-[720px] lg:mx-auto lg:border-x lg:border-black/[0.06]">
          {children}
        </main>

        {/* Barre d'onglets (mobile) */}
        {!hideNav && (
          <nav
            className={`lg:hidden relative shrink-0 border-t ${
              nightMode ? 'bg-[#141727] border-white/10' : 'bg-white border-black/[0.08]'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            aria-label="Navigation principale"
          >
            <div className="grid grid-cols-5 items-end h-[64px]">
              {[TABS[0], TABS[1], null, TABS[2], TABS[3]].map((item) => {
                if (!item) {
                  return (
                    <div key="sos" className="flex flex-col items-center -translate-y-4">
                      <HoldToCallButton variant="nav" onConfirm={onSos} label="Appeler le 112" />
                      <span className="mt-1 text-[10px] font-bold tracking-wide text-[#FF5B5B]">SOS 112</span>
                    </div>
                  );
                }
                const active = section === item.section;
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.route)}
                    aria-current={active ? 'page' : undefined}
                    className={`h-full flex flex-col items-center justify-center gap-1 text-[10.5px] font-ubuntu font-medium transition cursor-pointer ${
                      active
                        ? nightMode
                          ? 'text-[#FFDE53]'
                          : 'text-[#1d1b20]'
                        : nightMode
                          ? 'text-white/50'
                          : 'text-[#9a9aa3]'
                    }`}
                  >
                    <span
                      className={`w-12 h-7 rounded-full flex items-center justify-center transition ${
                        active ? (nightMode ? 'bg-white/10' : 'bg-[#FFDE53]/45') : ''
                      }`}
                    >
                      <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 2} />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};
