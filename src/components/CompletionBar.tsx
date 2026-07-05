import type { MapName } from '../types';

interface CompletionBarProps {
  map: MapName;
  tamed: number;
  total: number;
}

/** Fortschrittsanzeige: X/Y Dinos gezähmt mit animierter Progress-Bar. */
export function CompletionBar({ map, tamed, total }: CompletionBarProps) {
  const percent = total > 0 ? Math.round((tamed / total) * 100) : 0;
  const complete = percent === 100 && total > 0;

  return (
    <section
      aria-label="Zähm-Fortschritt"
      className="rounded-xl border border-gray-800 bg-ark-surface p-4 shadow-lg sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-sm uppercase tracking-widest text-gray-300">
          Completion · <span className="text-green-400">{map}</span>
        </h2>
        <p className="font-body text-sm text-gray-300">
          <span className="text-lg font-bold text-green-400">{tamed}</span>
          <span className="text-gray-500"> / {total} gezähmt</span>
          <span className="ml-3 rounded bg-gray-800 px-2 py-0.5 font-mono text-xs text-green-300">
            {percent}%
          </span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 overflow-hidden rounded-full bg-gray-800 shadow-inner"
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
        <p className="mt-2 animate-fade-in text-center font-display text-sm text-green-400">
          🏆 Map komplett! Alle Kreaturen gezähmt.
        </p>
      )}
    </section>
  );
}
