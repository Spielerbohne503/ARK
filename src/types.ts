/** Alle unterstützten Ark-Maps. */
export const MAPS = [
  'The Island',
  'Ragnarok',
  'Extinction',
  'Genesis 1',
  'Genesis 2',
  'Crystal Isles',
  'Lost Island',
] as const;

export type MapName = (typeof MAPS)[number];

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DinoBaseStats {
  health: number;
  damage: number;
  speed: number;
}

export interface Dino {
  id: string;
  name: string;
  maps: MapName[];
  spawnLocations: string[];
  baseStats: DinoBaseStats;
  tamingFood: string;
  kibbleType: string;
  baseKibbleCount: number;
  /** Basis-Zähmzeit in Minuten (Level 1). */
  baseTamingTime: number;
  /** Paarungsintervall in Minuten. */
  breedingInterval: number;
  /** Brutzeit des Eis in Minuten (0 = lebendgebärend). */
  eggIncubationTime: number;
  difficulty: Difficulty;
  imageUrl: string;
  /** 1–2 Sätze: Verhalten + Zähm-Tipp. */
  description: string;
  /** Einsatz-Rollen, z. B. "Metall-Farmer", "Boss-Kampf". */
  roles: string[];
}

/** Persistierter Zähm-Eintrag in IndexedDB. */
export interface TamedRecord {
  /** Zusammengesetzter Schlüssel: `${map}:${dinoId}` */
  key: string;
  dinoId: string;
  map: MapName;
  /** ISO-Datum der Zähmung. */
  tamedDate: string;
  level: number;
}

/** Persistierte Notiz pro Dino+Map in IndexedDB. */
export interface NoteRecord {
  /** Zusammengesetzter Schlüssel: `${map}:${dinoId}` */
  key: string;
  text: string;
  updatedAt: string;
}

/** Ergebnis des Taming-Calculators. */
export interface TamingResult {
  kibbleCount: number;
  narcotics: number;
  narcoberries: number;
  foodAmount: number;
  tamingMinutes: number;
  tamingTimeFormatted: string;
  resources: { label: string; amount: number; icon: 'kibble' | 'food' | 'narcotic' | 'berry' }[];
}
