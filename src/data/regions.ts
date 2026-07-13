import type { MapName } from '../types';

/**
 * Grobe Regionen pro Map für die Dino-Spawn-Ebene der interaktiven Karte.
 * Die Spawn-Ortsnamen der Kreaturen (freie Texte) werden per Stichwort auf
 * diese Regionen gemappt – Koordinaten sind bewusst grobe Richtwerte
 * (Zentrum der Region).
 */
export interface SpawnRegion {
  /** Kleingeschriebene Stichwörter, die im Spawn-Text matchen. */
  keys: string[];
  label: string;
  lat: number;
  lon: number;
}

const K = {
  beach: ['strand', 'beach', 'küste', 'coast', 'shore'],
  jungle: ['dschungel', 'jungle', 'wald', 'forest', 'grasland', 'grassland', 'plains', 'ebene', 'wiese', 'meadow'],
  redwood: ['redwood'],
  mountain: ['berg', 'mountain', 'peak', 'gipfel', 'klippe', 'cliff', 'hochland', 'highland', 'grat'],
  snow: ['schnee', 'snow', 'eis', 'ice', 'frost', 'arktis', 'arctic', 'tundra', 'winter', 'jotunheim'],
  volcano: ['vulkan', 'volcano', 'lava', 'feuer', 'balheimr', 'magma'],
  swamp: ['sumpf', 'swamp', 'bog', 'moor', 'feucht'],
  river: ['fluss', 'river', 'see', 'lake', 'oase', 'oasis', 'flach', 'shallow'],
  ocean: ['ozean', 'ocean', 'tiefsee', 'deep', 'meer', 'sea', 'bay', 'bucht', 'unterwasser', 'underwater'],
  cave: ['höhle', 'cave', 'grotte', 'kaverne', 'cavern', 'tunnel', 'untergrund'],
  desert: ['wüste', 'desert', 'dune', 'düne', 'badland', 'canyon', 'sand'],
};

const region = (keys: string[], label: string, lat: number, lon: number): SpawnRegion => ({ keys, label, lat, lon });

/** Regionen je Map (Auswahl der wichtigsten Biome). */
export const SPAWN_REGIONS: Record<MapName, SpawnRegion[]> = {
  'The Island': [
    region(K.beach, 'Süd-Strände', 82, 45), region(K.jungle, 'Dschungel/Grasland', 55, 55),
    region(K.redwood, 'Redwoods', 44, 46), region(K.mountain, 'Berge', 25, 55),
    region(K.snow, 'Schnee-Biom', 15, 45), region(K.volcano, 'Vulkan', 41, 58),
    region(K.swamp, 'Sümpfe', 66, 62), region(K.river, 'Flüsse/Seen', 60, 45),
    region(K.ocean, 'Ozean/Tiefsee', 45, 90), region(K.cave, 'Höhlen', 70, 40), region(K.desert, 'Trockengebiete', 75, 70),
  ],
  'Scorched Earth': [
    region(K.desert, 'Dünen/Badlands', 65, 55), region(K.mountain, 'Gebirge', 40, 36),
    region(K.river, 'Oasen', 50, 60), region(K.cave, 'Höhlen', 58, 45),
    region([...K.jungle, ...K.beach], 'Buschland', 45, 70), region(K.volcano, 'Canyons', 70, 72),
    region(K.ocean, 'Wasserstellen', 77, 35),
  ],
  Aberration: [
    region([...K.jungle, 'fertile'], 'Fertile Chamber', 55, 35), region(['lumin', 'bio', 'blau', 'blue'], 'Bio-Lumineszenz', 48, 45),
    region(['element', 'rot', 'red', 'grave', 'tiefe'], 'Element-Region', 68, 48), region([...K.cave], 'Tunnel', 45, 60),
    region([...K.river, ...K.ocean], 'Gewässer', 50, 30), region(['oberfläche', 'surface'], 'Oberfläche', 25, 60),
    region(['portal'], 'Portal', 42, 52),
  ],
  Extinction: [
    region(['stadt', 'city', 'sanctuary'], 'Stadt', 25, 50), region(['wasteland', 'ödland', 'verheert', 'trümmer'], 'Wasteland', 60, 45),
    region(K.snow, 'Snow Dome', 20, 20), region(K.desert, 'Desert Dome', 75, 75),
    region(['sunken', 'wald', 'forest'], 'Sunken Forest', 40, 70), region(K.cave, 'Kavernen', 55, 25),
    region(K.river, 'Gewässer', 45, 55),
  ],
  'Genesis 1': [
    region([...K.swamp], 'Bog-Biom', 60, 40), region(K.snow, 'Arktis-Biom', 25, 25),
    region(K.ocean, 'Ozean-Biom', 60, 20), region(K.volcano, 'Vulkan-Biom', 40, 66),
    region(['lunar', 'mond'], 'Lunar-Biom', 16, 79), region([...K.jungle, ...K.beach, ...K.river], 'Bog-Ränder', 55, 50),
  ],
  'Genesis 2': [
    region(['eden', ...K.jungle, ...K.river, ...K.beach], 'Eden-Seite', 60, 28),
    region(['rockwell', 'innards', 'eingeweide'], "Rockwell's Innards", 72, 70),
    region(['space', 'weltraum', 'asteroid'], 'Weltraum-Biom', 32, 77),
    region(K.snow, 'Eden-Höhen', 45, 20), region(K.cave, 'Tunnel', 55, 60),
  ],
  'The Center': [
    region(K.beach, 'Küsten', 70, 60), region(K.jungle, 'Dschungel-Inseln', 45, 45),
    region(K.redwood, 'Redwood-Rand', 38, 55), region(K.mountain, 'Nordberge', 42, 20),
    region(K.snow, 'Eisberg', 25, 45), region(K.volcano, 'Lava Island', 55, 55),
    region(K.swamp, 'Sümpfe', 65, 35), region(K.ocean, 'Ozean', 60, 80), region(K.cave, 'Höhlen', 15, 30),
    region(K.river, 'Binnengewässer', 50, 40),
  ],
  Ragnarok: [
    region(K.beach, 'Küsten', 60, 55), region(K.jungle, 'Grasland', 50, 65),
    region(K.redwood, 'Redwoods', 55, 25), region(K.mountain, 'Highlands', 60, 78),
    region(K.snow, 'Schneegebirge', 35, 35), region(K.volcano, 'Vulkan', 25, 25),
    region(K.swamp, 'Sumpf', 75, 55), region(K.ocean, 'Viking Bay/Ozean', 42, 87),
    region(K.cave, 'Höhlen/Dungeons', 40, 45), region(K.desert, 'Wüste', 78, 70), region(K.river, 'Flüsse', 55, 50),
  ],
  Valguero: [
    region(K.beach, 'Küsten', 75, 80), region(K.jungle, 'Dschungel', 55, 55),
    region(K.redwood, 'Redwoods', 65, 35), region(K.mountain, 'White Cliffs', 20, 35),
    region(K.snow, 'Schnee', 12, 20), region(['aberration', 'ab-zone', 'trench'], 'Aberration-Zone', 62, 42),
    region(K.swamp, 'Sumpf', 78, 52), region(K.ocean, 'Ozean', 55, 90),
    region(K.cave, 'Höhlen', 30, 60), region(K.river, 'Seen/Flüsse', 50, 45), region(K.desert, 'Chalk Hills', 33, 62),
  ],
  'Crystal Isles': [
    region(K.beach, 'Küsten', 55, 20), region(K.jungle, 'Dschungel', 50, 50),
    region([...K.mountain, 'schweb', 'float'], 'Schwebende Inseln', 25, 45), region(K.snow, 'Frost-Region', 15, 25),
    region(K.volcano, 'Vulkanfeld', 45, 35), region(K.swamp, 'Sumpf', 70, 45),
    region(K.ocean, 'Ozean', 55, 15), region(K.desert, 'Wüsten-Plateau', 70, 75),
    region(K.cave, 'Höhlen', 35, 60), region(['crystal', 'kristall', 'wyvern'], 'Wyvern-Nistgebiet', 30, 60),
  ],
  'Lost Island': [
    region(K.beach, 'Küsten', 75, 45), region(K.jungle, 'Grasland/Dschungel', 55, 50),
    region(K.redwood, 'Redwoods', 45, 60), region(K.mountain, 'Gebirge', 30, 35),
    region(K.snow, 'Schneeberge', 20, 28), region(K.volcano, 'Vulkan', 60, 71),
    region(K.swamp, 'Sumpf', 65, 55), region(K.ocean, 'Ozean', 78, 22),
    region(K.cave, 'Höhlen', 30, 74), region(K.desert, 'Wüste', 40, 80),
  ],
  Fjordur: [
    region(K.beach, 'Midgard-Küsten', 50, 45), region(K.jungle, 'Midgard-Wiesen', 42, 55),
    region(K.redwood, 'Wälder', 55, 60), region(K.mountain, 'Gebirge', 35, 50),
    region([...K.snow, 'jotunheim'], 'Jotunheim', 12, 14), region([...K.volcano, 'balheimr'], 'Balheimr', 86, 81),
    region(K.swamp, 'Sümpfe', 60, 35), region(K.ocean, 'Fjorde/Ozean', 25, 40),
    region(K.cave, 'Höhlen/Grotten', 45, 30), region(['asgard'], 'Asgard', 34, 76),
  ],
};

/** Findet die Regionen einer Map, die zu den Spawn-Texten einer Kreatur passen. */
export function matchSpawnRegions(map: MapName, spawnLocations: string[]): SpawnRegion[] {
  const regions = SPAWN_REGIONS[map] ?? [];
  const texts = spawnLocations.map((s) => s.toLowerCase());
  const hits: SpawnRegion[] = [];
  for (const reg of regions) {
    if (texts.some((t) => reg.keys.some((k) => t.includes(k)))) hits.push(reg);
  }
  return hits;
}
