import { useMemo, useState } from 'react';
import { getArtifactsForMap, type Artifact } from '../data/artifacts';
import type { MapName } from '../types';
import { IconCheck, IconGem, IconMapPin } from './icons';

function ArtifactImage({ artifact, className }: { artifact: Artifact; className: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? '/notes/placeholder.svg' : artifact.imageUrl}
      alt={artifact.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

interface ArtifactViewProps {
  map: MapName;
  isFound: (id: string) => boolean;
  onToggle: (artifact: Artifact) => void;
  onOpen: (artifact: Artifact) => void;
  onlyOpen: boolean;
}

/** Artefakt-Sammlung einer Map als Karten mit Bild, Höhle und gefunden-Toggle. */
export function ArtifactView({ map, isFound, onToggle, onOpen, onlyOpen }: ArtifactViewProps) {
  const all = useMemo(() => getArtifactsForMap(map), [map]);
  const visible = useMemo(
    () => (onlyOpen ? all.filter((a) => !isFound(a.id)) : all),
    [all, onlyOpen, isFound],
  );

  if (all.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-800 bg-ark-surface/60 p-12 text-center">
        <IconGem size={32} className="text-gray-600" />
        <p className="max-w-sm text-sm text-gray-400">
          Auf {map} gibt es keine klassischen Höhlen-Artefakte – hier wird über Missionen
          fortgeschritten.
        </p>
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-900/40 bg-green-950/20 p-12 text-center">
        <IconCheck size={32} className="text-green-400" />
        <p className="text-sm text-gray-300">Alle Artefakte dieser Map sind eingesammelt.</p>
      </div>
    );
  }

  return (
    <div key={map} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((artifact, index) => {
        const found = isFound(artifact.id);
        return (
          <article
            key={artifact.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(artifact)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(artifact);
              }
            }}
            aria-label={`${artifact.name} – Details`}
            style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
            className={`group flex animate-fade-in-up cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
              found ? 'border-green-500/60 bg-green-900/80' : 'border-gray-700/80 bg-gray-800 hover:border-green-700/60'
            }`}
          >
            <ArtifactImage
              artifact={artifact}
              className={`h-14 w-14 shrink-0 rounded-lg border object-contain p-1 transition-colors duration-200 ${
                found ? 'border-green-500/70 bg-green-950/40' : 'border-gray-700 bg-gray-950/40'
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-gray-100">
                {artifact.name.replace('Artifact of the ', '').replace('Artifact of ', '')}
              </span>
              <span className="mt-0.5 block truncate text-xs text-gray-400">{artifact.cave}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                <IconMapPin size={12} className="shrink-0" />
                Lat {artifact.coords.lat} · Lon {artifact.coords.lon}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(artifact);
              }}
              aria-pressed={found}
              aria-label={found ? 'Als nicht gefunden markieren' : 'Als gefunden markieren'}
              title={found ? 'Gefunden – Klick zum Zurücksetzen' : 'Als gefunden markieren'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 active:scale-95 ${
                found
                  ? 'border-green-400/70 bg-green-500/90 text-gray-950'
                  : 'border-gray-600 bg-gray-950/60 text-gray-500 hover:border-green-500/60 hover:text-green-300'
              }`}
            >
              <IconCheck size={16} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
