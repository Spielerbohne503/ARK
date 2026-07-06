import { useEffect, useRef, useState } from 'react';
import type { Artifact } from '../data/artifacts';
import { IconCheck, IconClose, IconCompass, IconMapPin, IconTrophy } from './icons';

interface ArtifactModalProps {
  artifact: Artifact;
  found: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/** Detail-Ansicht eines Artefakts: Standort, wofür es gebraucht wird. */
export function ArtifactModal({ artifact, found, onToggle, onClose }: ArtifactModalProps) {
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
        aria-label={`Artefakt ${artifact.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/70 ring-1 ring-white/[0.06] sm:animate-modal-in"
      >
        <div className="relative shrink-0 border-b border-gray-800 bg-gradient-to-b from-gray-900 to-ark-surface p-5 sm:p-6">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-950/80 text-gray-300 transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            <IconClose size={18} />
          </button>
          <div className="flex items-center gap-4">
            <img
              src={imageFailed ? '/notes/placeholder.svg' : artifact.imageUrl}
              alt={artifact.name}
              onError={() => setImageFailed(true)}
              className="h-20 w-20 shrink-0 rounded-xl border border-gray-700 bg-gray-950/50 object-contain p-1.5"
            />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-green-400/90">Artefakt · {artifact.map}</p>
              <h2 className="mt-1 font-display text-xl font-bold leading-tight text-gray-100">{artifact.name}</h2>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-widest text-gray-400">
              <IconCompass size={15} /> Fundort
            </h3>
            <p className="text-sm text-gray-200">{artifact.cave}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
              <IconMapPin size={14} className="text-green-400/80" />
              Lat {artifact.coords.lat} · Lon {artifact.coords.lon} (ca.)
            </p>
          </div>

          <div className="rounded-xl border border-amber-900/40 bg-amber-500/[0.04] p-4">
            <h3 className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-widest text-amber-300">
              <IconTrophy size={15} /> Benötigt für
            </h3>
            <p className="text-sm text-gray-200">{artifact.usedFor}</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-800 p-3 sm:px-6">
          <button
            type="button"
            onClick={onToggle}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-display text-sm uppercase tracking-widest transition-all duration-200 active:scale-[0.98] ${
              found
                ? 'border-red-500/50 bg-red-900/40 text-red-300 hover:bg-red-900/70'
                : 'border-green-500/50 bg-green-900/60 text-green-300 hover:bg-green-800/80'
            }`}
          >
            <IconCheck size={16} />
            {found ? 'Als nicht gefunden markieren' : 'Als gefunden markieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
