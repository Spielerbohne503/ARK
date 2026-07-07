import type { NoteRecord, TamedRecord } from '../types';

/**
 * Kompletter Sync-Zustand (alle sechs Sammel-Bereiche). Wird als eine
 * JSON-Zeile pro Sync-Code in Supabase gespeichert und in Echtzeit zwischen
 * Geräten abgeglichen (Whole-State, Last-Writer-Wins).
 */
export interface SyncState {
  tamed: TamedRecord[];
  favorites: string[];
  notes: NoteRecord[];
  found: string[];
  bosses: string[];
  artifacts: string[];
}

/** Kanonische Signatur eines Zustands (sortiert) – erkennt echte Änderungen und Echos. */
export function stateSignature(s: SyncState): string {
  return JSON.stringify({
    tamed: s.tamed.map((r) => `${r.key}@${r.level}:${r.tamedDate}`).sort(),
    favorites: [...s.favorites].sort(),
    notes: s.notes.map((n) => `${n.key}=${n.text}`).sort(),
    found: [...s.found].sort(),
    bosses: [...s.bosses].sort(),
    artifacts: [...s.artifacts].sort(),
  });
}

/** Robust: nimmt beliebiges JSON aus Supabase und formt einen gültigen SyncState. */
export function normalizeState(raw: unknown): SyncState {
  const o = (raw ?? {}) as Partial<SyncState>;
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return {
    tamed: Array.isArray(o.tamed)
      ? o.tamed.filter(
          (r): r is TamedRecord =>
            !!r && typeof r.key === 'string' && typeof r.dinoId === 'string' && typeof r.level === 'number',
        )
      : [],
    favorites: strings(o.favorites),
    notes: Array.isArray(o.notes)
      ? o.notes.filter((n): n is NoteRecord => !!n && typeof n.key === 'string' && typeof n.text === 'string')
      : [],
    found: strings(o.found),
    bosses: strings(o.bosses),
    artifacts: strings(o.artifacts),
  };
}

// ── Geräte-Kennung (verhindert das Zurückspielen eigener Änderungen) ──
const DEVICE_KEY = 'ark-dino-tracker:device-id';

export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

/** Name der Supabase-Tabelle, in der der gemeinsame Stand liegt (eine Zeile pro Raum). */
export const SYNC_TABLE = 'sync_state';
