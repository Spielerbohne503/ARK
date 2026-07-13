import { ALL_CREATURES } from './dinoDatabase';
import type { Dino } from '../types';

/**
 * Kreaturen-Dossiers: Helenas Dino-Seiten, die in der Welt gefunden werden
 * und im Spiel Teil der Explorer-Notes-Sammlung sind. Ein Dossier pro
 * Basis-Spezies (map-unabhängig) – Alphas, Korrupte, Geister- und
 * Missions-Kreaturen haben keine eigenen Dossiers.
 */

/** Kreaturen ohne eigenes Dossier (Boss-Adds, Schwärme, Dungeon-Bosse …). */
const EXCLUDED_IDS = new Set([
  'forestwyvern', 'defenseunit', 'insectswarm', 'macrophage', 'parakeetfishschool',
  'rubblegolem', 'lavaelemental', 'icewormqueen', 'summoner',
  // Der wilde Reaper/die Königin teilen sich das eine „Reaper"-Dossier (reaperkingtame).
  'reaperking', 'reaperqueen',
]);

const isVariantName = (name: string) =>
  /^(Alpha |Korrupter |Wütender |Spirit )/.test(name);

/** Alle sammelbaren Dossiers (alphabetisch). */
export const DOSSIERS: Dino[] = ALL_CREATURES
  .filter((d) => !isVariantName(d.name) && !EXCLUDED_IDS.has(d.id) && !d.id.startsWith('corrupted'))
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

export const TOTAL_DOSSIERS = DOSSIERS.length;
