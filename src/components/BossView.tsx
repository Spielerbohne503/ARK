import { useMemo, useState } from 'react';
import { bossKey, DIFFICULTY_LABEL, getBossesForMap, type Boss, type BossDifficulty } from '../data/bosses';
import type { MapName } from '../types';
import { IconCheck, IconCompass } from './icons';

const DIFF_STYLE: Record<BossDifficulty, string> = {
  gamma: 'border-green-500/50 text-green-300 hover:bg-green-500/10',
  beta: 'border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10',
  alpha: 'border-red-500/50 text-red-300 hover:bg-red-500/10',
};

function BossImage({ boss }: { boss: Boss }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? '/dinos/placeholder.svg' : boss.imageUrl}
      alt={boss.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover brightness-110 contrast-105 transition-transform duration-500 group-hover:scale-110"
    />
  );
}

interface BossViewProps {
  map: MapName;
  isDefeated: (key: string) => boolean;
  onToggle: (boss: Boss, difficulty: BossDifficulty) => void;
  onOpenBoss: (boss: Boss) => void;
}

/** Boss-Übersicht einer Map: Karten mit Bild und Sieg-Chips je Schwierigkeit. */
export function BossView({ map, isDefeated, onToggle, onOpenBoss }: BossViewProps) {
  const bosses = useMemo(() => getBossesForMap(map), [map]);

  if (bosses.length === 0) {
    return (
      <p className="rounded-xl border border-gray-800 bg-ark-surface p-10 text-center text-gray-400">
        Für diese Map sind keine Bosse hinterlegt.
      </p>
    );
  }

  return (
    <div key={map} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {bosses.map((boss, index) => {
        const allDone = boss.difficulties.every((d) => isDefeated(bossKey(boss.id, d)));
        return (
          <article
            key={boss.id}
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            className={`group animate-fade-in-up overflow-hidden rounded-xl border shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              allDone
                ? 'border-green-500/60 bg-green-900/70 hover:shadow-glow-green'
                : 'border-gray-700/80 bg-gray-800 hover:border-green-700/60 hover:shadow-2xl hover:shadow-black/60'
            }`}
          >
            {/* Bild öffnet die Detail-Ansicht */}
            <button
              type="button"
              onClick={() => onOpenBoss(boss)}
              aria-label={`${boss.name} – Details`}
              className="relative block h-40 w-full overflow-hidden bg-gray-900 text-left"
            >
              <BossImage boss={boss} />
              {/* radialer Lichtschein hellt den oft dunklen Boss-Render auf */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 mix-blend-screen ${
                  allDone
                    ? 'bg-[radial-gradient(ellipse_at_center,rgba(74,222,128,0.35),transparent_65%)]'
                    : 'bg-[radial-gradient(ellipse_at_center,rgba(150,170,200,0.3),transparent_65%)]'
                }`}
              />
              <span aria-hidden className={`pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent ${allDone ? 'from-green-950/90' : 'from-gray-950/90'}`} />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="font-display text-lg font-bold text-white drop-shadow-md">{boss.name}</h3>
                <p className="flex items-center gap-1 text-xs text-gray-300">
                  <IconCompass size={12} /> {boss.arena}
                </p>
              </div>
            </button>

            {/* Sieg-Chips je Schwierigkeit */}
            <div className="flex flex-wrap gap-2 p-3">
              {boss.difficulties.map((d) => {
                const defeated = isDefeated(bossKey(boss.id, d));
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onToggle(boss, d)}
                    aria-pressed={defeated}
                    title={`${DIFFICULTY_LABEL[d]} ${defeated ? 'besiegt' : 'offen'}`}
                    className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                      defeated
                        ? 'border-green-400/70 bg-green-500/90 text-gray-950'
                        : `bg-transparent ${DIFF_STYLE[d]}`
                    }`}
                  >
                    {defeated && <IconCheck size={13} />}
                    {DIFFICULTY_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
