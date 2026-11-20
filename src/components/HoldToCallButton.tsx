import React, { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import { vibrate } from '../lib/device';

interface HoldToCallButtonProps {
  onConfirm: () => void;
  /** Ce que fait le bouton, lu par les lecteurs d'écran */
  label: string;
  holdMs?: number;
}

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Bouton d'appel d'urgence « maintenir pour appeler » : un anneau se remplit pendant l'appui,
 * ce qui évite les appels accidentels (poche, mauvais geste) sans ralentir un vrai appel.
 * Clavier et lecteurs d'écran (clic sans pointeur) : appel direct, car le geste est volontaire.
 */
export const HoldToCallButton: React.FC<HoldToCallButtonProps> = ({ onConfirm, label, holdMs = 900 }) => {
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState(false);
  const holdingRef = useRef(false);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const hintTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(hintTimer.current);
    },
    []
  );

  const start = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holdingRef.current = true;
    startedAt.current = Date.now();
    setHolding(true);
    setHint(false);
    vibrate(12);
    timer.current = window.setTimeout(() => {
      holdingRef.current = false;
      setHolding(false);
      vibrate([40, 50, 80]);
      onConfirm();
    }, holdMs);
  };

  const cancel = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    window.clearTimeout(timer.current);
    setHolding(false);
    if (Date.now() - startedAt.current < holdMs) {
      setHint(true);
      window.clearTimeout(hintTimer.current);
      hintTimer.current = window.setTimeout(() => setHint(false), 2400);
    }
  };

  return (
    <div className="relative pointer-events-auto">
      {/* Bulle d'aide après un appui trop court */}
      <div
        className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-4 whitespace-nowrap px-3.5 py-2 rounded-full bg-[#1d1b20] text-white text-[12.5px] font-medium shadow-lg transition-all duration-200 ${
          hint || holding ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
        aria-hidden="true"
      >
        {holding ? 'Garde le doigt appuyé…' : 'Maintiens appuyé pour appeler'}
        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#1d1b20]" />
      </div>

      <button
        type="button"
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onClick={(e) => {
          // detail === 0 : activation au clavier ou par un lecteur d'écran → appel direct
          if (e.detail === 0) onConfirm();
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`${label} — maintenir appuyé`}
        title="Maintenir appuyé pour appeler"
        className={`relative mbt-phone-fab w-[92px] h-[88px] rounded-full bg-white flex items-center justify-center select-none touch-none transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8989]/40 ${
          holding ? 'scale-95 text-[#e5484d]' : 'text-[#1d1b20] hover:text-[#e5484d]'
        }`}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {/* Anneau de progression */}
        <svg
          className="pointer-events-none absolute -inset-[10px] w-[calc(100%+20px)] h-[calc(100%+20px)] -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#FF8989" strokeOpacity={holding ? 0.18 : 0} strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r={RING_R}
            fill="none"
            stroke="#FF5B5B"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={holding ? 0 : RING_C}
            style={{
              transition: holding ? `stroke-dashoffset ${holdMs}ms linear` : 'stroke-dashoffset 180ms ease-out',
            }}
          />
        </svg>
        <Phone className="w-[42px] h-[42px]" strokeWidth={2.3} />
      </button>
    </div>
  );
};
