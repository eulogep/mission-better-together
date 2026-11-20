import { KeyboardEvent, useId, useRef } from 'react';
import { ACTIVATION_LABELS, AFFECT_LEVELS, AffectLevel, AffectReading, VALENCE_LABELS } from '../../lib/affect';
import { useSerenity } from '../../context/SerenityContext';

const ROWS = [...AFFECT_LEVELS].reverse();
const SIZE = AFFECT_LEVELS.length;
const CENTER = Math.floor(SIZE / 2);
const DIRECTIONS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
} as const;

interface AffectGridProps {
  reading: AffectReading | null;
  onSelect: (valence: AffectLevel, activation: AffectLevel) => void;
}

export function AffectGrid({ reading, onSelect }: AffectGridProps) {
  const { nightMode } = useSerenity();
  const id = useId();
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const tabStop = reading && typeof reading.valence === 'number'
    ? ROWS.indexOf(reading.activation) * SIZE + AFFECT_LEVELS.indexOf(reading.valence)
    : CENTER * SIZE + CENTER;
  const palette = nightMode
    ? 'border-[#698490] bg-[linear-gradient(135deg,#483d55_5%,#3d5055_53%,#394f40_100%)]'
    : 'border-[#b8c9bc] bg-[linear-gradient(135deg,#e9e0ed_5%,#e4ebec_48%,#e9f2dc_100%)]';

  const move = (event: KeyboardEvent<HTMLButtonElement>, row: number, column: number) => {
    if (!(event.key in DIRECTIONS)) return;
    event.preventDefault();
    const [dy, dx] = DIRECTIONS[event.key as keyof typeof DIRECTIONS];
    const nextRow = Math.max(0, Math.min(SIZE - 1, row + dy));
    const nextColumn = Math.max(0, Math.min(SIZE - 1, column + dx));
    if (nextRow === row && nextColumn === column) return;
    onSelect(AFFECT_LEVELS[nextColumn], ROWS[nextRow]);
    cells.current[nextRow * SIZE + nextColumn]?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-[325px]">
      <p id={`${id}-title`} className="text-center font-ubuntu text-sm font-medium">Place ton ressenti</p>
      <p id={`${id}-guide`} className="sr-only">
        Utilise les flèches pour choisir un point. Horizontalement, de désagréable à agréable. Verticalement, d’animé à calme.
      </p>
      <p aria-hidden="true" className="mt-2 text-center text-xs font-medium opacity-85">Plus animé</p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-guide`}
        className={`relative mt-1.5 grid h-[230px] grid-cols-5 grid-rows-5 overflow-hidden rounded-2xl border ${palette}`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-current/25" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-current/25" />
        {ROWS.flatMap((activation, row) => AFFECT_LEVELS.map((valence, column) => {
          const index = row * SIZE + column;
          const selected = reading?.valence === valence && reading.activation === activation;
          const label = `${VALENCE_LABELS[valence]} · ${ACTIVATION_LABELS[activation]}`;
          return (
            <button
              key={index}
              ref={(element) => { cells.current[index] = element; }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              title={label}
              tabIndex={index === tabStop ? 0 : -1}
              onClick={() => onSelect(valence, activation)}
              onKeyDown={(event) => move(event, row, column)}
              className="relative flex items-center justify-center border border-transparent cursor-pointer hover:bg-white/20 focus-visible:rounded-md focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-current"
            >
              <span aria-hidden="true" className={`rounded-full ${selected
                ? 'size-4 bg-[#245741] ring-2 ring-white ring-offset-2 ring-offset-[#245741]'
                : 'size-1.5 bg-current/40'}`}
              />
            </button>
          );
        }))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between gap-2 text-xs font-medium opacity-85">
        <span>Désagréable</span>
        <span>Plus calme</span>
        <span>Agréable</span>
      </div>
      {reading && (
        <p role="status" className="mt-2 text-center text-xs font-medium leading-relaxed">
          {VALENCE_LABELS[reading.valence]} · {ACTIVATION_LABELS[reading.activation]}
        </p>
      )}
    </div>
  );
}
