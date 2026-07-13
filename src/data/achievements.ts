import { getArtifactsForMap, TOTAL_ARTIFACTS } from './artifacts';
import { bossKey, getBossesForMap, TOTAL_BOSS_KILLS } from './bosses';
import { ALL_CREATURES, getDinosForMap } from './dinoDatabase';
import { EXPLORER_NOTES, getNotesForMap } from './explorerNotes';
import { MAPS, type TamedRecord } from '../types';

/** Aggregierter Zustand für die Erfolgs-Auswertung. */
export interface ProgressSnapshot {
  records: ReadonlyMap<string, TamedRecord>;
  found: ReadonlySet<string>;
  bossKeys: ReadonlySet<string>;
  artifactKeys: ReadonlySet<string>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** true, wenn freigeschaltet. */
  check: (s: ProgressSnapshot) => boolean;
}

/** Hat mind. eine Map 100 % über alle Kategorien? */
function anyMapComplete(s: ProgressSnapshot): boolean {
  return MAPS.some((map) => {
    const dinoIds = getDinosForMap(map).map((d) => d.id);
    const noteIds = getNotesForMap(map).map((n) => n.id);
    const bKeys = getBossesForMap(map).flatMap((b) => b.difficulties.map((d) => bossKey(b.id, d)));
    const aIds = getArtifactsForMap(map).map((a) => a.id);
    const total = dinoIds.length + noteIds.length + bKeys.length + aIds.length;
    if (total === 0) return false;
    const done =
      dinoIds.filter((id) => s.records.has(`${map}:${id}`)).length +
      noteIds.filter((id) => s.found.has(id)).length +
      bKeys.filter((k) => s.bossKeys.has(k)).length +
      aIds.filter((id) => s.artifactKeys.has(id)).length;
    return done === total;
  });
}

/** Jede Spezies mit passendem Namens-Filter auf mind. einer Map erledigt? */
function everySpecies(s: ProgressSnapshot, filter: (name: string, tameable: boolean) => boolean): boolean {
  const targets = ALL_CREATURES.filter((d) => filter(d.name, d.tameable !== false));
  if (targets.length === 0) return false;
  return targets.every((d) => d.maps.some((map) => s.records.has(`${map}:${d.id}`)));
}

const totalDone = (s: ProgressSnapshot) =>
  s.records.size + s.found.size + s.bossKeys.size + s.artifactKeys.size;

const GRAND_TOTAL =
  MAPS.reduce((sum, map) => sum + getDinosForMap(map).length, 0) +
  EXPLORER_NOTES.length + TOTAL_BOSS_KILLS + TOTAL_ARTIFACTS;

/** Die Meilenstein-Erfolge (bewusst spoilerarm formuliert). */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-tame', title: 'Erster Fang', description: 'Deine erste Kreatur gezähmt oder erlegt.', check: (s) => s.records.size >= 1 },
  { id: 'tame-25', title: 'Rudel-Führer', description: '25 Einträge auf der Liste.', check: (s) => s.records.size >= 25 },
  { id: 'tame-100', title: 'Zähm-Legende', description: '100 Kreaturen-Einträge geschafft.', check: (s) => s.records.size >= 100 },
  { id: 'first-boss', title: 'Arena-Neuling', description: 'Ersten Boss besiegt.', check: (s) => s.bossKeys.size >= 1 },
  { id: 'all-bosses', title: 'Arena-Legende', description: `Alle ${TOTAL_BOSS_KILLS} Boss-Kämpfe gewonnen.`, check: (s) => s.bossKeys.size >= TOTAL_BOSS_KILLS },
  { id: 'first-artifact', title: 'Schatzsucher', description: 'Erstes Artefakt geborgen.', check: (s) => s.artifactKeys.size >= 1 },
  { id: 'all-artifacts', title: 'Archäologe', description: `Alle ${TOTAL_ARTIFACTS} Artefakte gesammelt.`, check: (s) => s.artifactKeys.size >= TOTAL_ARTIFACTS },
  { id: 'notes-50', title: 'Chronist', description: '50 Erkunder-Notizen gefunden.', check: (s) => s.found.size >= 50 },
  { id: 'all-notes', title: 'Lore-Meister', description: `Alle ${EXPLORER_NOTES.length} Erkunder-Notizen gefunden.`, check: (s) => s.found.size >= EXPLORER_NOTES.length },
  { id: 'all-alphas', title: 'Alpha-Schlächter', description: 'Jede Alpha-Kreatur mindestens einmal erlegt.', check: (s) => everySpecies(s, (n, t) => !t && n.startsWith('Alpha ')) },
  { id: 'ocean-king', title: 'König der Ozeane', description: 'Alle Tiefsee-Alphas und den Leedsichthys bezwungen.', check: (s) => everySpecies(s, (n, t) => !t && /Megalodon|Mosasaur|Tusoteuthis|Leedsichthys/.test(n)) },
  { id: 'corrupted-clean', title: 'Säuberung', description: 'Alle korrupten Kreaturen auf Extinction erlegt.', check: (s) => everySpecies(s, (n, t) => !t && (n.startsWith('Korrupter') || n.startsWith('Wütender'))) },
  { id: 'dragon-rider', title: 'Drachen-Reiter', description: 'Einen Wyvern gezähmt (irgendeine Map).', check: (s) => ['Scorched Earth', 'Ragnarok', 'Lost Island', 'Fjordur'].some((m) => s.records.has(`${m}:wyvern`)) },
  { id: 'reaper-mother', title: 'Reaper-Blut', description: 'Einen eigenen Reaper King ausgetragen.', check: (s) => s.records.has('Aberration:reaperkingtame') },
  { id: 'first-map', title: 'Erste Map komplett', description: 'Eine Map zu 100 % abgeschlossen.', check: anyMapComplete },
  { id: 'ark-100', title: '100 % ARK', description: 'Alles. Wirklich alles.', check: (s) => totalDone(s) >= GRAND_TOTAL },
];
