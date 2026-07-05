import { MAPS, type MapName } from '../types';

interface MapTabsProps {
  selected: MapName;
  onChange: (map: MapName) => void;
  /** Fortschritt pro Map: [gezähmt, gesamt]. */
  progress: (map: MapName) => [number, number];
}

/** Horizontale Map-Tabs (scrollbar auf Mobile) mit Mini-Fortschritt pro Map. */
export function MapTabs({ selected, onChange, progress }: MapTabsProps) {
  return (
    <nav aria-label="Map-Auswahl" className="scrollbar-hide -mx-1 overflow-x-auto">
      <div className="flex w-max gap-1 px-1" role="tablist">
        {MAPS.map((map) => {
          const active = map === selected;
          const [tamed, total] = progress(map);
          return (
            <button
              key={map}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(map)}
              className={`group relative shrink-0 rounded-lg px-3.5 py-2 text-sm transition-all duration-300 ${
                active
                  ? 'bg-green-500/10 text-green-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <span className="font-display font-semibold tracking-wide">{map}</span>
              <span
                className={`ml-2 font-mono text-[11px] tabular-nums ${
                  tamed === total && total > 0
                    ? 'text-amber-400'
                    : active
                      ? 'text-green-500'
                      : 'text-gray-600 group-hover:text-gray-500'
                }`}
              >
                {tamed}/{total}
              </span>
              {/* aktive Unterstreichung mit Glow */}
              <span
                aria-hidden
                className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-all duration-300 ${
                  active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
