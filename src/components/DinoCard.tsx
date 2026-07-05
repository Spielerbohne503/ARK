import { useState } from 'react';
import type { Difficulty, Dino } from '../types';

const DIFFICULTY_STYLE: Record<
  Difficulty,
  { label: string; badge: string; strip: string }
> = {
  easy: {
    label: 'Leicht',
    badge: 'bg-green-500/15 text-green-400 border-green-500/40',
    strip: 'from-green-500/80 to-green-500/0',
  },
  medium: {
    label: 'Mittel',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    strip: 'from-yellow-500/80 to-yellow-500/0',
  },
  hard: {
    label: 'Schwer',
    badge: 'bg-red-500/15 text-red-400 border-red-500/40',
    strip: 'from-red-500/80 to-red-500/0',
  },
};

interface DinoCardProps {
  dino: Dino;
  tamed: boolean;
  /** Position im Grid – steuert die gestaffelte Einblend-Animation. */
  index: number;
  onTogglePin: () => void;
  onOpenDetails: () => void;
}

/** Einzelne Dino-Karte mit Pin-Button; gezähmt = grün, ungezähmt = grau. */
export function DinoCard({ dino, tamed, index, onTogglePin, onOpenDetails }: DinoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [pinPopping, setPinPopping] = useState(false);
  const difficulty = DIFFICULTY_STYLE[dino.difficulty];

  const handlePin = () => {
    setPinPopping(true);
    onTogglePin();
  };

  return (
    <article
      className={`group relative animate-fade-in-up cursor-pointer overflow-hidden rounded-xl border shadow-lg transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl ${
        tamed
          ? 'border-green-500/60 bg-green-900 shadow-green-900/50 hover:shadow-green-700/40'
          : 'border-gray-700 bg-gray-800 hover:border-green-700/60 hover:shadow-black/60'
      }`}
      style={{ animationDelay: `${Math.min(index, 20) * 35}ms` }}
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
      {/* Schwierigkeits-Akzent an der Oberkante */}
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r ${difficulty.strip}`}
      />

      {/* Pin-Button: markiert als gezähmt/ungezähmt, ohne das Modal zu öffnen */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePin();
        }}
        onAnimationEnd={() => setPinPopping(false)}
        aria-pressed={tamed}
        aria-label={tamed ? `${dino.name} als ungezähmt markieren` : `${dino.name} als gezähmt markieren`}
        title={tamed ? 'Gezähmt – Klick zum Entfernen' : 'Als gezähmt pinnen'}
        className={`absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 ${
          pinPopping ? 'animate-pin-pop' : ''
        } ${
          tamed
            ? 'border-green-300/70 bg-green-500/90 shadow-green-950/70 ring-2 ring-green-400/40'
            : 'border-gray-500/60 bg-gray-950/70 opacity-80 grayscale hover:opacity-100 hover:grayscale-0'
        }`}
      >
        📍
      </button>

      {/* Dossier-Artwork mit Overlay, das ins Karteninnere übergeht */}
      <div className="relative h-40 overflow-hidden bg-gray-900">
        <img
          src={imageFailed ? '/dinos/placeholder.svg' : dino.imageUrl}
          alt={dino.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
            tamed ? 'saturate-[1.1]' : ''
          }`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent transition-colors duration-500 ${
            tamed ? 'from-green-900' : 'from-gray-800'
          }`}
        />
        {tamed && (
          <span className="absolute bottom-2 left-2 animate-fade-in rounded-full border border-green-400/50 bg-green-950/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-green-300 backdrop-blur-sm">
            ✓ Gezähmt
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="font-display text-base font-semibold leading-tight text-gray-100 transition-colors duration-300 group-hover:text-green-300">
          {dino.name}
        </h3>

        <p className="truncate text-sm text-gray-400" title={dino.spawnLocations.join(', ')}>
          🗺️ {dino.spawnLocations.slice(0, 2).join(' · ')}
        </p>

        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficulty.badge}`}
        >
          {difficulty.label}
        </span>
      </div>
    </article>
  );
}
