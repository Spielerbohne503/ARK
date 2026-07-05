import { useEffect, useMemo, useState } from 'react';
import { calculateTaming } from '../hooks/useTamingCalculator';
import { formatMinutes, formatNumber } from '../lib/format';
import type { Dino, MapName } from '../types';
import { IconClose, IconList } from './icons';
import { SortableTh, useTableSort } from './SortableTable';

interface PlannerRow {
  id: string;
  name: string;
  difficulty: Dino['difficulty'];
  kibbleType: string;
  kibble: number;
  narcotics: number;
  minutes: number;
}

const ACCESSORS = {
  name: (r: PlannerRow) => r.name,
  kibble: (r: PlannerRow) => r.kibble,
  narcotics: (r: PlannerRow) => r.narcotics,
  minutes: (r: PlannerRow) => r.minutes,
};

interface TamingPlannerProps {
  map: MapName;
  /** Favorisierte Dinos der aktuellen Map. */
  dinos: Dino[];
  onClose: () => void;
  onOpenDino: (dino: Dino) => void;
}

/**
 * Zähm-Planer: fasst alle Favoriten einer Map als Einkaufsliste zusammen
 * (Kibble pro Sorte, Narcotics gesamt, gesamte Zähmzeit) auf Basis eines
 * gemeinsamen Ziel-Levels.
 */
export function TamingPlanner({ map, dinos, onClose, onOpenDino }: TamingPlannerProps) {
  const [level, setLevel] = useState(150);

  // ESC schließt den Planer; Hintergrund-Scroll sperren.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const rows = useMemo<PlannerRow[]>(
    () =>
      dinos.map((dino) => {
        const t = calculateTaming(dino, level);
        return {
          id: dino.id,
          name: dino.name,
          difficulty: dino.difficulty,
          kibbleType: dino.kibbleType,
          kibble: t.kibbleCount,
          narcotics: t.narcotics,
          minutes: t.tamingMinutes,
        };
      }),
    [dinos, level],
  );

  const { sorted, sort, toggle } = useTableSort(rows, ACCESSORS);

  // Kibble nach Sorte summieren (die eigentliche „Einkaufsliste").
  const kibbleByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.kibbleType.startsWith('–')) continue;
      map.set(row.kibbleType, (map.get(row.kibbleType) ?? 0) + row.kibble);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const totalNarcotics = rows.reduce((sum, r) => sum + r.narcotics, 0);
  const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Zähm-Planer für ${map}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/60 sm:animate-modal-in"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 p-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-gray-100">
            <IconList size={20} className="text-amber-400" />
            Zähm-Planer · {map}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-950/80 text-gray-300 transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            <IconClose size={18} />
          </button>
        </div>

        {dinos.length === 0 ? (
          <p className="p-10 text-center text-gray-400">
            Noch keine Favoriten auf {map}. Markiere Dinos mit dem Stern, um deine
            Zähm-Einkaufsliste zu planen.
          </p>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900/40 px-5 py-3">
              <label htmlFor="planner-level" className="shrink-0 text-xs uppercase tracking-widest text-gray-500">
                Ziel-Level
              </label>
              <input
                type="range"
                id="planner-level"
                min={1}
                max={150}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full accent-green-500"
              />
              <span className="w-10 shrink-0 text-center font-mono text-sm text-green-300">{level}</span>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              {/* Zusammenfassung / Einkaufsliste */}
              <section className="rounded-xl border border-amber-900/40 bg-amber-500/[0.04] p-4">
                <h3 className="mb-3 font-display text-sm uppercase tracking-widest text-amber-300">
                  Einkaufsliste ({dinos.length} {dinos.length === 1 ? 'Kreatur' : 'Kreaturen'})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kibbleByType.map(([type, count]) => (
                    <span
                      key={type}
                      className="rounded-lg border border-gray-700 bg-gray-900/60 px-2.5 py-1 text-sm text-gray-200"
                    >
                      {type}: <span className="font-mono font-bold text-green-300">{formatNumber(count)}</span>
                    </span>
                  ))}
                  <span className="rounded-lg border border-gray-700 bg-gray-900/60 px-2.5 py-1 text-sm text-gray-200">
                    Narcotics: <span className="font-mono font-bold text-green-300">{formatNumber(totalNarcotics)}</span>
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Gesamte Zähmzeit (nacheinander):{' '}
                  <span className="font-mono font-bold text-amber-300">{formatMinutes(totalMinutes)}</span>
                </p>
              </section>

              {/* Detail-Tabelle */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="text-[11px]">
                      <SortableTh label="Kreatur" sortKey="name" sort={sort} onToggle={toggle} align="left" />
                      <SortableTh label="Kibble" sortKey="kibble" sort={sort} onToggle={toggle} />
                      <SortableTh label="Narcotics" sortKey="narcotics" sort={sort} onToggle={toggle} />
                      <SortableTh label="Zeit" sortKey="minutes" sort={sort} onToggle={toggle} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/70">
                    {sorted.map((row) => {
                      const dino = dinos.find((d) => d.id === row.id)!;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => onOpenDino(dino)}
                          className="cursor-pointer text-gray-300 transition-colors hover:bg-white/5"
                        >
                          <td className="py-2 pr-2">{row.name}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{formatNumber(row.kibble)}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{formatNumber(row.narcotics)}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{formatMinutes(row.minutes)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
