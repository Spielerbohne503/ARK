/** Lokales Spieler-Profil („Wer war's?") + Einstellungen, in localStorage. */

const NAME_KEY = 'ark-dino-tracker:player-name';
const VARIANTS_KEY = 'ark-dino-tracker:variants-enabled';

export function getPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setPlayerName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name.trim());
  } catch {
    // localStorage gesperrt – Name gilt dann nicht.
  }
}

export function getVariantsEnabled(): boolean {
  try {
    return localStorage.getItem(VARIANTS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setVariantsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(VARIANTS_KEY, enabled ? '1' : '0');
  } catch {
    // ignorieren
  }
}
