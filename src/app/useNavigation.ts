import { useCallback, useEffect, useRef, useState } from 'react';
import { HOME, Route, pathToRoute, routeToPath } from './routes';

/**
 * Navigation par pile d'écrans, synchronisée avec l'historique du navigateur et l'URL :
 * - le bouton retour (Android, navigateur, geste iOS) revient à l'écran précédent ;
 * - chaque écran a son adresse (liens profonds, rechargement) ;
 * - « Accueil » revient à la toute première entrée pour ne pas laisser d'écrans fantômes.
 */
interface NavState {
  mbtStack: Route[];
  mbtIdx: number;
}

export type NavDirection = 'forward' | 'back' | 'none';

function readNavState(state: unknown): NavState | null {
  if (!state || typeof state !== 'object') return null;
  const s = state as Partial<NavState>;
  if (!Array.isArray(s.mbtStack) || s.mbtStack.length === 0 || typeof s.mbtIdx !== 'number') return null;
  return { mbtStack: s.mbtStack, mbtIdx: s.mbtIdx };
}

function initialNav(): NavState {
  const existing = readNavState(window.history.state);
  if (existing) return existing;

  const home: NavState = { mbtStack: [HOME], mbtIdx: 0 };
  const target = pathToRoute(window.location.pathname, window.location.search);
  if (!target || target.name === 'accueil') {
    window.history.replaceState(home, '', '/');
    return home;
  }
  // Lien profond : on place l'accueil dessous pour que « retour » y mène
  const deep: NavState = { mbtStack: [HOME, target], mbtIdx: 1 };
  window.history.replaceState(home, '', '/');
  window.history.pushState(deep, '', routeToPath(target));
  return deep;
}

export function useNavigation() {
  const [nav, setNav] = useState<NavState>(initialNav);
  const [direction, setDirection] = useState<NavDirection>('none');
  const navRef = useRef(nav);
  navRef.current = nav;

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const next = readNavState(event.state) ?? { mbtStack: [HOME], mbtIdx: 0 };
      setDirection(next.mbtIdx < navRef.current.mbtIdx ? 'back' : 'forward');
      setNav(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const go = useCallback((stack: Route[]) => {
    const next: NavState = { mbtStack: stack, mbtIdx: navRef.current.mbtIdx + 1 };
    window.history.pushState(next, '', routeToPath(stack[stack.length - 1]));
    setDirection('forward');
    setNav(next);
  }, []);

  /** Ouvre un écran par-dessus l'écran courant. */
  const push = useCallback((route: Route) => go([...navRef.current.mbtStack, route]), [go]);

  /** Ouvre une rubrique principale (onglets) : Accueil puis la rubrique. */
  const openSection = useCallback(
    (route: Route) => {
      if (route.name === 'accueil') {
        if (navRef.current.mbtIdx > 0) window.history.go(-navRef.current.mbtIdx);
        return;
      }
      go([HOME, route]);
    },
    [go]
  );

  const pop = useCallback(() => {
    if (navRef.current.mbtIdx > 0) window.history.back();
  }, []);

  const goHome = useCallback(() => {
    if (navRef.current.mbtIdx > 0) window.history.go(-navRef.current.mbtIdx);
  }, []);

  const stack = nav.mbtStack;
  return {
    current: stack[stack.length - 1],
    depth: stack.length,
    canGoBack: nav.mbtIdx > 0,
    direction,
    setDirection,
    push,
    openSection,
    pop,
    goHome,
  };
}
