import type { Dino, MapName } from '../types';

/**
 * Opt-in-Varianten-Tracking: X-/R-/Tek-/Aberrant-Varianten derselben Spezies
 * als eigene Unterhaken. Die Zuordnung ist regelbasiert (Richtwerte):
 * X auf Genesis 1, R auf Genesis 2, Aberrant auf Aberration, Tek für die
 * neun Tek-Spezies auf den klassischen Maps.
 */
export type VariantId = 'tek' | 'x' | 'r' | 'aberrant';

export const VARIANT_META: Record<VariantId, { label: string; chip: string }> = {
  tek: { label: 'Tek', chip: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300' },
  x: { label: 'X-Variante', chip: 'border-orange-500/60 bg-orange-500/10 text-orange-300' },
  r: { label: 'R-Variante', chip: 'border-lime-500/60 bg-lime-500/10 text-lime-300' },
  aberrant: { label: 'Aberrant', chip: 'border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-300' },
};

/** Spezies mit permanenten Tek-Spawns (klassische Maps). */
const TEK_SPECIES = new Set([
  'parasaur', 'raptor', 'rex', 'stego', 'trike', 'quetzal', 'mosasaurus', 'megalodon', 'tapejara',
]);

const TEK_MAPS = new Set<MapName>([
  'The Island', 'The Center', 'Ragnarok', 'Valguero', 'Crystal Isles', 'Lost Island', 'Fjordur',
]);

/** Welche Varianten sind für diese Kreatur auf dieser Map abhakbar? */
export function getVariantsFor(dino: Dino, map: MapName): VariantId[] {
  if (dino.tameable === false) return [];
  const out: VariantId[] = [];
  if (TEK_SPECIES.has(dino.id) && TEK_MAPS.has(map)) out.push('tek');
  if (map === 'Genesis 1') out.push('x');
  if (map === 'Genesis 2') out.push('r');
  if (map === 'Aberration') out.push('aberrant');
  return out;
}

/** Persistenz-Schlüssel einer abgehakten Variante. */
export const variantKey = (map: MapName, dinoId: string, variant: VariantId) =>
  `${map}:${dinoId}:${variant}`;
