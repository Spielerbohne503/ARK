import { useMemo } from 'react';
import { formatMinutes } from '../lib/format';
import type { Difficulty, Dino, TamingResult } from '../types';

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 150;

// Skalierungsfaktoren: wert = basis * (1 + (level - 1) * multiplier)
const KIBBLE_MULTIPLIER = 0.033; // Futterbedarf wächst ~3,3 % pro Level
const TIME_MULTIPLIER = 0.025; // Zähmzeit wächst ~2,5 % pro Level

// Narcotics pro Minute Zähmzeit, abhängig vom Torpor-Verhalten der Klasse.
const NARCOTIC_RATE: Record<Difficulty, number> = {
  easy: 0.5,
  medium: 1,
  hard: 2,
};

/** Kernformel aus der Spezifikation. */
function scale(baseValue: number, level: number, multiplier: number): number {
  return baseValue * (1 + (level - 1) * multiplier);
}

/**
 * Berechnet alle Taming-Werte für einen Dino auf gegebenem Wild-Level.
 * Pure Function – separat exportiert, damit sie ohne React testbar bleibt.
 */
export function calculateTaming(dino: Dino, level: number): TamingResult {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));

  const kibbleCount = Math.ceil(scale(dino.baseKibbleCount, clamped, KIBBLE_MULTIPLIER));
  const tamingMinutes = scale(dino.baseTamingTime, clamped, TIME_MULTIPLIER);
  const narcotics = Math.ceil(tamingMinutes * NARCOTIC_RATE[dino.difficulty]);
  // 5 Narcoberries entsprechen grob 1 Narcotic (Torpor-Wert).
  const narcoberries = narcotics * 5;
  // Fallback ohne Kibble: rohes Futter braucht ca. die 3-fache Menge.
  const foodAmount = kibbleCount * 3;

  return {
    kibbleCount,
    narcotics,
    narcoberries,
    foodAmount,
    tamingMinutes,
    tamingTimeFormatted: formatMinutes(tamingMinutes),
    resources: [
      { label: dino.kibbleType, amount: kibbleCount, icon: '🍳' },
      { label: dino.tamingFood, amount: foodAmount, icon: '🍖' },
      { label: 'Narcotics', amount: narcotics, icon: '💉' },
      { label: 'Narcoberries (Alternative)', amount: narcoberries, icon: '🫐' },
    ],
  };
}

/** React-Hook: memoized Berechnung, aktualisiert live bei Level-Änderung. */
export function useTamingCalculator(dino: Dino, level: number): TamingResult {
  return useMemo(() => calculateTaming(dino, level), [dino, level]);
}
