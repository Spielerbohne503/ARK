import { useState } from 'react';
import type { Artifact } from '../data/artifacts';
import { mapImage } from '../data/maps';
import type { ExplorerNote, MapName } from '../types';
import { IconCheck, IconGem, IconNote } from './icons';

interface InteractiveMapProps {
  map: MapName;
  notes: ExplorerNote[];
  artifacts: Artifact[];
  isNoteFound: (id: string) => boolean;
  isArtifactFound: (id: string) => boolean;
  onOpenNote: (note: ExplorerNote) => void;
  onOpenArtifact: (artifact: Artifact) => void;
}

/**
 * Interaktive Karte: das topografische Kartenbild der Map mit anklickbaren
 * Pins für Erkunder-Notizen und Artefakte (Position aus den GPS-Koordinaten:
 * x = Longitude, y = Latitude). Gefundene Ziele sind ausgefüllt, offene
 * umrandet. Klick öffnet das jeweilige Detail-Modal.
 */
export function InteractiveMap({
  map,
  notes,
  artifacts,
  isNoteFound,
  isArtifactFound,
  onOpenNote,
  onOpenArtifact,
}: InteractiveMapProps) {
  const [showNotes, setShowNotes] = useState(true);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const notesFound = notes.filter((n) => isNoteFound(n.id)).length;
  const artifactsFound = artifacts.filter((a) => isArtifactFound(a.id)).length;

  return (
    <div className="space-y-4">
      {/* Ebenen-Umschalter + Legende */}
      <div className="flex flex-wrap items-center gap-2">
        {notes.length > 0 && (
          <button
            type="button"
            aria-pressed={showNotes}
            onClick={() => setShowNotes((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              showNotes
                ? 'border-green-500/60 bg-green-500/10 text-green-300'
                : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <IconNote size={14} />
            Notizen
            <span className="font-mono tabular-nums opacity-80">
              {notesFound}/{notes.length}
            </span>
          </button>
        )}
        {artifacts.length > 0 && (
          <button
            type="button"
            aria-pressed={showArtifacts}
            onClick={() => setShowArtifacts((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              showArtifacts
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <IconGem size={14} />
            Artefakte
            <span className="font-mono tabular-nums opacity-80">
              {artifactsFound}/{artifacts.length}
            </span>
          </button>
        )}
        <p className="ml-auto text-xs text-gray-500">Klick auf einen Pin öffnet die Details.</p>
      </div>

      {/* Kartenfläche mit Pins */}
      <div className="relative mx-auto aspect-square w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl shadow-black/50 ring-1 ring-white/[0.05]">
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
        {/* leichte Abdunklung für besseren Pin-Kontrast */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

        {showNotes &&
          notes.map((note) => {
            const found = isNoteFound(note.id);
            return (
              <MapPin
                key={note.id}
                x={note.coords.lon}
                y={note.coords.lat}
                found={found}
                tone="green"
                label={`${note.explorer} #${note.number} – ${note.topic}`}
                onClick={() => onOpenNote(note)}
              >
                {found ? <IconCheck size={12} /> : <IconNote size={12} />}
              </MapPin>
            );
          })}

        {showArtifacts &&
          artifacts.map((artifact) => {
            const found = isArtifactFound(artifact.id);
            return (
              <MapPin
                key={artifact.id}
                x={artifact.coords.lon}
                y={artifact.coords.lat}
                found={found}
                tone="amber"
                label={`${artifact.name} – ${artifact.cave}`}
                onClick={() => onOpenArtifact(artifact)}
              >
                {found ? <IconCheck size={12} /> : <IconGem size={12} />}
              </MapPin>
            );
          })}
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
      {/* Tooltip bei Hover/Fokus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-700 bg-gray-950/95 px-2 py-1 text-[11px] text-gray-100 shadow-lg group-hover:block group-focus-visible:block"
      >
        {label}
      </span>
    </button>
  );
}
