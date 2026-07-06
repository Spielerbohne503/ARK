import type { ComponentType, SVGProps } from 'react';
import { IconBook, IconDrumstick, IconGem, IconSwords, IconTrophy } from './icons';

export type ViewMode = 'creatures' | 'notes' | 'bosses' | 'artifacts' | 'kibble';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export interface NavItem {
  mode: ViewMode;
  /** Voller Name (Sidebar). */
  label: string;
  /** Kurzer Name (Mobile-Tab-Bar). */
  short: string;
  Icon: IconComponent;
}

/** Die Sammel-Bereiche der App – gemeinsam von Sidebar und Bottom-Nav genutzt. */
export const NAV_ITEMS: readonly NavItem[] = [
  { mode: 'creatures', label: 'Kreaturen', short: 'Dinos', Icon: IconSwords },
  { mode: 'notes', label: 'Erkunder-Notizen', short: 'Notizen', Icon: IconBook },
  { mode: 'bosses', label: 'Bosse', short: 'Bosse', Icon: IconTrophy },
  { mode: 'artifacts', label: 'Artefakte', short: 'Artefakte', Icon: IconGem },
  { mode: 'kibble', label: 'Kibble', short: 'Kibble', Icon: IconDrumstick },
];
