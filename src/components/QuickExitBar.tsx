import React from 'react';
import { LogOut } from 'lucide-react';

/** Site neutre vers lequel on bascule en cas de sortie rapide. */
const SAFE_EXIT_URL = 'https://www.google.com/search?q=m%C3%A9t%C3%A9o';

/**
 * Quitte immédiatement l'application vers un site neutre.
 * Efface les données de session (conversation en cours) et remplace l'entrée
 * d'historique courante pour qu'un simple « retour » ne réaffiche pas l'app.
 */
export function quickExit() {
  try {
    sessionStorage.clear();
  } catch {
    // stockage indisponible : on quitte quand même
  }
  window.location.replace(SAFE_EXIT_URL);
}

/**
 * Bandeau fin présent en haut de chaque écran : un seul appui suffit pour
 * quitter l'application si quelqu'un regarde par-dessus l'épaule.
 */
export const QuickExitBar: React.FC = () => (
  <div className="relative z-50 h-8 shrink-0 flex items-center justify-end px-3 bg-white">
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
);
