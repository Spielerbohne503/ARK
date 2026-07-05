import { useEffect, useRef, useState } from 'react';

/**
 * Zählt animiert von der zuletzt angezeigten Zahl zum Zielwert
 * (requestAnimationFrame, ease-out). Respektiert prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = target;
    if (from === target) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
