import { useEffect, useMemo, useState } from 'react';
import { getDinosForMap } from '../data/dinoDatabase';
import { useDinoTracker } from '../hooks/useDinoTracker';
import { MAPS, type Dino, type MapName } from '../types';
import { CompletionBar } from './CompletionBar';
import { DinoDetailModal } from './DinoDetailModal';
import { DinoGrid } from './DinoGrid';
import { MapSelector } from './MapSelector';

const MAP_STORAGE_KEY = 'ark-dino-tracker:selected-map';

/** Zuletzt gewählte Map wiederherstellen (localStorage reicht für diese Kleinigkeit). */
function loadInitialMap(): MapName {
  try {
    const stored = localStorage.getItem(MAP_STORAGE_KEY);
    if (stored && (MAPS as readonly string[]).includes(stored)) return stored as MapName;
  } catch {
    // localStorage gesperrt (z. B. Private Mode) – Default verwenden.
  }
  return MAPS[0];
}

export function App() {
  const [selectedMap, setSelectedMap] = useState<MapName>(loadInitialMap);
  const [selectedDino, setSelectedDino] = useState<Dino | null>(null);
  const [search, setSearch] = useState('');
  const tracker = useDinoTracker();

  useEffect(() => {
    try {
      localStorage.setItem(MAP_STORAGE_KEY, selectedMap);
    } catch {
      // Nicht kritisch – Auswahl gilt dann nur für die Sitzung.
    }
  }, [selectedMap]);

  const mapDinos = useMemo(() => getDinosForMap(selectedMap), [selectedMap]);

  const visibleDinos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return mapDinos;
    return mapDinos.filter((dino) => dino.name.toLowerCase().includes(query));
  }, [mapDinos, search]);

  const mapDinoIds = useMemo(() => new Set(mapDinos.map((d) => d.id)), [mapDinos]);
  const tamedCount = tracker.countTamed(selectedMap, mapDinoIds);

  const handleMapChange = (map: MapName) => {
    setSelectedMap(map);
    setSelectedDino(null);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-ark-bg pb-16 font-body text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-ark-bg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <h1 className="text-center font-display text-3xl font-bold tracking-wider text-gray-100 sm:text-4xl">
            🦖 ARK <span className="text-green-400">DINO TRACKER</span>
          </h1>
          <p className="mt-1 text-center text-sm text-gray-500">
            Survival Evolved · Zähmungs-Fortschritt für alle Maps
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 pt-6 sm:px-6">
        {tracker.storageError && (
          <p
            role="alert"
            className="rounded-lg border border-yellow-600/50 bg-yellow-900/30 px-4 py-2 text-sm text-yellow-300"
          >
            ⚠️ {tracker.storageError}
          </p>
        )}

        {/* Map-Auswahl + Suche */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <MapSelector selected={selectedMap} onChange={handleMapChange} />
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Dino suchen</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Dino suchen…"
              className="w-full rounded-lg border border-gray-700 bg-ark-surface px-4 py-3 text-base text-gray-100 placeholder-gray-500 shadow-lg outline-none transition-colors duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
          </label>
        </div>

        <CompletionBar map={selectedMap} tamed={tamedCount} total={mapDinos.length} />

        {tracker.loading ? (
          <p className="p-10 text-center text-gray-500">Lade gespeicherte Zähmungen…</p>
        ) : (
          <DinoGrid
            dinos={visibleDinos}
            map={selectedMap}
            isTamed={tracker.isTamed}
            onTogglePin={(dino) => tracker.toggleTamed(selectedMap, dino.id)}
            onOpenDetails={setSelectedDino}
          />
        )}
      </main>

      {selectedDino && (
        <DinoDetailModal
          dino={selectedDino}
          map={selectedMap}
          record={tracker.getRecord(selectedMap, selectedDino.id)}
          onTogglePin={(level) => tracker.toggleTamed(selectedMap, selectedDino.id, level)}
          onClose={() => setSelectedDino(null)}
        />
      )}
    </div>
  );
}
