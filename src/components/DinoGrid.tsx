import type { Dino, MapName } from '../types';
import { DinoCard } from './DinoCard';

interface DinoGridProps {
  dinos: Dino[];
  map: MapName;
  isTamed: (map: MapName, dinoId: string) => boolean;
  isFavorite: (map: MapName, dinoId: string) => boolean;
  onTogglePin: (dino: Dino) => void;
  onToggleFavorite: (dino: Dino) => void;
  onOpenDetails: (dino: Dino) => void;
}

/** Responsive Karten-Grid: 1 Spalte mobil, bis zu 4 Spalten auf Desktop. */
export function DinoGrid({
  dinos,
  map,
  isTamed,
  isFavorite,
  onTogglePin,
  onToggleFavorite,
  onOpenDetails,
}: DinoGridProps) {
  if (dinos.length === 0) {
    return (
      <p className="rounded-xl border border-gray-800 bg-ark-surface p-10 text-center text-gray-400">
        Keine Dinos gefunden – Filter zurücksetzen oder andere Map wählen.
      </p>
    );
  }

  return (
    // key={map} remountet das Grid bei Map-Wechsel → Stagger-Animation läuft erneut
    <div key={map} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dinos.map((dino, index) => (
        <DinoCard
          key={dino.id}
          dino={dino}
          index={index}
          tamed={isTamed(map, dino.id)}
          favorite={isFavorite(map, dino.id)}
          onTogglePin={() => onTogglePin(dino)}
          onToggleFavorite={() => onToggleFavorite(dino)}
          onOpenDetails={() => onOpenDetails(dino)}
        />
      ))}
    </div>
  );
}
