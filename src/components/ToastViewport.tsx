import React from 'react';
import { Check, Heart, Info } from 'lucide-react';
import { dismissToast, useToasts } from '../lib/toast';

const TONES = {
  success: { icon: Check, bg: '#1d1b20', accent: '#00E8AE' },
  info: { icon: Info, bg: '#1d1b20', accent: '#FFDE53' },
  warm: { icon: Heart, bg: '#1d1b20', accent: '#FF8989' },
} as const;

/** Zone d'affichage des toasts, au-dessus du bouton d'appel, dans le cadre du téléphone. */
export const ToastViewport: React.FC = () => {
  const toasts = useToasts();
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-10 z-[60] flex flex-col items-center gap-2 px-6"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => {
        const { icon: Icon, bg, accent } = TONES[t.tone];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto mbt-toast-in max-w-full flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full text-white text-[13px] font-medium leading-snug shadow-[0_12px_30px_rgba(0,0,0,0.25)] cursor-pointer text-left"
            style={{ backgroundColor: bg }}
          >
            <span
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accent, color: '#1d1b20' }}
            >
              <Icon className="w-4 h-4" strokeWidth={2.6} />
            </span>
            {t.message}
          </button>
        );
      })}
    </div>
  );
};
