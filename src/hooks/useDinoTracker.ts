import { useCallback, useEffect, useState } from 'react';
import { deleteTamed, getAllTamed, putTamed } from '../lib/db';
import type { MapName, TamedRecord } from '../types';

const keyOf = (map: MapName, dinoId: string) => `${map}:${dinoId}`;

export interface DinoTracker {
  /** true solange der initiale Load aus IndexedDB läuft. */
  loading: boolean;
  /** Fehlermeldung, falls IndexedDB nicht verfügbar ist (App läuft dann in-memory weiter). */
  storageError: string | null;
  isTamed: (map: MapName, dinoId: string) => boolean;
  getRecord: (map: MapName, dinoId: string) => TamedRecord | undefined;
  /** Anzahl gezähmter Dinos auf einer Map (nur IDs aus `validIds` zählen). */
  countTamed: (map: MapName, validIds: Set<string>) => number;
  /** Pin-Klick: Zähm-Status umschalten, Auto-Save in IndexedDB. */
  toggleTamed: (map: MapName, dinoId: string, level?: number) => void;
}

/**
 * Zentrale Tracker-Logik: hält alle Zähm-Einträge im State (Map keyed by
 * `${map}:${dinoId}`), lädt sie beim Mount aus IndexedDB und schreibt jede
 * Änderung sofort zurück (optimistic update – UI reagiert ohne Wartezeit).
 */
export function useDinoTracker(): DinoTracker {
  const [records, setRecords] = useState<ReadonlyMap<string, TamedRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Auto-Load beim Start der App.
  useEffect(() => {
    let cancelled = false;
    getAllTamed()
      .then((all) => {
        if (!cancelled) setRecords(new Map(all.map((r) => [r.key, r])));
      })
      .catch(() => {
        if (!cancelled) {
          setStorageError(
            'Speicher nicht verfügbar – Änderungen gehen beim Neuladen verloren.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isTamed = useCallback(
    (map: MapName, dinoId: string) => records.has(keyOf(map, dinoId)),
    [records],
  );

  const getRecord = useCallback(
    (map: MapName, dinoId: string) => records.get(keyOf(map, dinoId)),
    [records],
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

  const toggleTamed = useCallback((map: MapName, dinoId: string, level = 1) => {
    const key = keyOf(map, dinoId);

    setRecords((prev) => {
      const next = new Map(prev);
      const persist = prev.has(key)
        ? (next.delete(key), deleteTamed(key))
        : ((): Promise<unknown> => {
            const record: TamedRecord = {
              key,
              dinoId,
              map,
              tamedDate: new Date().toISOString(),
              level,
            };
            next.set(key, record);
            return putTamed(record);
          })();

      // In-Memory-State bleibt auch bei Persistenz-Fehler korrekt.
      persist.catch(() =>
        setStorageError('Speichern fehlgeschlagen – Status nur bis zum Neuladen aktiv.'),
      );
      return next;
    });
  }, []);

  return { loading, storageError, isTamed, getRecord, countTamed, toggleTamed };
}
