import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DINO_DATABASE, getDinosForMap } from '../data/dinoDatabase';
import { EXPLORER_NOTES, getNotesForMap } from '../data/explorerNotes';
import { useCountUp } from '../hooks/useCountUp';
import { useDinoTracker } from '../hooks/useDinoTracker';
import { useExplorerTracker } from '../hooks/useExplorerTracker';
import { exportBackup, parseBackup } from '../lib/backup';
import { fireConfetti } from '../lib/confetti';
import { MAPS, type Dino, type ExplorerNote, type MapName } from '../types';
import { CompletionBar } from './CompletionBar';
import { DinoDetailModal } from './DinoDetailModal';
import { DinoGrid } from './DinoGrid';
import { ExplorerNoteModal } from './ExplorerNoteModal';
import { ExplorerNotesView } from './ExplorerNotesView';
import { FilterBar, type DifficultyFilter, type SortOrder, type StatusFilter } from './FilterBar';
import { MapTabs } from './MapTabs';
import { TamingPlanner } from './TamingPlanner';
import { ToastStack, type ToastData } from './Toast';
import { IconBook, IconDownload, IconList, IconSearch, IconSkull, IconSwords, IconUpload, IconWarning } from './icons';

type ViewMode = 'creatures' | 'notes';

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
  const [viewMode, setViewMode] = useState<ViewMode>('creatures');
  const [selectedDino, setSelectedDino] = useState<Dino | null>(null);
  const [selectedNote, setSelectedNote] = useState<ExplorerNote | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [sort, setSort] = useState<SortOrder>('name');
  const [notesOnlyOpen, setNotesOnlyOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);
  const importInputRef = useRef<HTMLInputElement>(null);
  const tracker = useDinoTracker();
  const explorer = useExplorerTracker();

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

  // Erkunder-Notizen der aktuellen Map.
  const mapNotes = useMemo(() => getNotesForMap(selectedMap), [selectedMap]);
  const mapNoteIds = useMemo(() => new Set(mapNotes.map((n) => n.id)), [mapNotes]);
  const foundCount = explorer.countFound(mapNoteIds);

  // Fortschritt pro Map für die Tabs – je nach Modus Zähmungen oder Notizen.
  const mapProgress = useCallback(
    (map: MapName): [number, number] => {
      if (viewMode === 'notes') {
        const notes = getNotesForMap(map);
        return [explorer.countFound(new Set(notes.map((n) => n.id))), notes.length];
      }
      const dinos = getDinosForMap(map);
      return [tracker.countTamed(map, new Set(dinos.map((d) => d.id))), dinos.length];
    },
    [tracker, explorer, viewMode],
  );

  const completedMaps = useMemo(
    () =>
      MAPS.filter((map) => {
        const dinos = getDinosForMap(map);
        return dinos.length > 0 && tracker.countTamed(map, new Set(dinos.map((d) => d.id))) === dinos.length;
      }).length,
    [tracker],
  );

  // Gesamtfortschritt über beides: alle Map-Zähm-Slots + alle Notizen.
  const totalDinoSlots = useMemo(
    () => MAPS.reduce((sum, map) => sum + getDinosForMap(map).length, 0),
    [],
  );
  const overallDone = tracker.records.size + explorer.found.size;
  const overallTotal = totalDinoSlots + EXPLORER_NOTES.length;
  const overallPercent = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;
  const overallPercentAnimated = useCountUp(overallPercent);

  // Hero-Stats mit Count-up.
  const speciesCount = useCountUp(DINO_DATABASE.length);
  const totalTames = useCountUp(tracker.records.size);
  const notesCount = useCountUp(EXPLORER_NOTES.length);
  const foundTotal = useCountUp(explorer.found.size);
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

  const handleToggleNote = useCallback(
    (note: ExplorerNote) => {
      const nowFound = explorer.toggleFound(note.id);
      if (nowFound) {
        const willBeComplete = explorer.countFound(mapNoteIds) + 1 === mapNotes.length;
        if (willBeComplete) {
          fireConfetti();
          pushToast('complete', `${selectedMap}: Alle ${mapNotes.length} Erkunder-Notizen gefunden!`);
        } else {
          pushToast('tamed', `${note.explorer} #${note.number} als gefunden markiert`);
        }
      } else {
        pushToast('untamed', `${note.explorer} #${note.number} wieder als offen markiert`);
      }
    },
    [explorer, mapNoteIds, mapNotes.length, selectedMap, pushToast],
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
            Verfolge deine Zähmungen und Erkunder-Notizen auf sieben Maps, plane den
            nächsten Fang mit dem Taming-Calculator und behalte alles an einem Ort.
          </p>

          {/* Global-Stats mit Count-up (kontextabhängig) */}
          <dl className="mx-auto mt-8 flex max-w-lg items-stretch justify-center divide-x divide-gray-800">
            {(viewMode === 'notes'
              ? [
                  { value: notesCount, label: 'Notizen' },
                  { value: foundTotal, label: 'Gefunden' },
                  { value: completedMapsAnimated, label: 'Maps komplett' },
                ]
              : [
                  { value: speciesCount, label: 'Spezies' },
                  { value: totalTames, label: 'Zähmungen' },
                  { value: completedMapsAnimated, label: 'Maps komplett' },
                ]
            ).map((stat) => (
              <div key={stat.label} className="flex-1 px-4 text-center sm:px-8">
                <dd className="font-display text-3xl font-bold tabular-nums text-amber-400 sm:text-4xl">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[11px] uppercase tracking-widest text-gray-500">{stat.label}</dt>
              </div>
            ))}
          </dl>

          {/* Gesamtfortschritt über Kreaturen UND Erkunder-Notizen */}
          <div className="mx-auto mt-8 max-w-lg">
            <div className="mb-1.5 flex items-baseline justify-between text-[11px] uppercase tracking-widest">
              <span className="text-gray-500">Gesamtfortschritt · Zähmungen &amp; Notizen</span>
              <span className="font-mono tabular-nums text-green-300">
                {overallDone} / {overallTotal} · {overallPercentAnimated}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Gesamtfortschritt"
              className="h-2.5 overflow-hidden rounded-full bg-gray-800/80 shadow-inner"
            >
              <div
                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-600 via-green-400 to-amber-400 transition-all duration-700 ease-out"
                style={{ width: `${overallPercent}%` }}
              >
                {overallPercent > 0 && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-1/4 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modus-Umschalter: Kreaturen ↔ Erkunder-Notizen */}
      <div className="border-b border-gray-800/60 bg-ark-bg">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-2 sm:px-6">
          {([
            { mode: 'creatures', label: 'Kreaturen', icon: <IconSwords size={16} /> },
            { mode: 'notes', label: 'Erkunder-Notizen', icon: <IconBook size={16} /> },
          ] as const).map((entry) => (
            <button
              key={entry.mode}
              type="button"
              onClick={() => setViewMode(entry.mode)}
              aria-pressed={viewMode === entry.mode}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                viewMode === entry.mode
                  ? 'bg-green-500/10 text-green-300 ring-1 ring-green-500/40'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {entry.icon}
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Glass-Toolbar: Map-Tabs + (im Kreaturen-Modus) Planer & Suche */}
      <div className="sticky top-0 z-40 border-b border-gray-800/70 bg-ark-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <MapTabs selected={selectedMap} onChange={handleMapChange} progress={mapProgress} />
          {viewMode === 'creatures' && (
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
          )}
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl space-y-5 px-4 pb-16 pt-6 sm:px-6">
        {(tracker.storageError || explorer.storageError) && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-yellow-600/50 bg-yellow-900/30 px-4 py-2 text-sm text-yellow-300"
          >
            <IconWarning size={16} />
            {tracker.storageError ?? explorer.storageError}
          </p>
        )}

        {viewMode === 'creatures' ? (
          <>
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
          </>
        ) : (
          <>
            <CompletionBar
              map={selectedMap}
              tamed={foundCount}
              total={mapNotes.length}
              unit="gefunden"
              completeText="Alle Erkunder-Notizen dieser Map gefunden."
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800/80 bg-ark-surface/60 p-3.5 sm:p-4">
              <p className="text-sm text-gray-400">
                Tippe eine Notiz an, um sie als <span className="text-green-300">gefunden</span> zu markieren.
                Die Koordinaten sind Richtwerte.
              </p>
              <button
                type="button"
                aria-pressed={notesOnlyOpen}
                onClick={() => setNotesOnlyOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  notesOnlyOpen
                    ? 'border-green-500/60 bg-green-500/10 text-green-300'
                    : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                Nur offene
              </button>
            </div>

            {explorer.loading ? (
              <p className="p-10 text-center text-gray-500">Lade gefundene Notizen …</p>
            ) : (
              <ExplorerNotesView
                map={selectedMap}
                isFound={explorer.isFound}
                onToggleFound={handleToggleNote}
                onOpenNote={setSelectedNote}
                onlyOpen={notesOnlyOpen}
              />
            )}
          </>
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

      {selectedNote && (
        <ExplorerNoteModal
          note={selectedNote}
          found={explorer.isFound(selectedNote.id)}
          onToggleFound={() => handleToggleNote(selectedNote)}
          onClose={() => setSelectedNote(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
