import { useEffect, useRef, useState } from 'react';
import { MAX_LEVEL, MIN_LEVEL, useTamingCalculator } from '../hooks/useTamingCalculator';
import { formatDate, formatMinutes, formatNumber } from '../lib/format';
import type { Dino, MapName, TamedRecord } from '../types';

const DIFFICULTY_LABEL: Record<Dino['difficulty'], string> = {
  easy: '🟢 Leicht',
  medium: '🟡 Mittel',
  hard: '🔴 Schwer',
};

interface DinoDetailModalProps {
  dino: Dino;
  map: MapName;
  record: TamedRecord | undefined;
  onTogglePin: (level: number) => void;
  onClose: () => void;
}

/** Detail-Ansicht mit Taming-Calculator und Breeding-Infos. */
export function DinoDetailModal({ dino, map, record, onTogglePin, onClose }: DinoDetailModalProps) {
  const [level, setLevel] = useState(record?.level ?? 150);
  const [imageFailed, setImageFailed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const taming = useTamingCalculator(dino, level);
  const tamed = record !== undefined;

  // ESC schließt das Modal; Fokus startet auf dem Close-Button.
  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Hintergrund-Scroll sperren, solange das Modal offen ist.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleLevelInput = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setLevel(Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(parsed))));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details zu ${dino.name}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl animate-modal-in overflow-y-auto rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl"
      >
        {/* Kopfbereich mit Bild */}
        <div className="relative flex h-44 items-center justify-center bg-gradient-to-b from-gray-900 to-ark-surface sm:h-52">
          <img
            src={imageFailed ? '/dinos/placeholder.svg' : dino.imageUrl}
            alt={dino.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-4"
          />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-900/80 text-xl text-gray-300 transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            ✕
          </button>
          {tamed && (
            <span className="absolute left-3 top-3 rounded-full border border-green-500/50 bg-green-900/80 px-3 py-1 text-xs font-medium text-green-300">
              ✓ Gezähmt am {formatDate(record.tamedDate)} (Lv. {record.level})
            </span>
          )}
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {/* Titel + Basisinfos */}
          <header>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-bold text-gray-100">{dino.name}</h2>
              <span className="text-sm text-gray-300">{DIFFICULTY_LABEL[dino.difficulty]}</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              🗺️ Spawn auf {map}: {dino.spawnLocations.join(', ')}
            </p>
          </header>

          {/* Base Stats */}
          <section aria-label="Basiswerte" className="grid grid-cols-3 gap-3">
            {[
              { label: '❤️ Health', value: formatNumber(dino.baseStats.health) },
              { label: '⚔️ Damage', value: formatNumber(dino.baseStats.damage) },
              { label: '💨 Speed', value: formatNumber(dino.baseStats.speed) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-center">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="mt-1 font-mono text-lg text-gray-100">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* Taming Calculator */}
          <section aria-label="Taming Calculator" className="rounded-xl border border-green-900/60 bg-gray-900/50 p-4 sm:p-5">
            <h3 className="mb-4 font-display text-sm uppercase tracking-widest text-green-400">
              ⚡ Taming Calculator
            </h3>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label htmlFor="level-input" className="shrink-0 text-sm text-gray-300">
                Wild-Level
              </label>
              <input
                type="range"
                min={MIN_LEVEL}
                max={MAX_LEVEL}
                value={level}
                onChange={(e) => handleLevelInput(e.target.value)}
                className="w-full accent-green-500"
                aria-label={`Wild-Level Schieberegler, aktuell ${level}`}
              />
              <input
                id="level-input"
                type="number"
                min={MIN_LEVEL}
                max={MAX_LEVEL}
                value={level}
                onChange={(e) => handleLevelInput(e.target.value)}
                className="w-20 shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center font-mono text-green-300 outline-none focus:border-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {taming.resources.map((res) => (
                <div key={res.label} className="rounded-lg border border-gray-800 bg-ark-surface p-3 text-center">
                  <p className="text-lg">{res.icon}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-green-300">
                    {formatNumber(res.amount)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{res.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-sm text-gray-300">
              ⏱️ Geschätzte Zähmzeit:{' '}
              <span className="font-mono font-bold text-green-300">{taming.tamingTimeFormatted}</span>
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              Futter: {dino.tamingFood} · Kibble: {dino.kibbleType}
            </p>
          </section>

          {/* Breeding Info */}
          <section aria-label="Breeding" className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
            <h3 className="mb-3 font-display text-sm uppercase tracking-widest text-gray-300">
              🥚 Breeding
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                <p className="text-xs text-gray-500">Paarungsintervall</p>
                <p className="mt-1 font-mono text-gray-100">{formatMinutes(dino.breedingInterval)}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-ark-surface p-3">
                <p className="text-xs text-gray-500">Ei-Brutzeit</p>
                <p className="mt-1 font-mono text-gray-100">
                  {dino.eggIncubationTime > 0 ? formatMinutes(dino.eggIncubationTime) : 'Lebendgeburt'}
                </p>
              </div>
            </div>
          </section>

          {/* Zähm-Status umschalten (übernimmt das aktuell eingestellte Level) */}
          <button
            type="button"
            onClick={() => onTogglePin(level)}
            className={`w-full rounded-xl border px-4 py-3 font-display text-sm uppercase tracking-widest transition-all duration-200 active:scale-[0.98] ${
              tamed
                ? 'border-red-500/50 bg-red-900/40 text-red-300 hover:bg-red-900/70'
                : 'border-green-500/50 bg-green-900/60 text-green-300 hover:bg-green-800/80'
            }`}
          >
            {tamed ? '📍 Zähmung entfernen' : `📍 Als gezähmt markieren (Lv. ${level})`}
          </button>
        </div>
      </div>
    </div>
  );
}
