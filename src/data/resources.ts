import type { MapName } from '../types';

/** Ressourcen-Arten, die auf der interaktiven Karte angezeigt werden. */
export type ResourceType =
  | 'metall'
  | 'kristall'
  | 'obsidian'
  | 'oel'
  | 'perlen'
  | 'schwefel'
  | 'edelsteine'
  | 'element';

/** Ein ergiebiger Ressourcen-Hotspot auf einer Map (Koordinaten sind Richtwerte). */
export interface ResourceDeposit {
  id: string;
  map: MapName;
  type: ResourceType;
  /** Kurzname des Fundorts, z. B. "Vulkan-Hang". */
  spot: string;
  coords: { lat: number; lon: number };
}

/** Anzeige-Metadaten je Ressourcen-Art (Label + Pin-/Chip-Farben). */
export const RESOURCE_META: Record<ResourceType, { label: string; pin: string; chip: string }> = {
  metall: { label: 'Metall', pin: 'bg-slate-300 border-slate-100', chip: 'border-slate-400/60 bg-slate-400/10 text-slate-200' },
  kristall: { label: 'Kristall', pin: 'bg-cyan-300 border-cyan-100', chip: 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200' },
  obsidian: { label: 'Obsidian', pin: 'bg-stone-500 border-stone-300', chip: 'border-stone-400/60 bg-stone-400/10 text-stone-300' },
  oel: { label: 'Öl', pin: 'bg-zinc-600 border-zinc-400', chip: 'border-zinc-400/60 bg-zinc-500/10 text-zinc-300' },
  perlen: { label: 'Perlen', pin: 'bg-pink-200 border-white', chip: 'border-pink-300/60 bg-pink-300/10 text-pink-200' },
  schwefel: { label: 'Schwefel', pin: 'bg-yellow-300 border-yellow-100', chip: 'border-yellow-400/60 bg-yellow-400/10 text-yellow-200' },
  edelsteine: { label: 'Edelsteine', pin: 'bg-fuchsia-300 border-fuchsia-100', chip: 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-200' },
  element: { label: 'Element', pin: 'bg-purple-400 border-purple-200', chip: 'border-purple-400/60 bg-purple-400/10 text-purple-200' },
};

let seq = 0;
const r = (map: MapName, type: ResourceType, spot: string, lat: number, lon: number): ResourceDeposit => ({
  id: `res-${++seq}`,
  map,
  type,
  spot,
  coords: { lat, lon },
});

/**
 * Ergiebige Farm-Hotspots pro Map. Bewusst kuratiert (die besten Stellen,
 * keine vollständige Knoten-Liste) – Koordinaten sind Richtwerte.
 */
export const RESOURCES: ResourceDeposit[] = [
  // ── The Island ──
  r('The Island', 'metall', 'Vulkan-Hänge', 40.5, 58.5),
  r('The Island', 'metall', 'Whitesky Peak', 17.5, 26.5),
  r('The Island', 'metall', "Far's Peak", 23.0, 58.5),
  r('The Island', 'kristall', 'Whitesky-Gipfel', 15.8, 28.6),
  r('The Island', 'obsidian', 'Vulkan-Krater', 42.0, 57.2),
  r('The Island', 'oel', 'Schnee-Ölfelder', 10.8, 62.5),
  r('The Island', 'oel', 'Unterwasser Ostküste', 53.5, 90.8),
  r('The Island', 'perlen', 'Tiefsee Nordwest', 12.4, 12.9),
  r('The Island', 'perlen', 'Bucht bei Herbivore Island', 84.6, 74.8),

  // ── Scorched Earth ──
  r('Scorched Earth', 'metall', 'Zentralgebirge', 41.0, 36.5),
  r('Scorched Earth', 'metall', 'Canyon-Grate', 63.5, 71.0),
  r('Scorched Earth', 'kristall', 'Hochgipfel', 29.5, 25.5),
  r('Scorched Earth', 'obsidian', 'Berg-Plateau', 24.8, 30.6),
  r('Scorched Earth', 'oel', 'Öl-Adern in den Dünen', 71.0, 59.5),
  r('Scorched Earth', 'oel', 'Öl-Adern Südwest', 75.5, 44.0),
  r('Scorched Earth', 'schwefel', 'Schwefelfelder am Gebirge', 43.0, 39.5),
  r('Scorched Earth', 'perlen', 'Wasserhöhle', 77.2, 35.4),

  // ── Aberration ──
  r('Aberration', 'metall', 'Klippen der Luminous Zone', 49.0, 55.5),
  r('Aberration', 'metall', 'Fertile-Chamber-Wände', 60.5, 30.0),
  r('Aberration', 'kristall', 'Kristallfelder', 55.0, 45.5),
  r('Aberration', 'edelsteine', 'Grüne Edelsteine (Bio-Zone)', 50.0, 35.0),
  r('Aberration', 'edelsteine', 'Blaue Edelsteine (Portal-Tiefe)', 41.0, 55.5),
  r('Aberration', 'edelsteine', 'Rote Edelsteine (Element-Region)', 70.0, 45.0),
  r('Aberration', 'perlen', 'Flussperlen der Fertile Chamber', 47.5, 32.0),
  r('Aberration', 'element', 'Element-Erz (Grave of the Lost)', 55.5, 64.5),

  // ── Extinction ──
  r('Extinction', 'metall', 'Wasteland-Ruinen', 60.0, 40.5),
  r('Extinction', 'metall', 'Stadtrand-Trümmer', 26.0, 49.0),
  r('Extinction', 'kristall', 'Straßenlampen der Stadt', 22.5, 52.5),
  r('Extinction', 'obsidian', 'Wasteland Süd-Ost', 70.0, 65.0),
  r('Extinction', 'oel', 'Öl-Pumpen im Ödland', 65.0, 30.5),
  r('Extinction', 'element', 'Element-Staub (Stadtkern)', 20.0, 55.0),

  // ── Genesis 1 ──
  r('Genesis 1', 'metall', 'Vulkan-Biom', 40.0, 65.5),
  r('Genesis 1', 'kristall', 'Lunar-Biom', 15.5, 80.0),
  r('Genesis 1', 'obsidian', 'Vulkan-Hänge', 42.5, 68.0),
  r('Genesis 1', 'oel', 'Ozean-Biom', 60.5, 20.0),
  r('Genesis 1', 'perlen', 'Ozean-Tiefe', 65.0, 25.5),
  r('Genesis 1', 'element', 'Element-Splitter (Lunar)', 18.0, 78.0),

  // ── Genesis 2 ──
  r('Genesis 2', 'metall', 'Weltraum-Asteroiden', 30.0, 75.5),
  r('Genesis 2', 'kristall', 'Asteroiden-Ring', 35.0, 80.0),
  r('Genesis 2', 'obsidian', 'Fels-Cluster (Space)', 32.5, 77.5),
  r('Genesis 2', 'oel', 'Eden-Gewässer', 65.0, 25.0),
  r('Genesis 2', 'perlen', 'Eden-Flussbett', 60.0, 30.0),
  r('Genesis 2', 'element', "Rockwell's Innards", 75.0, 70.0),

  // ── The Center ──
  r('The Center', 'metall', 'Half-Burnt Island', 14.5, 30.0),
  r('The Center', 'metall', 'Nordberge', 45.0, 20.5),
  r('The Center', 'kristall', 'Eisberg-Gipfel', 25.5, 45.0),
  r('The Center', 'obsidian', 'Lava Island', 55.0, 55.5),
  r('The Center', 'oel', 'Unterwasser-Senke', 60.0, 75.0),
  r('The Center', 'perlen', 'Tiefsee-Grotte', 65.5, 80.0),

  // ── Ragnarok ──
  r('Ragnarok', 'metall', 'Vulkan', 25.0, 25.5),
  r('Ragnarok', 'metall', 'Highlands-Klippen', 60.5, 75.0),
  r('Ragnarok', 'kristall', 'Eishöhle', 40.5, 20.0),
  r('Ragnarok', 'obsidian', 'Vulkan-Flanke', 24.0, 27.5),
  r('Ragnarok', 'oel', 'Viking Bay (Unterwasser)', 41.0, 87.5),
  r('Ragnarok', 'perlen', 'Viking Bay Muschelbänke', 43.0, 85.0),
  r('Ragnarok', 'schwefel', 'Wüsten-Geysire', 77.0, 73.0),

  // ── Valguero ──
  r('Valguero', 'metall', 'White Cliffs', 20.5, 35.0),
  r('Valguero', 'metall', 'Twin Peaks', 40.0, 60.5),
  r('Valguero', 'kristall', 'Eishöhle', 15.5, 29.5),
  r('Valguero', 'obsidian', 'Redwood-Vulkan', 66.0, 36.5),
  r('Valguero', 'oel', 'Seegrund (Zentralsee)', 50.5, 45.0),
  r('Valguero', 'perlen', 'Aberration-Zone (Gewässer)', 62.0, 42.5),
  r('Valguero', 'edelsteine', 'Aberration-Zone (Klippen)', 63.5, 44.0),

  // ── Crystal Isles ──
  r('Crystal Isles', 'kristall', 'Schwebende Inseln', 25.0, 45.5),
  r('Crystal Isles', 'kristall', 'Crystal-Wyvern-Nistgebiet', 30.5, 60.0),
  r('Crystal Isles', 'metall', 'Wüsten-Plateau', 70.0, 75.5),
  r('Crystal Isles', 'metall', 'Nordwest-Gebirge', 20.0, 30.0),
  r('Crystal Isles', 'obsidian', 'Vulkanfeld', 45.5, 35.0),
  r('Crystal Isles', 'oel', 'Ozean Nord', 55.0, 15.5),
  r('Crystal Isles', 'perlen', 'White Shoals', 15.0, 65.0),

  // ── Lost Island ──
  r('Lost Island', 'metall', 'Vulkan-Region', 60.0, 70.5),
  r('Lost Island', 'metall', 'Schneeberge', 20.5, 30.0),
  r('Lost Island', 'kristall', 'Gipfel im Nordwesten', 19.0, 27.5),
  r('Lost Island', 'obsidian', 'Vulkan-Hänge', 61.5, 72.0),
  r('Lost Island', 'oel', 'Südwest-Ozean', 80.0, 20.5),
  r('Lost Island', 'perlen', 'Nordost-Bucht', 74.5, 25.0),

  // ── Fjordur ──
  r('Fjordur', 'metall', 'Balheimr (Feuerland)', 85.0, 80.5),
  r('Fjordur', 'metall', 'Midgard-Gebirge', 40.5, 55.0),
  r('Fjordur', 'kristall', 'Jotunheim-Frostgipfel', 12.5, 15.0),
  r('Fjordur', 'obsidian', 'Balheimr-Lavafelder', 87.0, 78.0),
  r('Fjordur', 'oel', 'Küsten-Ölfelsen', 30.0, 40.5),
  r('Fjordur', 'perlen', 'Unterwasser-Höhlen (Vannaland)', 20.0, 42.5),
  r('Fjordur', 'schwefel', 'Balheimr-Schwefelfelder', 86.0, 83.5),
];

/** Alle Ressourcen-Hotspots einer Map. */
export function getResourcesForMap(map: MapName): ResourceDeposit[] {
  return RESOURCES.filter((res) => res.map === map);
}
