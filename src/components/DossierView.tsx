import { useMemo, useState } from 'react';
import { DOSSIERS, TOTAL_DOSSIERS } from '../data/dossiers';
import { useCountUp } from '../hooks/useCountUp';
import type { KeySet } from '../hooks/useKeySet';
import type { Dino } from '../types';
import { IconCheck, IconNote, IconSearch } from './icons';

interface DossierViewProps {
  dossierSet: KeySet;
  onToggle: (dino: Dino) => void;
}

/**
 * Dossier-Sammlung: Helenas Kreaturen-Seiten als map-unabhängige Checkliste.
 * Jede Karte zeigt das Dossier-Artwork und lässt sich als gefunden abhaken.
 */
export function DossierView({ dossierSet, onToggle }: DossierViewProps) {
  const [search, setSearch] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const found = dossierSet.count(useMemo(() => new Set(DOSSIERS.map((d) => d.id)), []));
  const percent = TOTAL_DOSSIERS > 0 ? Math.round((found / TOTAL_DOSSIERS) * 100) : 0;
  const animatedFound = useCountUp(found);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return DOSSIERS.filter((d) => {
      if (query && !d.name.toLowerCase().includes(query)) return false;
      if (onlyOpen && dossierSet.has(d.id)) return false;
      return true;
    });
  }, [search, onlyOpen, dossierSet]);

  return (
    <div className="space-y-5">
      {/* Fortschritt */}
      <section
        aria-label="Dossier-Fortschritt"
        className="relative overflow-hidden rounded-xl border border-gray-800 bg-ark-surface/80 p-4 shadow-lg sm:p-5"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/[0.06] to-transparent transition-all duration-700"
          style={{ width: `${Math.max(percent, 6)}%` }}
        />
        <div className="relative mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-sm uppercase tracking-widest text-gray-300">
            Dossiers · <span className="text-green-400">alle Maps</span>
          </h2>
          <p className="font-body text-sm text-gray-300">
            <span className="text-lg font-bold tabular-nums text-green-400">{animatedFound}</span>
            <span className="text-gray-500"> / {TOTAL_DOSSIERS} gefunden</span>
            <span className={`ml-3 rounded px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${
              percent === 100 ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-green-300'
            }`}>
              {percent}%
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
            className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-700 via-green-500 to-green-400 transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      {/* Suche + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800/80 bg-ark-surface/60 p-3.5 sm:p-4">
        <p className="text-sm text-gray-400">
          Helenas Kreaturen-Seiten liegen verstreut in der Welt – hake ab, welche du im
          Explorer-Notes-Menü schon <span className="text-green-300">freigeschaltet</span> hast.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={onlyOpen}
            onClick={() => setOnlyOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              onlyOpen
                ? 'border-green-500/60 bg-green-500/10 text-green-300'
                : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            Nur offene
          </button>
          <label className="relative block w-44 sm:w-56">
            <span className="sr-only">Dossier suchen</span>
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Dossier suchen …"
              className="w-full rounded-lg border border-gray-700/80 bg-ark-surface/80 py-2 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/25"
            />
          </label>
        </div>
      </div>

      {/* Dossier-Grid */}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-gray-800 bg-ark-surface p-10 text-center text-gray-400">
          Keine Dossiers gefunden – Suche anpassen oder Filter zurücksetzen.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((dino, index) => {
            const done = dossierSet.has(dino.id);
            return (
              <button
                key={dino.id}
                type="button"
                aria-pressed={done}
                onClick={() => onToggle(dino)}
                style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }}
                className={`group relative animate-fade-in-up overflow-hidden rounded-xl border text-left shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${
                  done
                    ? 'border-green-500/60 bg-green-900/70 shadow-green-900/40'
                    : 'border-gray-800 bg-gray-800/80 hover:border-green-700/60'
                }`}
              >
                <div className="relative h-28 overflow-hidden bg-gray-900 sm:h-32">
                  <img
                    src={dino.imageUrl}
                    alt={dino.name}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
                      done ? '' : 'opacity-70 saturate-50 group-hover:opacity-100 group-hover:saturate-100'
                    }`}
                  />
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent ${
                      done ? 'from-green-950/90' : 'from-gray-950/90'
                    }`}
                  />
                  <span
                    className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 ${
                      done
                        ? 'border-green-300/70 bg-green-500/90 text-gray-950'
                        : 'border-gray-600/70 bg-gray-950/70 text-gray-500 group-hover:text-green-300'
                    }`}
                  >
                    {done ? <IconCheck size={14} /> : <IconNote size={14} />}
                  </span>
                </div>
                <div className="px-2.5 py-2">
                  <p className={`truncate text-sm font-semibold ${done ? 'text-green-200' : 'text-gray-300'}`}>
                    {dino.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600">
                    {done ? 'Gefunden' : 'Offen'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
