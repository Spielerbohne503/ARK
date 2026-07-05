import { useCallback, useEffect, useState } from 'react';
import {
  deleteFavorite,
  deleteNote,
  deleteTamed,
  getAllFavorites,
  getAllNotes,
  getAllTamed,
  putFavorite,
  putNote,
  putTamed,
} from '../lib/db';
import type { MapName, NoteRecord, TamedRecord } from '../types';

const keyOf = (map: MapName, dinoId: string) => `${map}:${dinoId}`;

export interface DinoTracker {
  /** true solange der initiale Load aus IndexedDB läuft. */
  loading: boolean;
  /** Fehlermeldung, falls IndexedDB nicht verfügbar ist (App läuft dann in-memory weiter). */
  storageError: string | null;
  records: ReadonlyMap<string, TamedRecord>;
  favorites: ReadonlySet<string>;
  notes: ReadonlyMap<string, NoteRecord>;
  isTamed: (map: MapName, dinoId: string) => boolean;
  isFavorite: (map: MapName, dinoId: string) => boolean;
  getRecord: (map: MapName, dinoId: string) => TamedRecord | undefined;
  getNote: (map: MapName, dinoId: string) => string;
  /** Anzahl gezähmter Dinos auf einer Map (nur IDs aus `validIds` zählen). */
  countTamed: (map: MapName, validIds: Set<string>) => number;
  /** Pin-Klick: Zähm-Status umschalten, Auto-Save. Liefert den neuen Status. */
  toggleTamed: (map: MapName, dinoId: string, level?: number) => boolean;
  toggleFavorite: (map: MapName, dinoId: string) => boolean;
  /** Level eines bereits gezähmten Dinos nachträglich ändern. */
  updateLevel: (map: MapName, dinoId: string, level: number) => void;
  /** Notiz speichern (leerer Text löscht den Eintrag). */
  saveNote: (map: MapName, dinoId: string, text: string) => void;
  /** Kompletten Zustand ersetzen (nach Backup-Import). */
  replaceAll: (tamed: TamedRecord[], favoriteKeys: string[], noteRecords: NoteRecord[]) => void;
}

/**
 * Zentrale Tracker-Logik: hält Zähm-Einträge, Favoriten und Notizen im State
 * (keyed by `${map}:${dinoId}`), lädt sie beim Mount aus IndexedDB und
 * schreibt jede Änderung sofort zurück (optimistic update).
 */
export function useDinoTracker(): DinoTracker {
  const [records, setRecords] = useState<ReadonlyMap<string, TamedRecord>>(new Map());
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(new Set());
  const [notes, setNotes] = useState<ReadonlyMap<string, NoteRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  const reportError = useCallback((message: string) => setStorageError(message), []);

  // Auto-Load beim Start der App.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllTamed(), getAllFavorites(), getAllNotes()])
      .then(([tamed, favs, allNotes]) => {
        if (cancelled) return;
        setRecords(new Map(tamed.map((r) => [r.key, r])));
        setFavorites(new Set(favs.map((f) => f.key)));
        setNotes(new Map(allNotes.map((n) => [n.key, n])));
      })
      .catch(() => {
        if (!cancelled) {
          reportError('Speicher nicht verfügbar – Änderungen gehen beim Neuladen verloren.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportError]);

  const persistCatch = useCallback(
    (promise: Promise<unknown>) => {
      promise.catch(() =>
        reportError('Speichern fehlgeschlagen – Status nur bis zum Neuladen aktiv.'),
      );
    },
    [reportError],
  );

  const isTamed = useCallback(
    (map: MapName, dinoId: string) => records.has(keyOf(map, dinoId)),
    [records],
  );
  const isFavorite = useCallback(
    (map: MapName, dinoId: string) => favorites.has(keyOf(map, dinoId)),
    [favorites],
  );
  const getRecord = useCallback(
    (map: MapName, dinoId: string) => records.get(keyOf(map, dinoId)),
    [records],
  );
  const getNote = useCallback(
    (map: MapName, dinoId: string) => notes.get(keyOf(map, dinoId))?.text ?? '',
    [notes],
  );

  const countTamed = useCallback(
    (map: MapName, validIds: Set<string>) => {
      let count = 0;
      records.forEach((record) => {
        if (record.map === map && validIds.has(record.dinoId)) count += 1;
      });
      return count;
    },
    [records],
  );

  const toggleTamed = useCallback(
    (map: MapName, dinoId: string, level = 1): boolean => {
      const key = keyOf(map, dinoId);
      const nowTamed = !records.has(key);

      setRecords((prev) => {
        const next = new Map(prev);
        if (nowTamed) {
          const record: TamedRecord = {
            key,
            dinoId,
            map,
            tamedDate: new Date().toISOString(),
            level,
          };
          next.set(key, record);
          persistCatch(putTamed(record));
        } else {
          next.delete(key);
          persistCatch(deleteTamed(key));
        }
        return next;
      });
      return nowTamed;
    },
    [records, persistCatch],
  );

  const toggleFavorite = useCallback(
    (map: MapName, dinoId: string): boolean => {
      const key = keyOf(map, dinoId);
      const nowFavorite = !favorites.has(key);

      setFavorites((prev) => {
        const next = new Set(prev);
        if (nowFavorite) {
          next.add(key);
          persistCatch(putFavorite(key));
        } else {
          next.delete(key);
          persistCatch(deleteFavorite(key));
        }
        return next;
      });
      return nowFavorite;
    },
    [favorites, persistCatch],
  );

  const updateLevel = useCallback(
    (map: MapName, dinoId: string, level: number) => {
      const key = keyOf(map, dinoId);
      setRecords((prev) => {
        const existing = prev.get(key);
        if (!existing) return prev;
        const next = new Map(prev);
        const record = { ...existing, level };
        next.set(key, record);
        persistCatch(putTamed(record));
        return next;
      });
    },
    [persistCatch],
  );

  const saveNote = useCallback(
    (map: MapName, dinoId: string, text: string) => {
      const key = keyOf(map, dinoId);
      const trimmed = text.trim();
      setNotes((prev) => {
        const next = new Map(prev);
        if (trimmed === '') {
          next.delete(key);
          persistCatch(deleteNote(key));
        } else {
          const record: NoteRecord = { key, text, updatedAt: new Date().toISOString() };
          next.set(key, record);
          persistCatch(putNote(record));
        }
        return next;
      });
    },
    [persistCatch],
  );

  const replaceAll = useCallback(
    (tamed: TamedRecord[], favoriteKeys: string[], noteRecords: NoteRecord[]) => {
      setRecords(new Map(tamed.map((r) => [r.key, r])));
      setFavorites(new Set(favoriteKeys));
      setNotes(new Map(noteRecords.map((n) => [n.key, n])));
      // Import persistieren (bestehende Keys werden überschrieben)
      persistCatch(
        Promise.all([
          ...tamed.map((r) => putTamed(r)),
          ...favoriteKeys.map((k) => putFavorite(k)),
          ...noteRecords.map((n) => putNote(n)),
        ]),
      );
    },
    [persistCatch],
  );

  return {
    loading,
    storageError,
    records,
    favorites,
    notes,
    isTamed,
    isFavorite,
    getRecord,
    getNote,
    countTamed,
    toggleTamed,
    toggleFavorite,
    updateLevel,
    saveNote,
    replaceAll,
  };
}
