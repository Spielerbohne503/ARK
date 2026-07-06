import { useMemo, useState } from 'react';
import { getNotesForMap } from '../data/explorerNotes';
import { explorerImage, NOTE_PLACEHOLDER } from '../data/explorers';
import type { ExplorerNote, MapName } from '../types';
import { IconCheck, IconMapPin } from './icons';

/** Autor-Bild (Note-Icon) mit lokalem SVG-Fallback. */
function NoteAvatar({ explorer, className }: { explorer: string; className: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? NOTE_PLACEHOLDER : explorerImage(explorer)}
      alt={explorer}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

interface ExplorerNotesViewProps {
  map: MapName;
  isFound: (noteId: string) => boolean;
  onToggleFound: (note: ExplorerNote) => void;
  /** Öffnet die Detail-Ansicht mit dem Notiz-Inhalt. */
  onOpenNote: (note: ExplorerNote) => void;
  /** Nur ungefundene anzeigen? */
  onlyOpen: boolean;
}

/** Notizen nach Erkunder gruppieren, Reihenfolge der Autoren beibehalten. */
function groupByExplorer(notes: ExplorerNote[]): { explorer: string; notes: ExplorerNote[] }[] {
  const groups: { explorer: string; notes: ExplorerNote[] }[] = [];
  for (const note of notes) {
    let group = groups.find((g) => g.explorer === note.explorer);
    if (!group) {
      group = { explorer: note.explorer, notes: [] };
      groups.push(group);
    }
    group.notes.push(note);
  }
  return groups;
}

/** Sammel-Ansicht der Erkunder-Notizen einer Map, gruppiert nach Autor. */
export function ExplorerNotesView({
  map,
  isFound,
  onToggleFound,
  onOpenNote,
  onlyOpen,
}: ExplorerNotesViewProps) {
  const groups = useMemo(() => groupByExplorer(getNotesForMap(map)), [map]);

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, notes: onlyOpen ? g.notes.filter((n) => !isFound(n.id)) : g.notes }))
        .filter((g) => g.notes.length > 0),
    [groups, onlyOpen, isFound],
  );

  if (visibleGroups.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-3 rounded-xl border p-12 text-center ${onlyOpen ? 'border-green-900/40 bg-green-950/20' : 'border-gray-800 bg-ark-surface/60'}`}>
        {onlyOpen ? <IconCheck size={32} className="text-green-400" /> : <IconMapPin size={32} className="text-gray-600" />}
        <p className="text-sm text-gray-300">
          {onlyOpen
            ? 'Alle Erkunder-Notizen dieser Map sind eingesammelt.'
            : 'Für diese Map sind keine Erkunder-Notizen hinterlegt.'}
        </p>
      </div>
    );
  }

  return (
    <div key={map} className="space-y-6">
      {visibleGroups.map((group) => {
        const foundInGroup = groups
          .find((g) => g.explorer === group.explorer)!
          .notes.filter((n) => isFound(n.id)).length;
        const totalInGroup = groups.find((g) => g.explorer === group.explorer)!.notes.length;
        return (
          <section key={group.explorer} aria-label={`Notizen von ${group.explorer}`}>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
              <div className="flex items-center gap-3">
                <NoteAvatar
                  explorer={group.explorer}
                  className="h-10 w-10 shrink-0 rounded-lg border border-gray-700 bg-gray-950/40 object-contain p-0.5"
                />
                <h3 className="font-display text-lg font-semibold text-gray-100">{group.explorer}</h3>
              </div>
              <span
                className={`shrink-0 font-mono text-sm tabular-nums ${
                  foundInGroup === totalInGroup ? 'text-amber-400' : 'text-gray-500'
                }`}
              >
                {foundInGroup}/{totalInGroup}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {group.notes.map((note, index) => {
                const found = isFound(note.id);
                return (
                  <article
                    key={note.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenNote(note)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenNote(note);
                      }
                    }}
                    aria-label={`Notiz ${note.number} von ${note.explorer}: ${note.topic}`}
                    style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
                    className={`group flex animate-fade-in-up cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      found
                        ? 'border-green-500/60 bg-green-900/80 hover:shadow-green-800/40'
                        : 'border-gray-700/80 bg-gray-800 hover:border-green-700/60'
                    }`}
                  >
                    {/* Autor-Bild (Note-Icon), Nummer als Badge, grüner Rahmen wenn gefunden */}
                    <div className="relative shrink-0">
                      <NoteAvatar
                        explorer={note.explorer}
                        className={`h-12 w-12 rounded-lg border object-contain p-0.5 transition-colors duration-200 ${
                          found ? 'border-green-500/70 bg-green-950/40' : 'border-gray-700 bg-gray-950/40'
                        }`}
                      />
                      <span
                        aria-hidden
                        className={`absolute -bottom-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1 font-mono text-[10px] font-bold ${
                          found
                            ? 'border-green-400/70 bg-green-500 text-gray-950'
                            : 'border-gray-600 bg-gray-950 text-gray-300'
                        }`}
                      >
                        {found ? <IconCheck size={12} /> : note.number}
                      </span>
                    </div>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-100">{note.topic}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <IconMapPin size={13} className="shrink-0" />
                        Lat {note.coords.lat} · Lon {note.coords.lon}
                      </span>
                    </span>

                    {/* Gefunden-Umschalter */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFound(note);
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
          </section>
        );
      })}
    </div>
  );
}
