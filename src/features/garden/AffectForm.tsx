import { useState } from 'react';
import { ACTIVATION_LABELS, AFFECT_LEVELS, AffectReading, AffectValence, VALENCE_LABELS, parseAffectReading } from '../../lib/affect';
import { useSerenity } from '../../context/SerenityContext';
import { AffectGrid } from './AffectGrid';

const VALENCES: readonly AffectValence[] = [...AFFECT_LEVELS, 'melange'];

interface AffectFormProps {
  initialReading?: AffectReading;
  onApply: (reading: AffectReading) => void;
  onCancel: () => void;
}

export function AffectForm({ initialReading, onApply, onCancel }: AffectFormProps) {
  const { nightMode } = useSerenity();
  const [valence, setValence] = useState(initialReading ? String(initialReading.valence) : '');
  const [activation, setActivation] = useState(initialReading ? String(initialReading.activation) : '');
  const reading = valence !== '' && activation !== ''
    ? parseAffectReading({ valence: valence === 'melange' ? valence : Number(valence), activation: Number(activation) })
    : null;
  const surface = nightMode ? 'border-white/15 bg-[#212b2d]' : 'border-[#d4e3d4] bg-[#fcfef8]';
  const select = `mt-1.5 min-h-11 w-full rounded-lg border border-current/25 px-2.5 text-base ${nightMode ? 'bg-[#181f24]' : 'bg-white'}`;

  return (
    <form
      className={`mt-3 grid gap-3 rounded-2xl border p-3.5 sm:p-4 ${surface}`}
      aria-label="Préciser mon ressenti"
      onSubmit={(event) => {
        event.preventDefault();
        if (reading) onApply(reading);
      }}
    >
      <AffectGrid
        reading={reading}
        onSelect={(nextValence, nextActivation) => {
          setValence(String(nextValence));
          setActivation(String(nextActivation));
        }}
      />
      <label className="block min-w-0 text-sm font-medium">
        Ton ressenti est plutôt…
        <select value={valence} onChange={(event) => setValence(event.target.value)} className={select} required>
          <option value="">Choisir…</option>
          {VALENCES.map((level) => <option key={level} value={level}>{VALENCE_LABELS[level]}</option>)}
        </select>
      </label>
      <div>
        <label htmlFor="garden-activation" className="block text-sm font-medium">Tu te sens calme ou animé·e ?</label>
        <p id="garden-activation-hint" className="mt-0.5 text-xs leading-relaxed opacity-80">Un corps peut être très animé par l’excitation ou l’agitation.</p>
        <select
          id="garden-activation"
          value={activation}
          onChange={(event) => setActivation(event.target.value)}
          aria-describedby="garden-activation-hint"
          className={select}
          required
        >
          <option value="">Choisir…</option>
          {AFFECT_LEVELS.map((level) => <option key={level} value={level}>{ACTIVATION_LABELS[level]}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!reading}
          className="min-h-11 rounded-xl bg-[#275c48] px-3.5 py-2 text-sm font-medium text-white cursor-pointer disabled:cursor-default disabled:opacity-50"
        >
          Appliquer à mon arbre
        </button>
        <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-current/20 px-3.5 py-2 text-sm font-medium cursor-pointer">
          Annuler
        </button>
      </div>
    </form>
  );
}
