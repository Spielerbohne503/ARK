import { useMemo } from 'react';
import { getNotesForMap } from '../data/explorerNotes';
import type { ExplorerNote, MapName } from '../types';
import { IconCheck, IconMapPin } from './icons';

interface ExplorerNotesViewProps {
  map: MapName;
  isFound: (noteId: string) => boolean;
  onToggleFound: (note: ExplorerNote) => void;
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
export function ExplorerNotesView({ map, isFound, onToggleFound, onlyOpen }: ExplorerNotesViewProps) {
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
      <p className="rounded-xl border border-gray-800 bg-ark-surface p-10 text-center text-gray-400">
        {onlyOpen
          ? 'Alle Erkunder-Notizen dieser Map sind eingesammelt.'
          : 'Für diese Map sind keine Erkunder-Notizen hinterlegt.'}
      </p>
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
            <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-gray-800 pb-2">
              <h3 className="font-display text-lg font-semibold text-gray-100">{group.explorer}</h3>
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
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => onToggleFound(note)}
                    aria-pressed={found}
                    style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
                    className={`group flex animate-fade-in-up items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      found
                        ? 'border-green-500/60 bg-green-900/80 hover:shadow-green-800/40'
                        : 'border-gray-700/80 bg-gray-800 hover:border-green-700/60'
                    }`}
                  >
                    {/* Nummer / gefunden-Häkchen */}
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-bold transition-colors ${
                        found
                          ? 'border-green-400/70 bg-green-500/90 text-gray-950'
                          : 'border-gray-600 bg-gray-950/60 text-gray-400 group-hover:text-green-300'
                      }`}
                    >
                      {found ? <IconCheck size={18} /> : note.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-100">{note.topic}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <IconMapPin size={13} className="shrink-0" />
                        Lat {note.coords.lat} · Lon {note.coords.lon}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
