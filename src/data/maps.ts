import type { MapName } from '../types';

/** MapName → Bild-Slug (Dateiname in public/maps/<slug>.jpg). */
const MAP_SLUG: Record<MapName, string> = {
  'The Island': 'theisland',
  Ragnarok: 'ragnarok',
  Extinction: 'extinction',
  'Genesis 1': 'genesis1',
  'Genesis 2': 'genesis2',
  'Crystal Isles': 'crystalisles',
  'Lost Island': 'lostisland',
};

/** Pfad zum topografischen Kartenbild einer Map. */
export function mapImage(map: MapName): string {
  return `/maps/${MAP_SLUG[map]}.jpg`;
}
