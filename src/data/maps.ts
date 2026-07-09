import type { MapName } from '../types';

/** MapName → Bild-Slug (Dateiname in public/maps/<slug>.jpg). */
const MAP_SLUG: Record<MapName, string> = {
  'The Island': 'theisland',
  'Scorched Earth': 'scorchedearth',
  Aberration: 'aberration',
  Extinction: 'extinction',
  'Genesis 1': 'genesis1',
  'Genesis 2': 'genesis2',
  'The Center': 'thecenter',
  Ragnarok: 'ragnarok',
  Valguero: 'valguero',
  'Crystal Isles': 'crystalisles',
  'Lost Island': 'lostisland',
  Fjordur: 'fjordur',
};

/** Pfad zum topografischen Kartenbild einer Map. */
export function mapImage(map: MapName): string {
  return `/maps/${MAP_SLUG[map]}.jpg`;
}
