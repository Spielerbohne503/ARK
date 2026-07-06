import { useEffect, useRef, useState } from 'react';
import { bossKey, DIFFICULTY_LABEL, type Boss, type BossDifficulty } from '../data/bosses';
import { IconCheck, IconClose, IconCompass, IconSwords, IconTrophy } from './icons';

const DIFF_STYLE: Record<BossDifficulty, string> = {
  gamma: 'text-green-300 border-green-500/50',
  beta: 'text-yellow-300 border-yellow-500/50',
  alpha: 'text-red-300 border-red-500/50',
};

interface BossModalProps {
  boss: Boss;
  isDefeated: (key: string) => boolean;
  onToggle: (difficulty: BossDifficulty) => void;
  onClose: () => void;
}

/** Detail-Ansicht eines Bosses mit Tribut, Strategie und Sieg-Umschaltern. */
export function BossModal({ boss, isDefeated, onToggle, onClose }: BossModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Boss ${boss.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/70 ring-1 ring-white/[0.06] sm:animate-modal-in"
      >
        {/* Kopf mit Boss-Bild */}
        <div className="relative h-48 shrink-0 overflow-hidden bg-gray-900 sm:h-56">
          <img
            src={imageFailed ? '/dinos/placeholder.svg' : boss.imageUrl}
            alt={boss.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ark-surface via-black/20 to-black/30" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-950/80 text-gray-300 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            <IconClose size={18} />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h2 className="font-display text-2xl font-bold text-white drop-shadow-md">{boss.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-300">
              <IconCompass size={14} /> {boss.map} · {boss.arena}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-gray-300">{boss.description}</p>

          {/* Sieg-Umschalter pro Schwierigkeit */}
          <section aria-label="Schwierigkeitsstufen">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gray-300">
              <IconTrophy size={16} /> Besiegt
            </h3>
            <div className="flex flex-wrap gap-2">
              {boss.difficulties.map((d) => {
                const defeated = isDefeated(bossKey(boss.id, d));
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onToggle(d)}
                    aria-pressed={defeated}
                    className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      defeated
                        ? 'border-green-400/70 bg-green-500/90 text-gray-950'
                        : `bg-transparent ${DIFF_STYLE[d]} hover:bg-white/5`
                    }`}
                  >
                    {defeated && <IconCheck size={15} />}
                    {DIFFICULTY_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Zugang */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="mb-1.5 font-display text-xs uppercase tracking-widest text-gray-400">Zugang</h3>
            <p className="text-sm text-gray-300">{boss.access}</p>
          </section>

          {/* Tribut */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="mb-2 font-display text-xs uppercase tracking-widest text-gray-400">
              Tribut (Richtwerte, steigt je Stufe)
            </h3>
            <ul className="space-y-1.5">
              {boss.tribute.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Empfehlung */}
          <section className="rounded-xl border border-green-900/50 bg-green-950/20 p-4">
            <h3 className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-widest text-green-400">
              <IconSwords size={15} /> Empfohlene Strategie
            </h3>
            <p className="text-sm text-gray-300">{boss.recommended}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
