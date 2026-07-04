import { useState } from 'react';
import type { Difficulty, Dino } from '../types';

const DIFFICULTY_STYLE: Record<Difficulty, { label: string; classes: string }> = {
  easy: { label: 'Leicht', classes: 'bg-green-500/15 text-green-400 border-green-500/40' },
  medium: { label: 'Mittel', classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40' },
  hard: { label: 'Schwer', classes: 'bg-red-500/15 text-red-400 border-red-500/40' },
};

interface DinoCardProps {
  dino: Dino;
  tamed: boolean;
  onTogglePin: () => void;
  onOpenDetails: () => void;
}

/** Einzelne Dino-Karte mit Pin-Button; gezähmt = grün, ungezähmt = grau. */
export function DinoCard({ dino, tamed, onTogglePin, onOpenDetails }: DinoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const difficulty = DIFFICULTY_STYLE[dino.difficulty];

  return (
    <article
      className={`group relative cursor-pointer overflow-hidden rounded-xl border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        tamed
          ? 'border-green-600/60 bg-green-900 shadow-green-900/40'
          : 'border-gray-700 bg-gray-800 hover:border-gray-500'
      }`}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${dino.name} – Details anzeigen`}
    >
      {/* Pin-Button: markiert als gezähmt/ungezähmt, ohne das Modal zu öffnen */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        aria-pressed={tamed}
        aria-label={tamed ? `${dino.name} als ungezähmt markieren` : `${dino.name} als gezähmt markieren`}
        title={tamed ? 'Gezähmt – Klick zum Entfernen' : 'Als gezähmt pinnen'}
        className={`absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          tamed
            ? 'border-green-400 bg-green-600 shadow-green-900/60'
            : 'border-gray-600 bg-gray-900/80 opacity-80 backdrop-blur-sm hover:opacity-100'
        }`}
      >
        📍
      </button>

      {/* Bild mit lokalem SVG-Fallback, falls die externe Quelle nicht lädt */}
      <div className={`flex h-32 items-center justify-center overflow-hidden sm:h-36 ${tamed ? 'bg-green-950/60' : 'bg-gray-900/60'}`}>
        <img
          src={imageFailed ? '/dinos/placeholder.svg' : dino.imageUrl}
          alt={dino.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-tight text-gray-100">
            {dino.name}
          </h3>
          {tamed && <span className="shrink-0 text-green-400" title="Gezähmt">✓</span>}
        </div>

        <p className="truncate text-sm text-gray-400" title={dino.spawnLocations.join(', ')}>
          🗺️ {dino.spawnLocations.slice(0, 2).join(' · ')}
        </p>

        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficulty.classes}`}
        >
          {difficulty.label}
        </span>
      </div>
    </article>
  );
}
