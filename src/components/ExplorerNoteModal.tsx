import { useEffect, useRef, useState } from 'react';
import { explorerImage, NOTE_PLACEHOLDER } from '../data/explorers';
import type { ExplorerNote } from '../types';
import { IconBook, IconCheck, IconClose, IconMapPin } from './icons';

interface ExplorerNoteModalProps {
  note: ExplorerNote;
  found: boolean;
  onToggleFound: () => void;
  onClose: () => void;
}

/** Detail-Ansicht einer Erkunder-Notiz mit vollem Inhaltstext. */
export function ExplorerNoteModal({ note, found, onToggleFound, onClose }: ExplorerNoteModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageFailed, setImageFailed] = useState(false);

  // ESC schließt, Fokus auf Close, Hintergrund-Scroll sperren.
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
        aria-label={`Notiz von ${note.explorer}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/60 sm:animate-modal-in"
      >
        {/* Kopf: Autor + Nummer */}
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
              src={imageFailed ? NOTE_PLACEHOLDER : explorerImage(note.explorer)}
              alt={note.explorer}
              onError={() => setImageFailed(true)}
              className="h-16 w-16 shrink-0 rounded-xl border border-gray-700 bg-gray-950/50 object-contain p-1"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-green-400/90">
                <IconBook size={16} />
                Erkunder-Notiz #{note.number}
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold leading-tight text-gray-100">
                {note.explorer}
              </h2>
              <p className="mt-1 text-sm text-gray-400">{note.topic}</p>
            </div>
          </div>
        </div>

        {/* Inhalt der Notiz */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <blockquote className="border-l-2 border-green-600/50 pl-4 font-body text-[15px] italic leading-relaxed text-gray-200">
            {note.content}
          </blockquote>
          <p className="mt-5 flex items-center gap-1.5 text-sm text-gray-400">
            <IconMapPin size={15} className="shrink-0 text-green-400/80" />
            Fundort (ca.): Lat {note.coords.lat} · Lon {note.coords.lon}
          </p>
        </div>

        {/* Gefunden-Umschalter */}
        <div className="shrink-0 border-t border-gray-800 p-3 sm:px-6">
          <button
            type="button"
            onClick={onToggleFound}
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
