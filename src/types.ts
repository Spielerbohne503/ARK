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

/** Größenklasse – steuert Tragbarkeit, Fallen, Tore, Klon-Kosten usw. */
export type SizeClass = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'ocean-small' | 'ocean-large';

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
  /**
   * false = nicht zähmbar (Alphas, Korrupte, Wildtiere). Wird als „Getötet"
   * statt „Gezähmt" getrackt; Zähm-/Zucht-Tabs entfallen. undefined = zähmbar.
   */
  tameable?: boolean;
  imageUrl: string;
  /** 1–2 Sätze: Verhalten + Zähm-Tipp. */
  description: string;
  /** Einsatz-Rollen, z. B. "Metall-Farmer", "Boss-Kampf". */
  roles: string[];
  sizeClass: SizeClass;
  /** Beute beim Töten. */
  drops: string[];
  /** Weitere Basiswerte (Level 1) für die Statuswerte-Tabelle. */
  extraStats: {
    stamina: number;
    /** null = Wasseratmer ohne Sauerstoff-Stat. */
    oxygen: number | null;
    food: number;
    weight: number;
    torpor: number;
  };
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

/** Eine Erkunder-Notiz (Explorer Note), die auf einer Map gesammelt werden kann. */
export interface ExplorerNote {
  /** Global eindeutige ID, z. B. "island-helena-1". */
  id: string;
  map: MapName;
  /** Autor/Charakter, z. B. "Helena Walker". */
  explorer: string;
  /** Nummer innerhalb der Reihe dieses Autors. */
  number: number;
  /** Ungefähre Fundstelle auf der Map (GPS Lat/Lon). */
  coords: { lat: number; lon: number };
  /** Kurzes Thema der Notiz. */
  topic: string;
  /** Nacherzählter Inhaltstext im Stil des Autors. */
  content: string;
}

/** Persistierter "gefunden"-Eintrag einer Erkunder-Notiz in IndexedDB. */
export interface FoundNoteRecord {
  /** Schlüssel = ExplorerNote.id */
  key: string;
  foundDate: string;
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
