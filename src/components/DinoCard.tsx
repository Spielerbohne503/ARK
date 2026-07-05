import { useRef, useState, type MouseEvent } from 'react';
import type { Difficulty, Dino } from '../types';
import { IconPin, IconPinFilled, IconStar, IconStarFilled } from './icons';

const DIFFICULTY_META: Record<Difficulty, { label: string; dot: string; strip: string }> = {
  easy: { label: 'Leicht', dot: 'bg-green-400', strip: 'from-green-500/70 to-green-500/0' },
  medium: { label: 'Mittel', dot: 'bg-yellow-400', strip: 'from-yellow-500/70 to-yellow-500/0' },
  hard: { label: 'Schwer', dot: 'bg-red-400', strip: 'from-red-500/70 to-red-500/0' },
};

const MAX_TILT_DEG = 5;

interface DinoCardProps {
  dino: Dino;
  tamed: boolean;
  favorite: boolean;
  /** Position im Grid – steuert die gestaffelte Einblend-Animation. */
  index: number;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onOpenDetails: () => void;
}

/** Bildgeführte Dino-Karte mit 3D-Tilt, Cursor-Spotlight, Pin- und Favoriten-Button. */
export function DinoCard({
  dino,
  tamed,
  favorite,
  index,
  onTogglePin,
  onToggleFavorite,
  onOpenDetails,
}: DinoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [pinPopping, setPinPopping] = useState(false);
  const [starPopping, setStarPopping] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const difficulty = DIFFICULTY_META[dino.difficulty];

  // 3D-Tilt + Spotlight via CSS-Variablen; nur für Maus-Pointer relevant,
  // Touch löst kein mousemove aus, prefers-reduced-motion wird via CSS entschärft.
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    card.style.setProperty('--tilt-x', `${(0.5 - y) * MAX_TILT_DEG}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * MAX_TILT_DEG}deg`);
    card.style.setProperty('--spot-x', `${x * 100}%`);
    card.style.setProperty('--spot-y', `${y * 100}%`);
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <article
      ref={cardRef}
      className={`tilt-card group relative animate-fade-in-up cursor-pointer overflow-hidden rounded-xl border shadow-lg transition-[border-color,box-shadow,background-color] duration-500 hover:shadow-2xl ${
        tamed
          ? 'border-green-500/60 bg-green-900 shadow-green-900/50 hover:shadow-green-700/40'
          : 'border-gray-700/80 bg-gray-800 hover:border-green-700/60 hover:shadow-black/60'
      }`}
      style={{ animationDelay: `${Math.min(index, 20) * 35}ms` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
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
      {/* Cursor-Spotlight */}
      <span aria-hidden className="spotlight pointer-events-none absolute inset-0 z-10" />

      {/* Schwierigkeits-Akzent an der Oberkante */}
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 z-10 h-0.5 bg-gradient-to-r ${difficulty.strip}`}
      />

      {/* Aktions-Buttons */}
      <div className="absolute right-2 top-2 z-20 flex gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setStarPopping(true);
            onToggleFavorite();
          }}
          onAnimationEnd={() => setStarPopping(false)}
          aria-pressed={favorite}
          aria-label={favorite ? `${dino.name} aus Favoriten entfernen` : `${dino.name} zu Favoriten`}
          title={favorite ? 'Favorit entfernen' : 'Als Nächstes zähmen'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 ${
            starPopping ? 'animate-pin-pop' : ''
          } ${
            favorite
              ? 'border-amber-400/70 bg-amber-500/20 text-amber-400'
              : 'border-gray-600/60 bg-gray-950/70 text-gray-400 opacity-80 hover:text-amber-300 hover:opacity-100'
          }`}
        >
          {favorite ? <IconStarFilled size={17} /> : <IconStar size={17} />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPinPopping(true);
            onTogglePin();
          }}
          onAnimationEnd={() => setPinPopping(false)}
          aria-pressed={tamed}
          aria-label={tamed ? `${dino.name} als ungezähmt markieren` : `${dino.name} als gezähmt markieren`}
          title={tamed ? 'Gezähmt – Klick zum Entfernen' : 'Als gezähmt pinnen'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 ${
            pinPopping ? 'animate-pin-pop' : ''
          } ${
            tamed
              ? 'border-green-300/70 bg-green-500/90 text-gray-950 ring-2 ring-green-400/40'
              : 'border-gray-600/60 bg-gray-950/70 text-gray-400 opacity-80 hover:text-green-300 hover:opacity-100'
          }`}
        >
          {tamed ? <IconPinFilled size={17} /> : <IconPin size={17} />}
        </button>
      </div>

      {/* Artwork mit Name-Overlay (Foto + minimales Text-Overlay) */}
      <div className="relative h-44 overflow-hidden bg-gray-900 sm:h-48">
        <img
          src={imageFailed ? '/dinos/placeholder.svg' : dino.imageUrl}
          alt={dino.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t via-black/10 to-black/25 transition-colors duration-500 ${
            tamed ? 'from-green-950/95' : 'from-gray-950/95'
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
          <h3 className="font-display text-lg font-bold leading-tight text-white drop-shadow-md transition-colors duration-300 group-hover:text-green-200">
            {dino.name}
          </h3>
          {tamed && (
            <span className="mb-0.5 shrink-0 animate-fade-in rounded-full border border-green-400/50 bg-green-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-300">
              Gezähmt
            </span>
          )}
        </div>
      </div>

      {/* Meta: Rollen-Tags + Schwierigkeit */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="flex min-w-0 flex-wrap gap-1">
          {dino.roles.slice(0, 2).map((role) => (
            <span
              key={role}
              className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${
                tamed
                  ? 'border-green-700/60 bg-green-950/50 text-green-300/90'
                  : 'border-gray-700 bg-gray-900/60 text-gray-400'
              }`}
            >
              {role}
            </span>
          ))}
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-gray-400">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${difficulty.dot}`} />
          {difficulty.label}
        </span>
      </div>
    </article>
  );
}
