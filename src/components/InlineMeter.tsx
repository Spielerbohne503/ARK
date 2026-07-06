import { useCountUp } from '../hooks/useCountUp';

interface InlineMeterProps {
  done: number;
  total: number;
  unit?: string;
}

/**
 * Schlanke Inline-Fortschrittsanzeige für den Content-Header
 * (löst die frühere, dicke CompletionBar ab). Count-up bleibt erhalten.
 */
export function InlineMeter({ done, total, unit = 'gezähmt' }: InlineMeterProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = percent === 100 && total > 0;
  const animatedDone = useCountUp(done);
  const animatedPercent = useCountUp(percent);

  return (
    <div
      className="flex items-center gap-3"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Fortschritt: ${done} von ${total} ${unit}`}
    >
      <div className="h-2 w-24 overflow-hidden rounded-full border border-black/40 bg-gray-950/60 shadow-inner sm:w-32">
        <div
          className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-700 via-green-500 to-green-400 transition-all duration-700 ease-out ${
            complete ? 'shadow-[0_0_10px_rgba(74,222,128,0.7)]' : ''
          }`}
          style={{ width: `${percent}%` }}
        >
          {percent > 0 && (
            <span
              aria-hidden
              className="absolute inset-y-0 w-1/4 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
          )}
        </div>
      </div>
      <span className="whitespace-nowrap font-mono text-xs tabular-nums text-gray-400">
        <span className="font-bold text-green-400">{animatedDone}</span>
        <span className="text-gray-600">/{total}</span>
        <span
          className={`ml-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            complete ? 'bg-amber-500/20 text-amber-300' : 'text-green-300'
          }`}
        >
          {animatedPercent}%
        </span>
      </span>
    </div>
  );
}
