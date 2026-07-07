import { useCallback, useEffect, useState } from 'react';
import { deleteFoundNote, getAllFoundNotes, putFoundNote } from '../lib/db';
import type { FoundNoteRecord } from '../types';

export interface ExplorerTracker {
  loading: boolean;
  storageError: string | null;
  found: ReadonlySet<string>;
  isFound: (noteId: string) => boolean;
  /** Anzahl gefundener Notizen aus der übergebenen ID-Menge. */
  countFound: (noteIds: Set<string>) => number;
  /** Umschalten, ob eine Notiz gefunden ist. Liefert den neuen Status. */
  toggleFound: (noteId: string) => boolean;
  /** Nur den React-State setzen (Cloud-Sync schreibt die DB separat). */
  hydrate: (foundKeys: string[]) => void;
}

/**
 * Tracking der Erkunder-Notizen: hält die gefundenen IDs im State, lädt sie
 * beim Mount aus IndexedDB und schreibt jede Änderung sofort zurück.
 */
export function useExplorerTracker(): ExplorerTracker {
  const [found, setFound] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllFoundNotes()
      .then((records) => {
        if (!cancelled) setFound(new Set(records.map((r) => r.key)));
      })
      .catch(() => {
        if (!cancelled) {
          setStorageError('Speicher nicht verfügbar – gefundene Notizen gehen beim Neuladen verloren.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isFound = useCallback((noteId: string) => found.has(noteId), [found]);

  const countFound = useCallback(
    (noteIds: Set<string>) => {
      let count = 0;
      found.forEach((id) => {
        if (noteIds.has(id)) count += 1;
      });
      return count;
    },
    [found],
  );

  const toggleFound = useCallback((noteId: string): boolean => {
    const nowFound = !found.has(noteId);
    setFound((prev) => {
      const next = new Set(prev);
      let persist: Promise<unknown>;
      if (nowFound) {
        next.add(noteId);
        const record: FoundNoteRecord = { key: noteId, foundDate: new Date().toISOString() };
        persist = putFoundNote(record);
      } else {
        next.delete(noteId);
        persist = deleteFoundNote(noteId);
      }
      persist.catch(() =>
        setStorageError('Speichern fehlgeschlagen – Status nur bis zum Neuladen aktiv.'),
      );
      return next;
    });
    return nowFound;
    // `found` wird über den Setter-Callback aktuell gehalten; bewusst nicht in Deps,
    // damit die Callback-Identität stabil bleibt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found]);

  const hydrate = useCallback((foundKeys: string[]) => setFound(new Set(foundKeys)), []);

  return { loading, storageError, found, isFound, countFound, toggleFound, hydrate };
}
