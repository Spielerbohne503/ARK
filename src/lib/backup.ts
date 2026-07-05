import { MAPS, type NoteRecord, type TamedRecord } from '../types';

/** Format der Backup-Datei (Fortschritt ist browser-lokal → Export als Sicherung). */
export interface BackupData {
  app: 'ark-dino-tracker';
  version: 1;
  exportedAt: string;
  tamed: TamedRecord[];
  favorites: string[];
  notes: NoteRecord[];
}

/** Lädt den kompletten Fortschritt als JSON-Datei herunter. */
export function exportBackup(
  tamed: ReadonlyMap<string, TamedRecord>,
  favorites: ReadonlySet<string>,
  notes: ReadonlyMap<string, NoteRecord>,
): void {
  const data: BackupData = {
    app: 'ark-dino-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    tamed: [...tamed.values()],
    favorites: [...favorites],
    notes: [...notes.values()],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ark-dino-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

const isValidKey = (key: unknown): key is string =>
  typeof key === 'string' && MAPS.some((map) => key.startsWith(`${map}:`));

/** Validiert eine Backup-Datei; wirft bei ungültigem Format einen Fehler. */
export function parseBackup(json: string): Pick<BackupData, 'tamed' | 'favorites' | 'notes'> {
  const data = JSON.parse(json) as Partial<BackupData>;
  if (data.app !== 'ark-dino-tracker' || !Array.isArray(data.tamed)) {
    throw new Error('Keine gültige Ark-Dino-Tracker-Backup-Datei.');
  }
  return {
    tamed: data.tamed.filter(
      (r): r is TamedRecord =>
        !!r && isValidKey(r.key) && typeof r.dinoId === 'string' && typeof r.level === 'number',
    ),
    favorites: (data.favorites ?? []).filter(isValidKey),
    notes: (data.notes ?? []).filter(
      (n): n is NoteRecord => !!n && isValidKey(n.key) && typeof n.text === 'string',
    ),
  };
}
