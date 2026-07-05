import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DINO_DATABASE, getDinosForMap } from '../data/dinoDatabase';
import { useCountUp } from '../hooks/useCountUp';
import { useDinoTracker } from '../hooks/useDinoTracker';
import { exportBackup, parseBackup } from '../lib/backup';
import { fireConfetti } from '../lib/confetti';
import { MAPS, type Dino, type MapName } from '../types';
import { CompletionBar } from './CompletionBar';
import { DinoDetailModal } from './DinoDetailModal';
import { DinoGrid } from './DinoGrid';
import { FilterBar, type DifficultyFilter, type SortOrder, type StatusFilter } from './FilterBar';
import { MapTabs } from './MapTabs';
import { TamingPlanner } from './TamingPlanner';
import { ToastStack, type ToastData } from './Toast';
import { IconDownload, IconList, IconSearch, IconSkull, IconUpload, IconWarning } from './icons';

const MAP_STORAGE_KEY = 'ark-dino-tracker:selected-map';
const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 } as const;
/** Artworks für die Hero-Collage. */
const HERO_IMAGES = ['/dinos/spino.webp', '/dinos/rex.webp', '/dinos/wyvern.webp'];

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
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [sort, setSort] = useState<SortOrder>('name');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);
  const importInputRef = useRef<HTMLInputElement>(null);
  const tracker = useDinoTracker();

  useEffect(() => {
    try {
      localStorage.setItem(MAP_STORAGE_KEY, selectedMap);
    } catch {
      // Nicht kritisch – Auswahl gilt dann nur für die Sitzung.
    }
  }, [selectedMap]);

  const pushToast = useCallback((kind: ToastData['kind'], message: string) => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mapDinos = useMemo(() => getDinosForMap(selectedMap), [selectedMap]);
  const mapDinoIds = useMemo(() => new Set(mapDinos.map((d) => d.id)), [mapDinos]);
  const tamedCount = tracker.countTamed(selectedMap, mapDinoIds);

  // Favorisierte Dinos der aktuellen Map für den Zähm-Planer.
  const favoriteDinos = useMemo(
    () => mapDinos.filter((dino) => tracker.isFavorite(selectedMap, dino.id)),
    [mapDinos, tracker, selectedMap],
  );

  // Fortschritt pro Map für die Tabs (und "Maps komplett" im Hero).
  const mapProgress = useCallback(
    (map: MapName): [number, number] => {
      const dinos = getDinosForMap(map);
      return [tracker.countTamed(map, new Set(dinos.map((d) => d.id))), dinos.length];
    },
    [tracker],
  );

  const completedMaps = useMemo(
    () => MAPS.filter((map) => { const [t, total] = mapProgress(map); return total > 0 && t === total; }).length,
    [mapProgress],
  );

  // Hero-Stats mit Count-up.
  const speciesCount = useCountUp(DINO_DATABASE.length);
  const totalTames = useCountUp(tracker.records.size);
  const completedMapsAnimated = useCountUp(completedMaps);

  const visibleDinos = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = mapDinos.filter((dino) => {
      if (query && !dino.name.toLowerCase().includes(query)) return false;
      if (difficulty !== 'all' && dino.difficulty !== difficulty) return false;
      const tamed = tracker.isTamed(selectedMap, dino.id);
      if (status === 'tamed' && !tamed) return false;
      if (status === 'open' && tamed) return false;
      if (status === 'favorites' && !tracker.isFavorite(selectedMap, dino.id)) return false;
      return true;
    });

    if (sort === 'difficulty') {
      filtered.sort(
        (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || a.name.localeCompare(b.name, 'de'),
      );
    } else if (sort === 'recent') {
      filtered.sort((a, b) => {
        const dateA = tracker.getRecord(selectedMap, a.id)?.tamedDate ?? '';
        const dateB = tracker.getRecord(selectedMap, b.id)?.tamedDate ?? '';
        return dateB.localeCompare(dateA) || a.name.localeCompare(b.name, 'de');
      });
    }
    // 'name' ist bereits die Grundsortierung aus getDinosForMap.
    return filtered;
  }, [mapDinos, search, difficulty, status, sort, tracker, selectedMap]);

  const handleMapChange = (map: MapName) => {
    setSelectedMap(map);
    setSelectedDino(null);
  };

  const handleTogglePin = useCallback(
    (dino: Dino, level?: number) => {
      const nowTamed = tracker.toggleTamed(selectedMap, dino.id, level);
      if (nowTamed) {
        // 100 %-Check: Zähl-Stand vor dem Toggle + 1 gegen Gesamtzahl.
        const willBeComplete = tracker.countTamed(selectedMap, mapDinoIds) + 1 === mapDinos.length;
        if (willBeComplete) {
          fireConfetti();
          pushToast('complete', `${selectedMap} ist komplett – alle ${mapDinos.length} Kreaturen gezähmt!`);
        } else {
          pushToast('tamed', `${dino.name} als gezähmt markiert`);
        }
      } else {
        pushToast('untamed', `${dino.name} wieder als offen markiert`);
      }
    },
    [tracker, selectedMap, mapDinoIds, mapDinos.length, pushToast],
  );

  const handleToggleFavorite = useCallback(
    (dino: Dino) => {
      const nowFavorite = tracker.toggleFavorite(selectedMap, dino.id);
      if (nowFavorite) pushToast('favorite', `${dino.name} auf die Zähm-Liste gesetzt`);
    },
    [tracker, selectedMap, pushToast],
  );

  const handleImportFile = async (file: File) => {
    try {
      const parsed = parseBackup(await file.text());
      tracker.replaceAll(parsed.tamed, parsed.favorites, parsed.notes);
      pushToast('info', `Backup importiert: ${parsed.tamed.length} Zähmungen`);
    } catch {
      pushToast('untamed', 'Import fehlgeschlagen – keine gültige Backup-Datei');
    }
  };

  return (
    <div className="relative min-h-screen bg-ark-bg font-body text-gray-100">
      {/* Film-Grain + ambiente Glows über der ganzen Seite */}
      <span aria-hidden className="grain-overlay" />
      <span aria-hidden className="pointer-events-none fixed -left-40 top-1/4 -z-0 h-96 w-96 rounded-full bg-green-500/[0.04] blur-3xl" />
      <span aria-hidden className="pointer-events-none fixed -right-40 top-2/3 -z-0 h-96 w-96 rounded-full bg-amber-500/[0.03] blur-3xl" />

      {/* Cinematic Hero */}
      <header className="relative overflow-hidden border-b border-gray-800/80">
        <div aria-hidden className="absolute inset-0 flex opacity-25">
          {HERO_IMAGES.map((src) => (
            <img key={src} src={src} alt="" className="h-full w-1/3 object-cover" loading="eager" />
          ))}
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ark-bg via-ark-bg/85 to-ark-bg/40" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,14,18,0.9)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
          <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-green-400/90">
            <IconSkull size={18} />
            Survival Evolved Companion
          </p>
          <h1 className="text-center font-display text-4xl font-bold tracking-wider text-gray-50 drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] sm:text-5xl">
            ARK{' '}
            <span className="bg-gradient-to-r from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              DINO TRACKER
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-gray-400">
            Verfolge deine Zähmungen auf sieben Maps, plane den nächsten Fang mit dem
            Taming-Calculator und behalte Favoriten und Notizen an einem Ort.
          </p>

          {/* Global-Stats mit Count-up */}
          <dl className="mx-auto mt-8 flex max-w-lg items-stretch justify-center divide-x divide-gray-800">
            {[
              { value: speciesCount, label: 'Spezies' },
              { value: totalTames, label: 'Zähmungen' },
              { value: completedMapsAnimated, label: 'Maps komplett' },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 px-4 text-center sm:px-8">
                <dd className="font-display text-3xl font-bold tabular-nums text-amber-400 sm:text-4xl">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[11px] uppercase tracking-widest text-gray-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Sticky Glass-Toolbar: Map-Tabs + Suche */}
      <div className="sticky top-0 z-40 border-b border-gray-800/70 bg-ark-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <MapTabs selected={selectedMap} onChange={handleMapChange} progress={mapProgress} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlannerOpen(true)}
              className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-700/80 bg-ark-surface/80 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-amber-500/60 hover:text-amber-300"
              title="Zähm-Planer für deine Favoriten"
            >
              <IconList size={16} />
              <span className="hidden sm:inline">Planer</span>
              {favoriteDinos.length > 0 && (
                <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 text-[11px] font-bold text-amber-300">
                  {favoriteDinos.length}
                </span>
              )}
            </button>
            <label className="relative block flex-1 lg:w-56">
              <span className="sr-only">Dino suchen</span>
              <IconSearch
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Dino suchen …"
                className="w-full rounded-lg border border-gray-700/80 bg-ark-surface/80 py-2 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors duration-200 focus:border-green-500"
              />
            </label>
          </div>
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl space-y-5 px-4 pb-16 pt-6 sm:px-6">
        {tracker.storageError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-yellow-600/50 bg-yellow-900/30 px-4 py-2 text-sm text-yellow-300"
          >
            <IconWarning size={16} />
            {tracker.storageError}
          </p>
        )}

        <CompletionBar map={selectedMap} tamed={tamedCount} total={mapDinos.length} />

        <FilterBar
          status={status}
          difficulty={difficulty}
          sort={sort}
          resultCount={visibleDinos.length}
          onStatus={setStatus}
          onDifficulty={setDifficulty}
          onSort={setSort}
        />

        {tracker.loading ? (
          <p className="p-10 text-center text-gray-500">Lade gespeicherte Zähmungen …</p>
        ) : (
          <DinoGrid
            dinos={visibleDinos}
            map={selectedMap}
            isTamed={tracker.isTamed}
            isFavorite={tracker.isFavorite}
            onTogglePin={(dino) => handleTogglePin(dino)}
            onToggleFavorite={handleToggleFavorite}
            onOpenDetails={setSelectedDino}
          />
        )}
      </main>

      {/* Footer mit Sekundär-Navigation, Backup und Credits */}
      <footer className="relative border-t border-gray-800/80 bg-gray-950/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-gray-400">Maps</h2>
            <ul className="space-y-1.5 text-sm">
              {MAPS.map((map) => (
                <li key={map}>
                  <button
                    type="button"
                    onClick={() => { handleMapChange(map); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`transition-colors hover:text-green-300 ${map === selectedMap ? 'text-green-400' : 'text-gray-500'}`}
                  >
                    {map}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-gray-400">Daten &amp; Backup</h2>
            <p className="mb-3 text-sm leading-relaxed text-gray-500">
              Dein Fortschritt liegt lokal in diesem Browser (IndexedDB). Sichere ihn als Datei
              oder übertrage ihn auf ein anderes Gerät.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportBackup(tracker.records, tracker.favorites, tracker.notes)}
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-green-600 hover:text-green-300"
              >
                <IconDownload size={15} />
                Exportieren
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-green-600 hover:text-green-300"
              >
                <IconUpload size={15} />
                Importieren
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-gray-400">Über</h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Inoffizielles Fan-Projekt. Dossier-Artworks © Studio Wildcard, bereitgestellt über
              das Ark Community Wiki (CC-BY-SA). Läuft komplett offline – keine Server, keine
              Tracker.
            </p>
          </div>
        </div>
      </footer>

      {selectedDino && (
        <DinoDetailModal
          dino={selectedDino}
          map={selectedMap}
          record={tracker.getRecord(selectedMap, selectedDino.id)}
          note={tracker.getNote(selectedMap, selectedDino.id)}
          onTogglePin={(level) => handleTogglePin(selectedDino, level)}
          onUpdateLevel={(level) => tracker.updateLevel(selectedMap, selectedDino.id, level)}
          onSaveNote={(text) => tracker.saveNote(selectedMap, selectedDino.id, text)}
          onClose={() => setSelectedDino(null)}
        />
      )}

      {plannerOpen && (
        <TamingPlanner
          map={selectedMap}
          dinos={favoriteDinos}
          onClose={() => setPlannerOpen(false)}
          onOpenDino={(dino) => {
            setPlannerOpen(false);
            setSelectedDino(dino);
          }}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
