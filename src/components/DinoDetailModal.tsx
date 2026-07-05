import { useEffect, useRef, useState } from 'react';
import { MAX_LEVEL, MIN_LEVEL, useTamingCalculator } from '../hooks/useTamingCalculator';
import { formatDate, formatMinutes, formatNumber } from '../lib/format';
import type { Dino, MapName, TamedRecord, TamingResult } from '../types';
import {
  IconBerry,
  IconClose,
  IconCompass,
  IconDrumstick,
  IconEgg,
  IconFlask,
  IconGauge,
  IconHeart,
  IconNote,
  IconPinFilled,
  IconSparkles,
  IconSwords,
  IconTimer,
} from './icons';

const DIFFICULTY_META: Record<Dino['difficulty'], { label: string; dot: string }> = {
  easy: { label: 'Leicht', dot: 'bg-green-400' },
  medium: { label: 'Mittel', dot: 'bg-yellow-400' },
  hard: { label: 'Schwer', dot: 'bg-red-400' },
};

const RESOURCE_ICON: Record<TamingResult['resources'][number]['icon'], JSX.Element> = {
  kibble: <IconSparkles size={20} />,
  food: <IconDrumstick size={20} />,
  narcotic: <IconFlask size={20} />,
  berry: <IconBerry size={20} />,
};

interface DinoDetailModalProps {
  dino: Dino;
  map: MapName;
  record: TamedRecord | undefined;
  note: string;
  onTogglePin: (level: number) => void;
  onUpdateLevel: (level: number) => void;
  onSaveNote: (text: string) => void;
  onClose: () => void;
}

/** Detail-Ansicht mit Taming-Calculator, Breeding-Infos, Notizen und Level-Edit. */
export function DinoDetailModal({
  dino,
  map,
  record,
  note,
  onTogglePin,
  onUpdateLevel,
  onSaveNote,
  onClose,
}: DinoDetailModalProps) {
  const [level, setLevel] = useState(record?.level ?? 150);
  const [noteDraft, setNoteDraft] = useState(note);
  const [imageFailed, setImageFailed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const taming = useTamingCalculator(dino, level);
  const tamed = record !== undefined;
  const difficulty = DIFFICULTY_META[dino.difficulty];

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
    const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(parsed)));
    setLevel(clamped);
    // Bei bereits gezähmten Dinos wird das Level direkt mitgespeichert.
    if (tamed) onUpdateLevel(clamped);
  };

  // Notiz mit Debounce speichern (Auto-Save beim Tippen).
  const handleNoteChange = (text: string) => {
    setNoteDraft(text);
    clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => onSaveNote(text), 600);
  };
  useEffect(() => () => clearTimeout(noteTimerRef.current), []);

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
        className="max-h-[92vh] w-full max-w-2xl animate-slide-up overflow-y-auto rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/60 sm:animate-modal-in"
      >
        {/* Kopfbereich: Dossier-Artwork mit Verlauf in den Modal-Body */}
        <div className="relative h-52 overflow-hidden bg-gray-900 sm:h-64">
          <img
            src={imageFailed ? '/dinos/placeholder.svg' : dino.imageUrl}
            alt={dino.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ark-surface via-transparent to-black/30"
          />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-950/80 text-gray-300 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            <IconClose size={18} />
          </button>
          {tamed && (
            <span className="absolute left-3 top-3 rounded-full border border-green-500/50 bg-green-950/80 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm">
              Gezähmt am {formatDate(record.tamedDate)} · Lv. {record.level}
            </span>
          )}
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {/* Titel + Basisinfos */}
          <header>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-bold text-gray-100">{dino.name}</h2>
              <span className="flex items-center gap-1.5 text-sm text-gray-300">
                <span aria-hidden className={`h-2 w-2 rounded-full ${difficulty.dot}`} />
                {difficulty.label}
              </span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-300">{dino.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dino.roles.map((role) => (
                <span
                  key={role}
                  className="rounded border border-gray-700 bg-gray-900/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-gray-300"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-sm text-gray-400">
              <IconCompass size={16} className="mt-0.5 shrink-0" />
              <span>
                Spawn auf {map}: {dino.spawnLocations.join(', ')}
              </span>
            </p>
          </header>

          {/* Base Stats */}
          <section aria-label="Basiswerte" className="grid grid-cols-3 gap-3">
            {[
              { icon: <IconHeart size={16} />, label: 'Health', value: formatNumber(dino.baseStats.health) },
              { icon: <IconSwords size={16} />, label: 'Damage', value: formatNumber(dino.baseStats.damage) },
              { icon: <IconGauge size={16} />, label: 'Speed', value: formatNumber(dino.baseStats.speed) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  {stat.icon}
                  {stat.label}
                </p>
                <p className="mt-1 font-mono text-lg text-gray-100">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* Taming Calculator */}
          <section aria-label="Taming Calculator" className="rounded-xl border border-green-900/60 bg-gray-900/50 p-4 sm:p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-green-400">
              <IconTimer size={16} />
              Taming Calculator
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
                  <p className="flex justify-center text-green-400/80">{RESOURCE_ICON[res.icon]}</p>
                  <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-green-300">
                    {formatNumber(res.amount)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{res.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-gray-300">
              <IconTimer size={15} className="text-green-400/80" />
              Geschätzte Zähmzeit:
              <span className="font-mono font-bold text-green-300">{taming.tamingTimeFormatted}</span>
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              Futter: {dino.tamingFood} · Kibble: {dino.kibbleType}
            </p>
          </section>

          {/* Breeding Info */}
          <section aria-label="Breeding" className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gray-300">
              <IconEgg size={16} />
              Breeding
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

          {/* Notizen */}
          <section aria-label="Notizen" className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gray-300">
              <IconNote size={16} />
              Notizen
            </h3>
            <textarea
              value={noteDraft}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={`Eigene Notizen zu ${dino.name} auf ${map} – z. B. Spawn-Koordinaten (Lat 35, Lon 78), Falle steht bei …`}
              rows={3}
              className="w-full resize-y rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-green-500"
            />
            <p className="mt-1.5 text-[11px] text-gray-600">Wird automatisch gespeichert.</p>
          </section>

          {/* Zähm-Status umschalten (übernimmt das aktuell eingestellte Level) */}
          <button
            type="button"
            onClick={() => onTogglePin(level)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-display text-sm uppercase tracking-widest transition-all duration-200 active:scale-[0.98] ${
              tamed
                ? 'border-red-500/50 bg-red-900/40 text-red-300 hover:bg-red-900/70'
                : 'border-green-500/50 bg-green-900/60 text-green-300 hover:bg-green-800/80'
            }`}
          >
            <IconPinFilled size={16} />
            {tamed ? 'Zähmung entfernen' : `Als gezähmt markieren (Lv. ${level})`}
          </button>
        </div>
      </div>
    </div>
  );
}
