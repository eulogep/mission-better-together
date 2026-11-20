import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Lock } from 'lucide-react';

interface DiscreetCamouflageProps {
  onExit: () => void;
}

// Instant "Quick Exit" trauma-informed camouflage screen.
// Looks like harmless school study notes so anyone glancing at the phone sees nothing sensitive.
export const DiscreetCamouflage: React.FC<DiscreetCamouflageProps> = ({ onExit }) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({ 0: true, 2: true });
  const [tapCount, setTapCount] = useState(0);

  const items = [
    'Relire le chapitre 4 : Théorème de Thalès et réciproque',
    'Apprendre les 15 dates clés de la Révolution industrielle',
    'Exercices d’anglais p. 42 (verbes irréguliers)',
    'Fiche de synthèse SVT : respiration cellulaire',
    'Préparer le plan de l’exposé de français',
  ];

  const handleSecretTap = () => {
    const next = tapCount + 1;
    if (next >= 2) {
      setTapCount(0);
      onExit();
    } else {
      setTapCount(next);
      window.setTimeout(() => setTapCount(0), 1200);
    }
  };

  return (
    <div className="w-full h-full bg-[#fafaf8] text-[#222224] flex flex-col font-ios select-none overflow-hidden">
      {/* Neutral Notes App Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-black/8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSecretTap}
          title="Double-cliquez pour revenir à MBT"
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <BookOpen className="w-5 h-5 text-[#d99b00]" />
          <div>
            <h1 className="text-[18px] font-semibold leading-tight">Mes Révisions</h1>
            <p className="text-[11px] text-[#8e8e93]">Semaine 12 · Notes personnelles</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onExit}
          title="Revenir en sécurité à MBT"
          aria-label="Revenir à MBT"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#c7c7cc] hover:text-[#666] hover:bg-black/5 transition cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Plausible Study Checklist */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-4 border border-black/6 shadow-xs">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#d99b00] mb-3">
            À faire cette semaine
          </p>
          <div className="flex flex-col gap-3">
            {items.map((text, idx) => {
              const isDone = !!checked[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChecked((c) => ({ ...c, [idx]: !c[idx] }))}
                  className="flex items-start gap-2.5 text-left cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#d99b00] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#c7c7cc] shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-[14px] leading-snug ${
                      isDone ? 'line-through text-[#8e8e93]' : 'text-[#2c2c2e]'
                    }`}
                  >
                    {text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/6 shadow-xs">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#8e8e93] mb-2">
            Formules rapides — Géométrie
          </p>
          <p className="text-[13px] leading-relaxed text-[#48484a]">
            • Aire d’un triangle : (base × hauteur) / 2<br />
            • Périmètre d’un cercle : 2 × π × r<br />
            • Théorème de Pythagore : a² + b² = c²
          </p>
        </div>
      </div>

      {/* Subtle hint at very bottom */}
      <div className="px-5 py-3 text-center text-[10px] text-[#aeaeb2]">
        Double-touchez « Mes Révisions » ou le cadenas discret pour revenir
      </div>
    </div>
  );
};
