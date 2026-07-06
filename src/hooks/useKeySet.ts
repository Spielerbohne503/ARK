import { useCallback, useEffect, useState } from 'react';
import { deleteKey, getAllKeys, putKey } from '../lib/db';

export interface KeySet {
  loading: boolean;
  storageError: string | null;
  keys: ReadonlySet<string>;
  has: (key: string) => boolean;
  /** Anzahl gesetzter Keys aus der übergebenen Menge. */
  count: (validKeys: Set<string>) => number;
  /** Key umschalten, Auto-Save. Liefert den neuen Zustand. */
  toggle: (key: string) => boolean;
}

/**
 * Generischer Sammel-Tracker über einem IndexedDB-Key-Store (Bosse, Artefakte …).
 * Lädt beim Mount, schreibt jede Änderung sofort zurück (optimistic).
 */
export function useKeySet(storeName: string): KeySet {
  const [keys, setKeys] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllKeys(storeName as never)
      .then((records) => {
        if (!cancelled) setKeys(new Set(records.map((r) => r.key)));
      })
      .catch(() => {
        if (!cancelled) setStorageError('Speicher nicht verfügbar – Änderungen gehen beim Neuladen verloren.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeName]);

  const has = useCallback((key: string) => keys.has(key), [keys]);

  const count = useCallback(
    (validKeys: Set<string>) => {
      let n = 0;
      keys.forEach((k) => {
        if (validKeys.has(k)) n += 1;
      });
      return n;
    },
    [keys],
  );

  const toggle = useCallback(
    (key: string): boolean => {
      const now = !keys.has(key);
      setKeys((prev) => {
        const next = new Set(prev);
        const persist = now ? (next.add(key), putKey(storeName as never, key)) : (next.delete(key), deleteKey(storeName as never, key));
        persist.catch(() => setStorageError('Speichern fehlgeschlagen – Status nur bis zum Neuladen aktiv.'));
        return next;
      });
      return now;
    },
    [keys, storeName],
  );

  return { loading, storageError, keys, has, count, toggle };
}
