import type { NoteRecord, TamedRecord } from '../types';

const DB_NAME = 'ark-dino-tracker';
const DB_VERSION = 2;

export const STORE_TAMED = 'tamed';
export const STORE_FAVORITES = 'favorites';
export const STORE_NOTES = 'notes';

type StoreName = typeof STORE_TAMED | typeof STORE_FAVORITES | typeof STORE_NOTES;

let dbPromise: Promise<IDBDatabase> | null = null;

/** Öffnet die Datenbank genau einmal und cached die Verbindung. */
function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB wird von diesem Browser nicht unterstützt.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // v1 → v2: Stores für Favoriten und Notizen kommen dazu; 'tamed' bleibt unangetastet.
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of [STORE_TAMED, STORE_FAVORITES, STORE_NOTES]) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'key' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB konnte nicht geöffnet werden.'));
    request.onblocked = () => reject(new Error('IndexedDB ist durch einen anderen Tab blockiert.'));
  });

  // Bei Fehlschlag den Cache leeren, damit ein späterer Versuch neu öffnen kann.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

/** Führt eine Transaktion aus und wandelt das Request/Event-API in ein Promise um. */
function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = action(tx.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB-Operation fehlgeschlagen.'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB-Transaktion abgebrochen.'));
      }),
  );
}

// ── Gezähmt ──
export const getAllTamed = () =>
  withStore(STORE_TAMED, 'readonly', (s) => s.getAll() as IDBRequest<TamedRecord[]>);
export const putTamed = (record: TamedRecord) => withStore(STORE_TAMED, 'readwrite', (s) => s.put(record));
export const deleteTamed = (key: string) => withStore(STORE_TAMED, 'readwrite', (s) => s.delete(key));

// ── Favoriten (nur der Key zählt) ──
export const getAllFavorites = () =>
  withStore(STORE_FAVORITES, 'readonly', (s) => s.getAll() as IDBRequest<{ key: string }[]>);
export const putFavorite = (key: string) => withStore(STORE_FAVORITES, 'readwrite', (s) => s.put({ key }));
export const deleteFavorite = (key: string) => withStore(STORE_FAVORITES, 'readwrite', (s) => s.delete(key));

// ── Notizen ──
export const getAllNotes = () =>
  withStore(STORE_NOTES, 'readonly', (s) => s.getAll() as IDBRequest<NoteRecord[]>);
export const putNote = (record: NoteRecord) => withStore(STORE_NOTES, 'readwrite', (s) => s.put(record));
export const deleteNote = (key: string) => withStore(STORE_NOTES, 'readwrite', (s) => s.delete(key));
