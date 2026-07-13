import { useEffect, useMemo, useRef, useState } from 'react';
import type { Artifact } from '../data/artifacts';
import { mapImage } from '../data/maps';
import { matchSpawnRegions } from '../data/regions';
import { RESOURCE_META, type ResourceDeposit, type ResourceType } from '../data/resources';
import type { Dino, ExplorerNote, MapName } from '../types';
import { IconCheck, IconCompass, IconGauge, IconGem, IconNote, IconSearch, IconSkull } from './icons';

const MIN_SCALE = 1;
const MAX_SCALE = 8;

interface InteractiveMapProps {
  map: MapName;
  notes: ExplorerNote[];
  artifacts: Artifact[];
  resources: ResourceDeposit[];
  /** Kreaturen der Map (für die Dino-Spawn-Ebene). */
  dinos: Dino[];
  isNoteFound: (id: string) => boolean;
  isArtifactFound: (id: string) => boolean;
  onOpenNote: (note: ExplorerNote) => void;
  onOpenArtifact: (artifact: Artifact) => void;
}

/**
 * Interaktive Karte 2.0: topografisches Kartenbild mit Zoom (Mausrad/Pinch/
 * Buttons), Verschieben per Drag sowie schaltbaren Ebenen – Erkunder-Notizen,
 * Artefakte, Ressourcen (nach Art filterbar), Höhlen-Eingänge (aus den
 * Artefakt-Höhlen abgeleitet) und Dino-Spawn-Regionen per Kreaturen-Suche.
 * Koordinaten: x = Longitude, y = Latitude (Richtwerte).
 */
export function InteractiveMap({
  map,
  notes,
  artifacts,
  resources,
  dinos,
  isNoteFound,
  isArtifactFound,
  onOpenNote,
  onOpenArtifact,
}: InteractiveMapProps) {
  const [showNotes, setShowNotes] = useState(true);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [showCaves, setShowCaves] = useState(false);
  const [showSpawns, setShowSpawns] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<ReadonlySet<ResourceType>>(new Set());
  const [spawnDinoId, setSpawnDinoId] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  // ── Zoom & Pan ──
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);
  const dragged = useRef(false);

  const clampView = (s: number, x: number, y: number) => {
    const el = containerRef.current;
    const size = el ? el.clientWidth : 0;
    const min = size - size * s;
    return { s, x: Math.min(0, Math.max(min, x)), y: Math.min(0, Math.max(min, y)) };
  };

  const zoomAt = (factor: number, cx: number, cy: number) => {
    setView((v) => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s * factor));
      if (s === v.s) return v;
      // Punkt unter dem Cursor beibehalten
      const px = (cx - v.x) / v.s;
      const py = (cy - v.y) / v.s;
      return clampView(s, cx - px * s, cy - py * s);
    });
  };

  const zoomCenter = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2);
  };

  // Mausrad-Zoom braucht einen nicht-passiven Listener (preventDefault).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 2) {
      // Pinch-Zoom um den Mittelpunkt der beiden Finger
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current > 0) {
        const el = containerRef.current;
        const rect = el?.getBoundingClientRect();
        if (rect) zoomAt(dist / pinchDist.current, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      }
      pinchDist.current = dist;
      dragged.current = true;
      return;
    }

    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;
    setView((v) => clampView(v.s, v.x + dx, v.y + dy));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchDist.current = 0;
  };

  // Nach einem Drag den Klick auf Pins unterdrücken.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
      dragged.current = false;
    }
  };

  // Map-Wechsel setzt die Ansicht zurück.
  useEffect(() => {
    setView({ s: 1, x: 0, y: 0 });
    setSpawnDinoId('');
    setImageFailed(false);
  }, [map]);

  // ── Ebenen-Daten ──
  const notesFound = notes.filter((n) => isNoteFound(n.id)).length;
  const artifactsFound = artifacts.filter((a) => isArtifactFound(a.id)).length;

  const resourceTypes = useMemo(() => [...new Set(resources.map((r) => r.type))], [resources]);
  const visibleResources = resources.filter((r) => !hiddenTypes.has(r.type));
  const toggleType = (type: ResourceType) =>
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  // Höhlen-Eingänge: eine Markierung pro Höhle (aus den Artefakt-Fundorten).
  const caves = useMemo(() => {
    const byName = new Map<string, { name: string; lat: number; lon: number }>();
    for (const a of artifacts) {
      if (!byName.has(a.cave)) byName.set(a.cave, { name: a.cave, lat: a.coords.lat, lon: a.coords.lon });
    }
    return [...byName.values()];
  }, [artifacts]);

  const sortedDinos = useMemo(() => [...dinos].sort((a, b) => a.name.localeCompare(b.name, 'de')), [dinos]);
  const spawnDino = sortedDinos.find((d) => d.id === spawnDinoId) ?? null;
  const spawnRegions = useMemo(
    () => (spawnDino ? matchSpawnRegions(map, spawnDino.spawnLocations) : []),
    [spawnDino, map],
  );

  const chip = (active: boolean, tone: string) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
      active ? tone : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
    }`;

  return (
    <div className="space-y-4">
      {/* Ebenen-Umschalter */}
      <div className="flex flex-wrap items-center gap-2">
        {notes.length > 0 && (
          <button type="button" aria-pressed={showNotes} onClick={() => setShowNotes((v) => !v)}
            className={chip(showNotes, 'border-green-500/60 bg-green-500/10 text-green-300')}>
            <IconNote size={14} /> Notizen
            <span className="font-mono tabular-nums opacity-80">{notesFound}/{notes.length}</span>
          </button>
        )}
        {artifacts.length > 0 && (
          <button type="button" aria-pressed={showArtifacts} onClick={() => setShowArtifacts((v) => !v)}
            className={chip(showArtifacts, 'border-amber-500/60 bg-amber-500/10 text-amber-300')}>
            <IconGem size={14} /> Artefakte
            <span className="font-mono tabular-nums opacity-80">{artifactsFound}/{artifacts.length}</span>
          </button>
        )}
        {caves.length > 0 && (
          <button type="button" aria-pressed={showCaves} onClick={() => setShowCaves((v) => !v)}
            className={chip(showCaves, 'border-stone-400/60 bg-stone-400/10 text-stone-200')}>
            <IconCompass size={14} /> Höhlen
            <span className="font-mono tabular-nums opacity-80">{caves.length}</span>
          </button>
        )}
        {resources.length > 0 && (
          <button type="button" aria-pressed={showResources} onClick={() => setShowResources((v) => !v)}
            className={chip(showResources, 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300')}>
            <IconGauge size={14} /> Ressourcen
            <span className="font-mono tabular-nums opacity-80">{resources.length}</span>
          </button>
        )}
        <button type="button" aria-pressed={showSpawns} onClick={() => setShowSpawns((v) => !v)}
          className={chip(showSpawns, 'border-rose-500/60 bg-rose-500/10 text-rose-300')}>
          <IconSkull size={14} /> Dino-Spawns
        </button>
        <p className="ml-auto hidden text-xs text-gray-500 sm:block">
          Mausrad/Pinch zoomt, Ziehen verschiebt, Klick auf Pins öffnet Details.
        </p>
      </div>

      {/* Ressourcen-Filter */}
      {showResources && resourceTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {resourceTypes.map((type) => {
            const meta = RESOURCE_META[type];
            const active = !hiddenTypes.has(type);
            return (
              <button key={type} type="button" aria-pressed={active} onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                  active ? meta.chip : 'border-gray-800 text-gray-600 hover:text-gray-400'
                }`}>
                <span aria-hidden className={`h-2 w-2 rotate-45 border ${active ? meta.pin : 'border-gray-700 bg-gray-800'}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Dino-Spawn-Suche */}
      {showSpawns && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-900/40 bg-rose-500/[0.04] p-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <IconSearch size={15} className="text-rose-300" />
            <span className="sr-only">Kreatur für Spawn-Anzeige wählen</span>
            <select
              value={spawnDinoId}
              onChange={(e) => setSpawnDinoId(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-rose-500"
            >
              <option value="">Kreatur wählen …</option>
              {sortedDinos.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          {spawnDino && (
            <p className="text-xs text-gray-400">
              Spawnt: <span className="text-rose-200">{spawnDino.spawnLocations.join(' · ')}</span>
              {spawnRegions.length === 0 && ' (keine Karten-Region zuordenbar)'}
            </p>
          )}
        </div>
      )}

      {/* Kartenfläche */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        className="relative mx-auto aspect-square w-full max-w-3xl touch-none select-none overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl shadow-black/50 ring-1 ring-white/[0.05]"
        style={{ cursor: view.s > 1 ? 'grab' : 'default' }}
      >
        {/* Zoombare Ebene: Bild + alle Pins bewegen sich gemeinsam */}
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: '0 0' }}
        >
          {imageFailed ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
              Kartenbild nicht verfügbar
            </div>
          ) : (
            <img
              src={mapImage(map)}
              alt={`Topografische Karte von ${map}`}
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

          {showResources &&
            visibleResources.map((res) => (
              <span
                key={res.id}
                title={`${RESOURCE_META[res.type].label} – ${res.spot}`}
                aria-label={`${RESOURCE_META[res.type].label} – ${res.spot}`}
                style={{ left: `${res.coords.lon}%`, top: `${res.coords.lat}%` }}
                className={`absolute z-[5] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-help border shadow-[0_0_6px_rgba(0,0,0,0.7)] transition-transform duration-200 hover:scale-150 ${RESOURCE_META[res.type].pin}`}
              />
            ))}

          {/* Höhlen-Eingänge */}
          {showCaves &&
            caves.map((cave) => (
              <span
                key={cave.name}
                title={`Höhle – ${cave.name}`}
                aria-label={`Höhle – ${cave.name}`}
                style={{ left: `${cave.lon}%`, top: `${cave.lat}%` }}
                className="absolute z-[6] flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-help items-center justify-center rounded-md border border-stone-300 bg-stone-800/90 text-stone-200 shadow-[0_0_6px_rgba(0,0,0,0.8)] transition-transform duration-200 hover:scale-125"
              >
                <IconCompass size={12} />
              </span>
            ))}

          {/* Dino-Spawn-Regionen */}
          {showSpawns &&
            spawnRegions.map((reg) => (
              <span
                key={reg.label}
                title={`${spawnDino?.name} – ${reg.label}`}
                aria-label={`${spawnDino?.name} – ${reg.label}`}
                style={{ left: `${reg.lon}%`, top: `${reg.lat}%` }}
                className="absolute z-[4] -translate-x-1/2 -translate-y-1/2"
              >
                <span className="block h-10 w-10 animate-glow-pulse rounded-full border-2 border-rose-400/70 bg-rose-500/25 shadow-[0_0_14px_rgba(244,63,94,0.5)]" />
              </span>
            ))}

          {showNotes &&
            notes.map((note) => {
              const found = isNoteFound(note.id);
              return (
                <MapPin key={note.id} x={note.coords.lon} y={note.coords.lat} found={found} tone="green"
                  label={`${note.explorer} #${note.number} – ${note.topic}`} onClick={() => onOpenNote(note)}>
                  {found ? <IconCheck size={12} /> : <IconNote size={12} />}
                </MapPin>
              );
            })}

          {showArtifacts &&
            artifacts.map((artifact) => {
              const found = isArtifactFound(artifact.id);
              return (
                <MapPin key={artifact.id} x={artifact.coords.lon} y={artifact.coords.lat} found={found} tone="amber"
                  label={`${artifact.name} – ${artifact.cave}`} onClick={() => onOpenArtifact(artifact)}>
                  {found ? <IconCheck size={12} /> : <IconGem size={12} />}
                </MapPin>
              );
            })}
        </div>

        {/* Zoom-Steuerung */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
          <button type="button" onClick={() => zoomCenter(1.5)} aria-label="Hineinzoomen"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-600 bg-gray-950/85 font-mono text-lg text-gray-200 backdrop-blur-sm transition-colors hover:border-green-500 hover:text-green-300">+</button>
          <button type="button" onClick={() => zoomCenter(1 / 1.5)} aria-label="Herauszoomen"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-600 bg-gray-950/85 font-mono text-lg text-gray-200 backdrop-blur-sm transition-colors hover:border-green-500 hover:text-green-300">−</button>
          {view.s > 1 && (
            <button type="button" onClick={() => setView({ s: 1, x: 0, y: 0 })} aria-label="Zoom zurücksetzen"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-600 bg-gray-950/85 font-mono text-[11px] text-gray-200 backdrop-blur-sm transition-colors hover:border-green-500 hover:text-green-300">1×</button>
          )}
        </div>
        {view.s > 1 && (
          <span className="absolute bottom-3 left-3 z-20 rounded-md border border-gray-700 bg-gray-950/85 px-2 py-0.5 font-mono text-[11px] text-gray-300 backdrop-blur-sm">
            {view.s.toFixed(1)}×
          </span>
        )}
      </div>
    </div>
  );
}

interface MapPinProps {
  x: number;
  y: number;
  found: boolean;
  tone: 'green' | 'amber';
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

const TONE = {
  green: {
    found: 'border-green-300 bg-green-500 text-gray-950 shadow-[0_0_10px_rgba(74,222,128,0.6)]',
    open: 'border-green-400/70 bg-gray-950/80 text-green-300',
  },
  amber: {
    found: 'border-amber-200 bg-amber-400 text-gray-950 shadow-[0_0_10px_rgba(251,191,36,0.6)]',
    open: 'border-amber-400/70 bg-gray-950/80 text-amber-300',
  },
} as const;

/** Einzelner Karten-Pin, zentriert auf (x, y) in Prozent. */
function MapPin({ x, y, found, tone, label, onClick, children }: MapPinProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:z-30 focus:outline-none"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all duration-200 hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-white/70 ${
          found ? TONE[tone].found : TONE[tone].open
        }`}
      >
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-700 bg-gray-950/95 px-2 py-1 text-[11px] text-gray-100 shadow-lg group-hover:block group-focus-visible:block"
      >
        {label}
      </span>
    </button>
  );
}
