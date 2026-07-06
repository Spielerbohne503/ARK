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
import { DINO_DATABASE, getDinosForMap } from '../data/dinoDatabase';
import { EXPLORER_NOTES, getNotesForMap } from '../data/explorerNotes';
import { KIBBLE } from '../data/kibble';
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
import { KibbleView } from './KibbleView';
import { CompletionBar } from './CompletionBar';
import { DinoDetailModal } from './DinoDetailModal';
import { DinoGrid } from './DinoGrid';
import { ExplorerNoteModal } from './ExplorerNoteModal';
import { ExplorerNotesView } from './ExplorerNotesView';
import { FilterBar, type DifficultyFilter, type SortOrder, type StatusFilter } from './FilterBar';
import { MapTabs } from './MapTabs';
import { Spinner } from './Spinner';
import { TamingPlanner } from './TamingPlanner';
import { ToastStack, type ToastData } from './Toast';
import { IconBook, IconDownload, IconDrumstick, IconGem, IconList, IconSearch, IconSkull, IconSwords, IconTrophy, IconUpload, IconWarning } from './icons';

type ViewMode = 'creatures' | 'notes' | 'bosses' | 'artifacts' | 'kibble';

/** Anzahl Dinos, die überhaupt eine Kibble-Stufe nutzen. */
const KIBBLE_NAMES = new Set(KIBBLE.map((k) => k.name));

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
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
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

  const completedMaps = useMemo(
    () =>
      MAPS.filter((map) => {
        const dinos = getDinosForMap(map);
        return dinos.length > 0 && tracker.countTamed(map, new Set(dinos.map((d) => d.id))) === dinos.length;
      }).length,
    [tracker],
  );

  // Gesamtfortschritt über alles: Zähm-Slots + Notizen + Boss-Siege.
  const totalDinoSlots = useMemo(
    () => MAPS.reduce((sum, map) => sum + getDinosForMap(map).length, 0),
    [],
  );
  const overallDone = tracker.records.size + explorer.found.size + bossSet.keys.size + artifactSet.keys.size;
  const overallTotal = totalDinoSlots + EXPLORER_NOTES.length + TOTAL_BOSS_KILLS + TOTAL_ARTIFACTS;
  const overallPercent = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;
  const overallPercentAnimated = useCountUp(overallPercent);

  // Hero-Stats mit Count-up.
  const speciesCount = useCountUp(DINO_DATABASE.length);
  const totalTames = useCountUp(tracker.records.size);
  const notesCount = useCountUp(EXPLORER_NOTES.length);
  const foundTotal = useCountUp(explorer.found.size);
  const bossKillTotal = useCountUp(bossSet.keys.size);
  const bossFightCount = useCountUp(TOTAL_BOSS_KILLS);
  const artifactsCount = useCountUp(TOTAL_ARTIFACTS);
  const artifactsFound = useCountUp(artifactSet.keys.size);
  const kibbleTierCount = useCountUp(KIBBLE.length);
  const kibbleTameCount = useCountUp(DINO_DATABASE.filter((d) => KIBBLE_NAMES.has(d.kibbleType)).length);
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

  return (
    <div className="relative min-h-screen bg-ark-bg font-body text-gray-100">
      {/* Film-Grain + ambiente Glows über der ganzen Seite */}
      <span aria-hidden className="grain-overlay" />
      <span aria-hidden className="pointer-events-none fixed -left-40 top-1/4 -z-0 h-96 w-96 animate-glow-pulse rounded-full bg-green-500/[0.05] blur-3xl" />
      <span aria-hidden className="pointer-events-none fixed -right-40 top-2/3 -z-0 h-96 w-96 animate-glow-pulse rounded-full bg-amber-500/[0.04] blur-3xl [animation-delay:3s]" />

      {/* Cinematic Hero */}
      <header className="relative overflow-hidden border-b border-gray-800/80">
        <div aria-hidden className="absolute inset-0 flex animate-float-slow opacity-20 blur-[2px]">
          {HERO_IMAGES.map((src) => (
            <img key={src} src={src} alt="" className="h-full w-1/3 object-cover" loading="eager" />
          ))}
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ark-bg via-ark-bg/85 to-ark-bg/40" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(10,14,18,0.92)_100%)]" />
        {/* dezenter grüner Lichtkegel von oben */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.1),transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
          <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-green-400/90">
            <span aria-hidden className="h-px w-6 bg-gradient-to-r from-transparent to-green-500/60" />
            <IconSkull size={18} />
            Survival Evolved Companion
            <span aria-hidden className="h-px w-6 bg-gradient-to-l from-transparent to-green-500/60" />
          </p>
          <h1 className="text-center font-display text-4xl font-bold tracking-wider text-gray-50 drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] sm:text-6xl">
            ARK{' '}
            <span className="bg-gradient-to-r from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(74,222,128,0.35)]">
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
              : viewMode === 'bosses'
                ? [
                    { value: bossFightCount, label: 'Boss-Kämpfe' },
                    { value: bossKillTotal, label: 'Besiegt' },
                    { value: completedMapsAnimated, label: 'Maps komplett' },
                  ]
                : viewMode === 'artifacts'
                  ? [
                      { value: artifactsCount, label: 'Artefakte' },
                      { value: artifactsFound, label: 'Gefunden' },
                      { value: completedMapsAnimated, label: 'Maps komplett' },
                    ]
                  : viewMode === 'kibble'
                    ? [
                        { value: kibbleTierCount, label: 'Kibble-Stufen' },
                        { value: kibbleTameCount, label: 'Kibble-Zähmungen' },
                        { value: speciesCount, label: 'Spezies' },
                      ]
                    : [
                        { value: speciesCount, label: 'Spezies' },
                        { value: totalTames, label: 'Zähmungen' },
                        { value: completedMapsAnimated, label: 'Maps komplett' },
                      ]
            ).map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center backdrop-blur-sm transition-colors hover:border-amber-400/20 sm:px-6"
              >
                <dd className="font-display text-3xl font-bold tabular-nums text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.25)] sm:text-4xl">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.15em] text-gray-500 sm:text-[11px]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>

          {/* Gesamtfortschritt über alle Sammel-Bereiche */}
          <div className="mx-auto mt-8 max-w-lg rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-sm">
            <div className="mb-2 flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.15em] sm:text-[11px]">
              <span className="text-gray-500">Gesamtfortschritt</span>
              <span className="font-mono tabular-nums text-green-300">
                {overallDone} / {overallTotal} · <span className="text-amber-300">{overallPercentAnimated}%</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Gesamtfortschritt"
              className="h-3 overflow-hidden rounded-full border border-black/40 bg-gray-950/60 shadow-inner"
            >
              <div
                className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-amber-400 transition-all duration-700 ease-out ${
                  overallPercent > 0 ? 'shadow-[0_0_12px_rgba(74,222,128,0.5)]' : ''
                }`}
                style={{ width: `${Math.max(overallPercent, 1.5)}%` }}
              >
                {overallPercent > 0 && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-1/4 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modus-Umschalter als Segmented-Navigation */}
      <div className="border-b border-gray-800/60 bg-ark-bg/60">
        <div className="scrollbar-hide mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex w-max gap-1 rounded-xl border border-gray-800/80 bg-ark-surface/50 p-1 shadow-inner">
          {([
            { mode: 'creatures', label: 'Kreaturen', icon: <IconSwords size={16} /> },
            { mode: 'notes', label: 'Erkunder-Notizen', icon: <IconBook size={16} /> },
            { mode: 'bosses', label: 'Bosse', icon: <IconTrophy size={16} /> },
            { mode: 'artifacts', label: 'Artefakte', icon: <IconGem size={16} /> },
            { mode: 'kibble', label: 'Kibble', icon: <IconDrumstick size={16} /> },
          ] as const).map((entry) => (
            <button
              key={entry.mode}
              type="button"
              onClick={() => setViewMode(entry.mode)}
              aria-pressed={viewMode === entry.mode}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                viewMode === entry.mode
                  ? 'bg-gradient-to-b from-green-500/20 to-green-500/10 text-green-200 shadow-glow-green ring-1 ring-green-400/40'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {entry.icon}
              {entry.label}
            </button>
          ))}
          </div>
        </div>
      </div>
{/* Sticky Glass-Toolbar: Map-Tabs + (im Kreaturen-Modus) Planer & Suche.
          Im Kibble-Modus (map-unabhängig) entfällt sie. */}
      {viewMode !== 'kibble' && (
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
                  className="w-full rounded-lg border border-gray-700/80 bg-ark-surface/80 py-2 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/25"
                />
              </label>
            </div>
          )}
        </div>
      </div>
      )}

      <main className="relative mx-auto max-w-7xl space-y-5 px-4 pb-16 pt-6 sm:px-6">
        {(tracker.storageError || explorer.storageError || bossSet.storageError || artifactSet.storageError) && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-yellow-600/50 bg-yellow-900/30 px-4 py-2 text-sm text-yellow-300"
          >
            <IconWarning size={16} />
            {tracker.storageError ?? explorer.storageError ?? bossSet.storageError ?? artifactSet.storageError}
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
            )}
          </>
        ) : viewMode === 'notes' ? (
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
              <Spinner label="Lade gefundene Notizen …" />
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
        ) : viewMode === 'bosses' ? (
          <>
            <CompletionBar
              map={selectedMap}
              tamed={bossDoneCount}
              total={mapBossKeys.size}
              unit="besiegt"
              completeText="Alle Bosse dieser Map besiegt."
            />

            <p className="rounded-xl border border-gray-800/80 bg-ark-surface/60 p-3.5 text-sm text-gray-400 sm:p-4">
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
            <CompletionBar
              map={selectedMap}
              tamed={artifactDoneCount}
              total={mapArtifacts.length}
              unit="gefunden"
              completeText="Alle Artefakte dieser Map gesammelt."
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800/80 bg-ark-surface/60 p-3.5 sm:p-4">
              <p className="text-sm text-gray-400">
                Höhlen-Artefakte dienen als Boss-Tribut. Tippe eines an, um es als{' '}
                <span className="text-green-300">gefunden</span> zu markieren. Koordinaten sind Richtwerte.
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

            {artifactSet.loading ? (
              <Spinner label="Lade Artefakt-Fortschritt …" />
            ) : (
              <ArtifactView
                map={selectedMap}
                isFound={artifactSet.has}
                onToggle={handleToggleArtifact}
                onOpen={setSelectedArtifact}
                onlyOpen={notesOnlyOpen}
              />
            )}
          </>
        )}
      </main>

      {/* Footer mit Sekundär-Navigation, Backup und Credits */}
      <footer className="relative border-t border-gray-800/80 bg-gray-950/60">
        {/* feiner Licht-Rand oben */}
        <span aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
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
