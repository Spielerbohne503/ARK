/**
 * EINE zentrale Supabase-Instanz für alle Tribes.
 *
 * Trage hier die Zugangsdaten deines EINEN Supabase-Projekts ein (oder setze
 * sie beim Deploy als Umgebungsvariablen VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
 * Danach müssen die Nutzer nur noch ihren Tribe-Namen eingeben – jeder Tribe
 * liegt als eigene Zeile in derselben Datenbank und wird getrennt getrackt.
 *
 * Der anon-Key ist ein ÖFFENTLICHER Schlüssel (für den Browser gedacht) und
 * durch die Row-Level-Security-Policy der Tabelle abgesichert – er darf im
 * Frontend stehen.
 */

// ▼▼▼ Hier die EINE Supabase-Instanz eintragen ▼▼▼
const HARDCODED_URL = '';
const HARDCODED_ANON_KEY = '';
// ▲▲▲ ────────────────────────────────────── ▲▲▲

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || HARDCODED_URL;
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || HARDCODED_ANON_KEY;

/**
 * Gemeinsamer Raum-Schlüssel (eine Zeile in der Datenbank). Alle Geräte, die
 * die Seite öffnen, teilen sich diesen Stand. Willst du getrennte Gruppen,
 * gib jeder Deployment-Kopie einen anderen Wert.
 */
export const SYNC_ROOM =
  (import.meta.env.VITE_SUPABASE_ROOM as string | undefined)?.trim() || 'ark-shared';

/** true, sobald die zentrale Instanz hinterlegt ist → Sync ist für alle aktiv. */
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
