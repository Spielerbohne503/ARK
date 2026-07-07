import type { Dino, MapName } from '../types';
import { DinoCard } from './DinoCard';
import { IconSkull } from './icons';

interface DinoGridProps {
  dinos: Dino[];
  map: MapName;
  isTamed: (map: MapName, dinoId: string) => boolean;
  isFavorite: (map: MapName, dinoId: string) => boolean;
  onTogglePin: (dino: Dino) => void;
  onToggleFavorite: (dino: Dino) => void;
  onOpenDetails: (dino: Dino) => void;
}

/**
 * Responsive Karten-Grid: 1 Spalte mobil, bis zu 4 Spalten auf Desktop.
 * Zähmbare Kreaturen zuerst, danach – abgesetzt durch eine grüne Überschrift –
 * die nicht-zähmbaren (Alphas, Korrupte, Wildtiere). Beide Gruppen behalten
 * ihre gewählte Sortierung.
 */
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

  const tameable = dinos.filter((d) => d.tameable !== false);
  const nonTameable = dinos.filter((d) => d.tameable === false);

  const renderCard = (dino: Dino, index: number) => (
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
  );

  const gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    // key={map} remountet das Grid bei Map-Wechsel → Stagger-Animation läuft erneut
    <div key={map} className="space-y-5">
      {tameable.length > 0 && (
        <div className={gridClass}>{tameable.map((dino, i) => renderCard(dino, i))}</div>
      )}

      {nonTameable.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-1">
            <span className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-green-300/90">
              <IconSkull size={15} className="text-green-400/80" />
              Nicht zähmbar
            </span>
            <span className="font-mono text-[11px] tabular-nums text-gray-500">
              {nonTameable.length}
            </span>
            <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-green-500/40 to-transparent" />
          </div>
          <div className={gridClass}>{nonTameable.map((dino, i) => renderCard(dino, i))}</div>
        </>
      )}
    </div>
  );
}
