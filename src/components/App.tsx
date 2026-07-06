import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  bossKey,
  DIFFICULTY_LABEL,
  getBossesForMap,
  TOTAL_BOSS_KILLS,
  type Boss,
  type BossDifficulty,
} from '../data/bosses';
import { getArtifactsForMap, TOTAL_ARTIFACTS, type Artifact } from '../data/artifacts';
import { getDinosForMap } from '../data/dinoDatabase';
import { EXPLORER_NOTES, getNotesForMap } from '../data/explorerNotes';
import { useCountUp } from '../hooks/useCountUp';
import { useDinoTracker } from '../hooks/useDinoTracker';
import { useExplorerTracker } from '../hooks/useExplorerTracker';
import { useKeySet } from '../hooks/useKeySet';
import { exportBackup, parseBackup } from '../lib/backup';
import { fireConfetti } from '../lib/confetti';
import { STORE_ARTIFACTS, STORE_BOSSES } from '../lib/db';
import { MAPS, type Dino, type ExplorerNote, type MapName } from '../types';
import { ArtifactModal } from './ArtifactModal';
import { ArtifactView } from './ArtifactView';
import { BossModal } from './BossModal';
import { BossView } from './BossView';
import { BottomNav } from './BottomNav';
import { DinoDetailModal } from './DinoDetailModal';
import { DinoGrid } from './DinoGrid';
import { ExplorerNoteModal } from './ExplorerNoteModal';
import { ExplorerNotesView } from './ExplorerNotesView';
import { FilterBar, type DifficultyFilter, type SortOrder, type StatusFilter } from './FilterBar';
import { InlineMeter } from './InlineMeter';
import { KibbleView } from './KibbleView';
import { MapTabs } from './MapTabs';
import { NAV_ITEMS, type ViewMode } from './nav';
import { Sidebar } from './Sidebar';
import { Spinner } from './Spinner';
import { TamingPlanner } from './TamingPlanner';
import { ToastStack, type ToastData } from './Toast';
import { IconList, IconSearch, IconSkull, IconWarning } from './icons';

const MAP_STORAGE_KEY = 'ark-dino-tracker:selected-map';
const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 } as const;

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
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [sort, setSort] = useState<SortOrder>('name');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);
  const tracker = useDinoTracker();
  const explorer = useExplorerTracker();
  const bossSet = useKeySet(STORE_BOSSES);
  const artifactSet = useKeySet(STORE_ARTIFACTS);

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

  // Bosse der aktuellen Map (jede Schwierigkeit ist ein eigenes Ziel).
  const mapBosses = useMemo(() => getBossesForMap(selectedMap), [selectedMap]);
  const mapBossKeys = useMemo(
    () => new Set(mapBosses.flatMap((b) => b.difficulties.map((d) => bossKey(b.id, d)))),
    [mapBosses],
  );
  const bossDoneCount = bossSet.count(mapBossKeys);

  // Artefakte der aktuellen Map.
  const mapArtifacts = useMemo(() => getArtifactsForMap(selectedMap), [selectedMap]);
  const mapArtifactIds = useMemo(() => new Set(mapArtifacts.map((a) => a.id)), [mapArtifacts]);
  const artifactDoneCount = artifactSet.count(mapArtifactIds);

  // Fortschritt pro Map für die Tabs – je nach Modus.
  const mapProgress = useCallback(
    (map: MapName): [number, number] => {
      if (viewMode === 'notes') {
        const notes = getNotesForMap(map);
        return [explorer.countFound(new Set(notes.map((n) => n.id))), notes.length];
      }
      if (viewMode === 'bosses') {
        const keys = getBossesForMap(map).flatMap((b) => b.difficulties.map((d) => bossKey(b.id, d)));
        return [bossSet.count(new Set(keys)), keys.length];
      }
      if (viewMode === 'artifacts') {
        const arts = getArtifactsForMap(map);
        return [artifactSet.count(new Set(arts.map((a) => a.id))), arts.length];
      }
      const dinos = getDinosForMap(map);
      return [tracker.countTamed(map, new Set(dinos.map((d) => d.id))), dinos.length];
    },
    [tracker, explorer, bossSet, artifactSet, viewMode],
  );

  // Gesamtfortschritt über alles: Zähm-Slots + Notizen + Boss-Siege + Artefakte.
  const totalDinoSlots = useMemo(
    () => MAPS.reduce((sum, map) => sum + getDinosForMap(map).length, 0),
    [],
  );
  const overallDone = tracker.records.size + explorer.found.size + bossSet.keys.size + artifactSet.keys.size;
  const overallTotal = totalDinoSlots + EXPLORER_NOTES.length + TOTAL_BOSS_KILLS + TOTAL_ARTIFACTS;
  const overallPercent = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;
  const overallPercentAnimated = useCountUp(overallPercent);

  // Abschnittstitel + Fortschritts-Meter für den Content-Header (je nach Modus).
  const sectionLabel = NAV_ITEMS.find((item) => item.mode === viewMode)?.label ?? '';
  const meter =
    viewMode === 'notes'
      ? { done: foundCount, total: mapNotes.length, unit: 'gefunden' }
      : viewMode === 'bosses'
        ? { done: bossDoneCount, total: mapBossKeys.size, unit: 'besiegt' }
        : viewMode === 'artifacts'
          ? { done: artifactDoneCount, total: mapArtifacts.length, unit: 'gefunden' }
          : { done: tamedCount, total: mapDinos.length, unit: 'gezähmt' };

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

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setOnlyOpen(false);
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

  const handleToggleBoss = useCallback(
    (boss: Boss, difficulty: BossDifficulty) => {
      const now = bossSet.toggle(bossKey(boss.id, difficulty));
      if (now) {
        const willBeComplete = bossSet.count(mapBossKeys) + 1 === mapBossKeys.size;
        if (willBeComplete) {
          fireConfetti();
          pushToast('complete', `${selectedMap}: Alle Bosse besiegt!`);
        } else {
          pushToast('tamed', `${boss.name} (${DIFFICULTY_LABEL[difficulty]}) als besiegt markiert`);
        }
      } else {
        pushToast('untamed', `${boss.name} (${DIFFICULTY_LABEL[difficulty]}) wieder offen`);
      }
    },
    [bossSet, mapBossKeys, selectedMap, pushToast],
  );

  const handleToggleArtifact = useCallback(
    (artifact: Artifact) => {
      const now = artifactSet.toggle(artifact.id);
      if (now) {
        const willBeComplete = artifactSet.count(mapArtifactIds) + 1 === mapArtifacts.length;
        if (willBeComplete) {
          fireConfetti();
          pushToast('complete', `${selectedMap}: Alle Artefakte gesammelt!`);
        } else {
          pushToast('tamed', `${artifact.name} als gefunden markiert`);
        }
      } else {
        pushToast('untamed', `${artifact.name} wieder als offen markiert`);
      }
    },
    [artifactSet, mapArtifactIds, mapArtifacts.length, selectedMap, pushToast],
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

  const storageError =
    tracker.storageError ?? explorer.storageError ?? bossSet.storageError ?? artifactSet.storageError;

  return (
    <div className="relative flex min-h-screen bg-ark-bg font-body text-gray-100">
      {/* Film-Grain + ambiente Glows über der ganzen Seite */}
      <span aria-hidden className="grain-overlay" />
      <span aria-hidden className="pointer-events-none fixed -left-40 top-1/4 -z-0 h-96 w-96 animate-glow-pulse rounded-full bg-green-500/[0.05] blur-3xl" />
      <span aria-hidden className="pointer-events-none fixed -right-40 top-2/3 -z-0 h-96 w-96 animate-glow-pulse rounded-full bg-amber-500/[0.04] blur-3xl [animation-delay:3s]" />

      {/* Desktop-Navigations-Rail */}
      <Sidebar
        viewMode={viewMode}
        onViewMode={handleViewMode}
        overallDone={overallDone}
        overallTotal={overallTotal}
        overallPercent={overallPercent}
        overallPercentAnimated={overallPercentAnimated}
        onExport={() => exportBackup(tracker.records, tracker.favorites, tracker.notes)}
        onImport={(file) => void handleImportFile(file)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Kopf: Mobile-Top-Bar + Content-Header */}
        <div className="sticky top-0 z-40">
          {/* Mobile Top-Bar (nur < lg) */}
          <header className="flex items-center justify-between gap-3 border-b border-gray-800/80 bg-ark-bg/90 px-4 py-3 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-500/30 bg-green-500/10 text-green-400">
                <IconSkull size={17} />
              </span>
              <span className="font-display text-sm font-bold tracking-widest text-gray-50">ARK</span>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] tabular-nums text-green-300">
              {overallDone}/{overallTotal} · <span className="text-amber-300">{overallPercentAnimated}%</span>
            </span>
          </header>

          {/* Content-Header: Titel + Map + Meter + Steuerung */}
          <div className="border-b border-gray-800/70 bg-ark-bg/80 backdrop-blur-md">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                <h1 className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-wide text-gray-50">
                  {sectionLabel}
                  {viewMode !== 'kibble' && (
                    <>
                      <span aria-hidden className="text-gray-600">·</span>
                      <span className="text-green-400">{selectedMap}</span>
                    </>
                  )}
                </h1>

                {viewMode !== 'kibble' && (
                  <InlineMeter done={meter.done} total={meter.total} unit={meter.unit} />
                )}

                <div className="ml-auto flex items-center gap-2">
                  {viewMode === 'creatures' && (
                    <>
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
                      <label className="relative block w-40 sm:w-56">
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
                          className="w-full rounded-lg border border-gray-700/80 bg-ark-surface/80 py-2 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/25"
                        />
                      </label>
                    </>
                  )}

                  {(viewMode === 'notes' || viewMode === 'artifacts') && (
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
                  )}
                </div>
              </div>

              {/* Map-Auswahl (im Kibble-Modus map-unabhängig → ausgeblendet) */}
              {viewMode !== 'kibble' && (
                <MapTabs selected={selectedMap} onChange={handleMapChange} progress={mapProgress} />
              )}

              {/* Filter-Chips nur im Kreaturen-Modus */}
              {viewMode === 'creatures' && (
                <FilterBar
                  status={status}
                  difficulty={difficulty}
                  sort={sort}
                  resultCount={visibleDinos.length}
                  onStatus={setStatus}
                  onDifficulty={setDifficulty}
                  onSort={setSort}
                />
              )}
            </div>
          </div>
        </div>

        <main className="relative flex-1 space-y-5 px-4 pb-24 pt-5 sm:px-6 lg:pb-16">
          {storageError && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-yellow-600/50 bg-yellow-900/30 px-4 py-2 text-sm text-yellow-300"
            >
              <IconWarning size={16} />
              {storageError}
            </p>
          )}

          {viewMode === 'creatures' ? (
            tracker.loading ? (
              <Spinner label="Lade gespeicherte Zähmungen …" />
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
            )
          ) : viewMode === 'notes' ? (
            <>
              <p className="text-sm text-gray-400">
                Tippe eine Notiz an, um sie als <span className="text-green-300">gefunden</span> zu markieren.
                Die Koordinaten sind Richtwerte.
              </p>
              {explorer.loading ? (
                <Spinner label="Lade gefundene Notizen …" />
              ) : (
                <ExplorerNotesView
                  map={selectedMap}
                  isFound={explorer.isFound}
                  onToggleFound={handleToggleNote}
                  onOpenNote={setSelectedNote}
                  onlyOpen={onlyOpen}
                />
              )}
            </>
          ) : viewMode === 'bosses' ? (
            <>
              <p className="text-sm text-gray-400">
                Tippe eine Stufe (Gamma/Beta/Alpha) an, um sie als <span className="text-green-300">besiegt</span> zu
                markieren, oder öffne einen Boss für Tribut und Strategie.
              </p>
              {bossSet.loading ? (
                <Spinner label="Lade Boss-Fortschritt …" />
              ) : (
                <BossView
                  map={selectedMap}
                  isDefeated={bossSet.has}
                  onToggle={handleToggleBoss}
                  onOpenBoss={setSelectedBoss}
                />
              )}
            </>
          ) : viewMode === 'kibble' ? (
            <KibbleView />
          ) : (
            <>
              <p className="text-sm text-gray-400">
                Höhlen-Artefakte dienen als Boss-Tribut. Tippe eines an, um es als{' '}
                <span className="text-green-300">gefunden</span> zu markieren. Koordinaten sind Richtwerte.
              </p>
              {artifactSet.loading ? (
                <Spinner label="Lade Artefakt-Fortschritt …" />
              ) : (
                <ArtifactView
                  map={selectedMap}
                  isFound={artifactSet.has}
                  onToggle={handleToggleArtifact}
                  onOpen={setSelectedArtifact}
                  onlyOpen={onlyOpen}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Modus-Tab-Leiste */}
      <BottomNav viewMode={viewMode} onViewMode={handleViewMode} />

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

      {selectedBoss && (
        <BossModal
          boss={selectedBoss}
          isDefeated={bossSet.has}
          onToggle={(difficulty) => handleToggleBoss(selectedBoss, difficulty)}
          onClose={() => setSelectedBoss(null)}
        />
      )}

      {selectedArtifact && (
        <ArtifactModal
          artifact={selectedArtifact}
          found={artifactSet.has(selectedArtifact.id)}
          onToggle={() => handleToggleArtifact(selectedArtifact)}
          onClose={() => setSelectedArtifact(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
