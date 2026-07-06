import { useCountUp } from '../hooks/useCountUp';
import type { MapName } from '../types';
import { IconTrophy } from './icons';

interface CompletionBarProps {
  map: MapName;
  tamed: number;
  total: number;
  /** Einheit im Zählerstand, z. B. "gezähmt" oder "gefunden". */
  unit?: string;
  /** Text der 100 %-Meldung. */
  completeText?: string;
}

/** Fortschrittsanzeige: X/Y erledigt mit animierter Progress-Bar und Count-up. */
export function CompletionBar({
  map,
  tamed,
  total,
  unit = 'gezähmt',
  completeText = 'Map komplett – alle Kreaturen gezähmt.',
}: CompletionBarProps) {
  const percent = total > 0 ? Math.round((tamed / total) * 100) : 0;
  const complete = percent === 100 && total > 0;
  const animatedTamed = useCountUp(tamed);
  const animatedPercent = useCountUp(percent);

  return (
    <section
      aria-label="Zähm-Fortschritt"
      className="relative overflow-hidden rounded-xl border border-gray-800 bg-ark-surface/80 p-4 shadow-lg sm:p-5"
    >
      {/* dezenter Fortschritts-Glow im Hintergrund, wächst mit dem Prozent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/[0.06] to-transparent transition-all duration-700"
        style={{ width: `${Math.max(percent, 6)}%` }}
      />
      <div className="relative mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-sm uppercase tracking-widest text-gray-300">
          Completion · <span className="text-green-400">{map}</span>
        </h2>
        <p className="font-body text-sm text-gray-300">
          <span className="text-lg font-bold tabular-nums text-green-400">{animatedTamed}</span>
          <span className="text-gray-500"> / {total} {unit}</span>
          <span
            className={`ml-3 rounded px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${
              complete ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-green-300'
            }`}
          >
            {animatedPercent}%
          </span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-3 overflow-hidden rounded-full border border-black/40 bg-gray-950/60 shadow-inner"
      >
        <div
          className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-700 via-green-500 to-green-400 transition-all duration-700 ease-out ${
            complete ? 'shadow-[0_0_12px_rgba(74,222,128,0.7)]' : ''
          }`}
          style={{ width: `${percent}%` }}
        >
          {/* Shimmer-Lichtstreifen wandert über die gefüllte Bar */}
          {percent > 0 && (
            <span
              aria-hidden
              className="absolute inset-y-0 w-1/4 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
          )}
        </div>
      </div>

      {complete && (
        <p className="mt-2.5 flex animate-fade-in items-center justify-center gap-2 font-display text-sm text-amber-400">
          <IconTrophy size={16} />
          {completeText}
        </p>
      )}
    </section>
  );
}
