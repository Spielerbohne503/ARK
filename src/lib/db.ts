import type { FoundNoteRecord, NoteRecord, TamedRecord } from '../types';

const DB_NAME = 'ark-dino-tracker';
const DB_VERSION = 5;

export const STORE_TAMED = 'tamed';
export const STORE_FAVORITES = 'favorites';
export const STORE_NOTES = 'notes';
export const STORE_FOUND_NOTES = 'foundNotes';
/** Besiegte Bosse, Key: `${bossId}:${difficulty}`. */
export const STORE_BOSSES = 'bosses';
/** Gefundene Artefakte, Key: artifact.id. */
export const STORE_ARTIFACTS = 'artifacts';

type StoreName =
  | typeof STORE_TAMED
  | typeof STORE_FAVORITES
  | typeof STORE_NOTES
  | typeof STORE_FOUND_NOTES
  | typeof STORE_BOSSES
  | typeof STORE_ARTIFACTS;

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

    // Migrationen sind additiv: neue Stores werden angelegt, bestehende Daten
    // (v2: tamed/favorites/notes, v3: +foundNotes, v4: +bosses, v5: +artifacts) bleiben erhalten.
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of [STORE_TAMED, STORE_FAVORITES, STORE_NOTES, STORE_FOUND_NOTES, STORE_BOSSES, STORE_ARTIFACTS]) {
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

// ── Gefundene Erkunder-Notizen ──
export const getAllFoundNotes = () =>
  withStore(STORE_FOUND_NOTES, 'readonly', (s) => s.getAll() as IDBRequest<FoundNoteRecord[]>);
export const putFoundNote = (record: FoundNoteRecord) =>
  withStore(STORE_FOUND_NOTES, 'readwrite', (s) => s.put(record));
export const deleteFoundNote = (key: string) =>
  withStore(STORE_FOUND_NOTES, 'readwrite', (s) => s.delete(key));

/**
 * Ersetzt den kompletten Inhalt eines Stores in einer Transaktion
 * (leeren + neu befüllen). Für den Cloud-Sync: eingehender Fremd-Stand
 * überschreibt den lokalen Store vollständig.
 */
export function overwriteStore(store: StoreName, records: { key: string }[]): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const os = tx.objectStore(store);
        os.clear();
        for (const record of records) os.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB-Overwrite fehlgeschlagen.'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB-Transaktion abgebrochen.'));
      }),
  );
}

// ── Generischer Key-Set-Store (für Bosse etc.) ──
export const getAllKeys = (store: StoreName) =>
  withStore(store, 'readonly', (s) => s.getAll() as IDBRequest<{ key: string }[]>);
export const putKey = (store: StoreName, key: string) =>
  withStore(store, 'readwrite', (s) => s.put({ key }));
export const deleteKey = (store: StoreName, key: string) =>
  withStore(store, 'readwrite', (s) => s.delete(key));
