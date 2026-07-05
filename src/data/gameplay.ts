import type { Dino, SizeClass } from '../types';
import { DINO_DATABASE } from './dinoDatabase';

/**
 * Spielformeln für die Detail-Ansicht (an ARK/Dododex angelehnte Näherungswerte).
 * Statuswerte skalieren pro Level mit festen Prozentsätzen des Basiswerts.
 */

/** Zuwachs pro Wild-Level als Anteil des Basiswerts. */
export const WILD_GAIN = {
  health: 0.2,
  stamina: 0.1,
  oxygen: 0.1,
  food: 0.1,
  weight: 0.02,
  melee: 0.05,
  torpor: 0.06,
} as const;

/** Zuwachs pro Level nach dem Zähmen (in % je vergebenem Punkt). */
export const TAMED_GAIN_PCT = {
  health: 5.4,
  stamina: 10,
  oxygen: 10,
  food: 10,
  weight: 4,
  melee: 1.7,
  speed: 1,
} as const;

export const statAtLevel = (base: number, gainPerLevel: number, level: number) =>
  base * (1 + gainPerLevel * (level - 1));

export const torporAt = (dino: Dino, level: number) =>
  statAtLevel(dino.extraStats.torpor, WILD_GAIN.torpor, level);

export const healthAt = (dino: Dino, level: number) =>
  statAtLevel(dino.baseStats.health, WILD_GAIN.health, level);

// ── Betäuben ──────────────────────────────────────────────

export interface KnockoutWeapon {
  name: string;
  /** Torpor pro Treffer. */
  torpor: number;
  /** Schaden pro Treffer (für die Todeschance). */
  damage: number;
}

/** Torpor-/Schadenswerte gängiger Betäubungswaffen. */
export const KNOCKOUT_WEAPONS: KnockoutWeapon[] = [
  { name: 'Fäuste', torpor: 6.3, damage: 8 },
  { name: 'Holzkeule', torpor: 7.3, damage: 5 },
  { name: 'Steinschleuder', torpor: 23.8, damage: 14 },
  { name: 'Bumerang', torpor: 60, damage: 30 },
  { name: 'Elektroschocker', torpor: 151, damage: 1 },
  { name: 'Bogen (Tranq Arrow)', torpor: 90, damage: 20 },
  { name: 'Armbrust (Tranq Arrow)', torpor: 157.5, damage: 35 },
  { name: 'Langgewehr (Tranq Dart)', torpor: 221, damage: 26 },
  { name: 'Langgewehr (Shocking Dart)', torpor: 425, damage: 26 },
];

export const HEAD_MULTIPLIER = 3;

export interface KnockoutRow {
  weapon: string;
  hits: number;
  headHits: number;
  /** Grobe Todeschance in %, 0 wenn vernachlässigbar. */
  deathChance: number;
}

/** Treffer pro Waffe bis K.O. (Körper / Kopf ×3) inkl. grober Todeschance. */
export function knockoutTable(dino: Dino, level: number): KnockoutRow[] {
  const torpor = torporAt(dino, level);
  const health = healthAt(dino, level);
  return KNOCKOUT_WEAPONS.map((weapon) => {
    const hits = Math.max(1, Math.ceil(torpor / weapon.torpor));
    const headHits = Math.max(1, Math.ceil(torpor / (weapon.torpor * HEAD_MULTIPLIER)));
    const deathChance = Math.min(99.9, Math.round((hits * weapon.damage * 100) / health * 10) / 10);
    return { weapon: weapon.name, hits, headHits, deathChance: deathChance >= 5 ? deathChance : 0 };
  });
}

/** Torpor-Abbaurate (Punkte/Sekunde) – bestimmt, wie oft nachbetäubt werden muss. */
export function torporDrainRate(dino: Dino): { rate: number; label: string } {
  const perSize: Record<SizeClass, number> = {
    tiny: 0.3, small: 0.6, medium: 1.0, large: 2.0, huge: 3.6, 'ocean-small': 0.8, 'ocean-large': 2.2,
  };
  const rate = perSize[dino.sizeClass];
  const label = rate <= 0.5 ? 'Langsam' : rate <= 1.2 ? 'Durchschnitt' : 'Schnell';
  return { rate, label };
}

// ── Zähm-Futter ───────────────────────────────────────────

export interface FoodRow {
  food: string;
  amount: number;
  /** Zähm-Effektivität in % bei ausschließlicher Fütterung. */
  effectiveness: number;
  minutes: number;
}

const isHerbivore = (dino: Dino) =>
  /berr|crop|rockarrot|honig|honey|blumen|flowers|pilze|mushroom/i.test(dino.tamingFood) ||
  /veggie/i.test(dino.kibbleType);

const isFishEater = (dino: Dino) => /fisch|fish/i.test(dino.tamingFood);

/**
 * Futter-Tabelle wie bei Dododex: bestes Futter oben (schnell, hohe
 * Effektivität), darunter die günstigeren Alternativen.
 */
export function tamingFoodTable(dino: Dino, kibbleCount: number, baseMinutes: number): FoodRow[] {
  const rows: FoodRow[] = [];
  const push = (food: string, factor: number, effectiveness: number, timeFactor: number) =>
    rows.push({
      food,
      amount: Math.max(1, Math.ceil(kibbleCount * factor)),
      effectiveness,
      minutes: baseMinutes * timeFactor,
    });

  // Spezial-Zähmungen (passiv/Ei-Raub) haben kein Alternativ-Futter.
  if (dino.kibbleType.startsWith('–')) {
    push(dino.tamingFood, 1, 100, 1);
    return rows;
  }

  push(dino.kibbleType, 1, 99.8, 1);
  if (isFishEater(dino)) {
    push('Raw Prime Fish Meat', 1.8, 89.9, 1.6);
    push('Rohes Fischfleisch', 3.5, 69.8, 2.6);
  } else if (isHerbivore(dino)) {
    push('Feldfrüchte (Rockarrot etc.)', 1.7, 89.9, 1.5);
    push('Mejoberry', 4, 74.9, 2.4);
    push('Beeren (gemischt)', 6, 59.8, 2.4);
  } else {
    push('Raw Prime Meat', 1.8, 89.9, 1.6);
    push('Cooked Prime Meat', 2.6, 79.9, 2.0);
    push('Rohes Fleisch', 3.5, 69.8, 2.6);
  }
  return rows;
}

/** Bonus-Level durch Zähm-Effektivität (max. +50 % des Wild-Levels). */
export const tamingBonusLevels = (level: number, effectiveness: number) =>
  Math.floor((level / 2) * (effectiveness / 100));

// ── Umgang (größenabhängig) ───────────────────────────────

const CARRIERS: Record<SizeClass, string[]> = {
  tiny: ['Mensch', 'Pteranodon', 'Tapejara', 'Argentavis', 'Griffin', 'Tropeognathus', 'Quetzal', 'Tusoteuthis', 'Karkinos', 'Procoptodon (Beutel)'],
  small: ['Pteranodon', 'Tapejara', 'Argentavis', 'Griffin', 'Tropeognathus', 'Quetzal', 'Tusoteuthis', 'Karkinos'],
  medium: ['Argentavis', 'Quetzal', 'Tusoteuthis', 'Karkinos'],
  large: ['Quetzal', 'Tusoteuthis'],
  huge: [],
  'ocean-small': ['Tusoteuthis', 'Megalosaurus (an Land)'],
  'ocean-large': [],
};

const TRAPS: Record<SizeClass, string[]> = {
  tiny: ['Bola', 'Lasso', 'Netz-Projektil', 'Bärenfalle', 'Plant Species Y'],
  small: ['Bola', 'Lasso', 'Netz-Projektil', 'Bärenfalle', 'Plant Species Y'],
  medium: ['Ketten-Bola', 'Netz-Projektil', 'Große Bärenfalle', 'Plant Species Y'],
  large: ['Große Bärenfalle', 'Netz-Projektil (teilweise)'],
  huge: ['Große Bärenfalle'],
  'ocean-small': ['Netz-Projektil'],
  'ocean-large': [],
};

const DAMAGES: Record<SizeClass, string[]> = {
  tiny: ['Stroh'],
  small: ['Stroh'],
  medium: ['Stroh', 'Holz'],
  large: ['Stroh', 'Holz', 'Lehm', 'Stein'],
  huge: ['Stroh', 'Holz', 'Lehm', 'Stein'],
  'ocean-small': ['Stroh'],
  'ocean-large': ['Stroh', 'Holz'],
};

const GATES: Record<SizeClass, string[]> = {
  tiny: ['Türrahmen (1×1)', 'Doppeltür', 'Dino-Tor', 'Behemoth-Tor'],
  small: ['Doppeltür', 'Dino-Tor', 'Behemoth-Tor'],
  medium: ['Dino-Tor', 'Behemoth-Tor'],
  large: ['Behemoth-Tor'],
  huge: ['Passt durch kein Tor'],
  'ocean-small': ['Behemoth-Tor (Unterwasser)'],
  'ocean-large': ['Passt durch kein Tor'],
};

export interface HusbandryInfo {
  carriedBy: string[];
  affectedBy: string[];
  canDamage: string[];
  fitsThrough: string[];
}

export function husbandryInfo(dino: Dino): HusbandryInfo {
  return {
    carriedBy: CARRIERS[dino.sizeClass],
    affectedBy: TRAPS[dino.sizeClass],
    canDamage: dino.baseStats.damage === 0 ? [] : DAMAGES[dino.sizeClass],
    fitsThrough: GATES[dino.sizeClass],
  };
}

// ── Klonkammer & XP ───────────────────────────────────────

const CLONE_FACTOR: Record<SizeClass, number> = {
  tiny: 27.7, small: 55, medium: 120, large: 300, huge: 700, 'ocean-small': 140, 'ocean-large': 420,
};

/** Klon-Kosten in Element-Splittern + Klonzeit (7 s pro Splitter). */
export function cloneCost(dino: Dino, level: number): { shards: number; seconds: number } {
  const shards = Math.round((level * CLONE_FACTOR[dino.sizeClass]) / 10) * 10;
  return { shards, seconds: shards * 7 };
}

const XP_BASE: Record<Dino['difficulty'], number> = { easy: 2, medium: 6, hard: 20 };

/** XP fürs Töten einer wilden Kreatur des Levels. */
export const killXp = (dino: Dino, level: number) =>
  Math.round(XP_BASE[dino.difficulty] * (1 + 0.1 * (level - 1)) * 10) / 10;

// ── Statuswerte-Ränge ─────────────────────────────────────

export type RankableStat = 'health' | 'stamina' | 'food' | 'weight' | 'melee' | 'torpor';

const statValue = (dino: Dino, stat: RankableStat): number => {
  switch (stat) {
    case 'health': return dino.baseStats.health;
    case 'melee': return dino.baseStats.damage;
    case 'stamina': return dino.extraStats.stamina;
    case 'food': return dino.extraStats.food;
    case 'weight': return dino.extraStats.weight;
    case 'torpor': return dino.extraStats.torpor;
  }
};

/** Rang jedes Dinos je Statuswert (1 = höchster Basiswert), einmalig berechnet. */
const RANKS: Record<RankableStat, Map<string, number>> = (() => {
  const stats: RankableStat[] = ['health', 'stamina', 'food', 'weight', 'melee', 'torpor'];
  const result = {} as Record<RankableStat, Map<string, number>>;
  for (const stat of stats) {
    const sorted = [...DINO_DATABASE].sort((a, b) => statValue(b, stat) - statValue(a, stat));
    result[stat] = new Map(sorted.map((dino, index) => [dino.id, index + 1]));
  }
  return result;
})();

export const statRank = (dino: Dino, stat: RankableStat) => RANKS[stat].get(dino.id) ?? 0;
export const TOTAL_SPECIES = DINO_DATABASE.length;

// ── Zucht ─────────────────────────────────────────────────

const MATURATION_MINUTES: Record<SizeClass, number> = {
  tiny: 480, small: 1100, medium: 2000, large: 3600, huge: 5600, 'ocean-small': 1600, 'ocean-large': 4200,
};

/** Aufzuchtzeiten: Brut/Tragzeit + Reifung (Baby → Erwachsen). */
export function breedingTimes(dino: Dino): { incubationMinutes: number; maturationMinutes: number; isEgg: boolean } {
  const isEgg = dino.eggIncubationTime > 0;
  return {
    incubationMinutes: isEgg ? dino.eggIncubationTime : Math.round(MATURATION_MINUTES[dino.sizeClass] * 0.18),
    maturationMinutes: MATURATION_MINUTES[dino.sizeClass],
    isEgg,
  };
}
