import type { TamedRecord } from '../types';

const DB_NAME = 'ark-dino-tracker';
const DB_VERSION = 1;
const STORE_TAMED = 'tamed';

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

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TAMED)) {
        db.createObjectStore(STORE_TAMED, { keyPath: 'key' });
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
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_TAMED, mode);
        const request = action(tx.objectStore(STORE_TAMED));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB-Operation fehlgeschlagen.'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB-Transaktion abgebrochen.'));
      }),
  );
}

export function getAllTamed(): Promise<TamedRecord[]> {
  return withStore('readonly', (store) => store.getAll() as IDBRequest<TamedRecord[]>);
}

export function putTamed(record: TamedRecord): Promise<IDBValidKey> {
  return withStore('readwrite', (store) => store.put(record));
}

export function deleteTamed(key: string): Promise<undefined> {
  return withStore('readwrite', (store) => store.delete(key));
}
