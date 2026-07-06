import { useState } from 'react';
import { KIBBLE, kibbleTames, type Kibble } from '../data/kibble';
import { IconDrumstick, IconEgg, IconSparkles } from './icons';

function KibbleImage({ kibble }: { kibble: Kibble }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? '/notes/placeholder.svg' : kibble.imageUrl}
      alt={kibble.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-14 shrink-0 rounded-lg border border-gray-700 bg-gray-950/40 object-contain p-1"
    />
  );
}

/** Map-unabhängige Kibble-Referenz: Rezept, Ei-Quellen und welche Dinos sie brauchen. */
export function KibbleView() {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-gray-800/80 bg-ark-surface/60 p-3.5 text-sm text-gray-400 sm:p-4">
        Die sechs Kibble-Stufen mit Rezept und den Kreaturen, die sie zum Zähmen bevorzugen.
        Rezepte sind Richtwerte im vereinheitlichten Kibble-System.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {KIBBLE.map((kibble, index) => {
          const tames = kibbleTames(kibble.name);
          return (
            <section
              key={kibble.id}
              style={{ animationDelay: `${index * 40}ms` }}
              className="animate-fade-in-up overflow-hidden rounded-xl border border-gray-700/80 bg-gray-800"
            >
              {/* Kopf */}
              <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900/40 p-4">
                <KibbleImage kibble={kibble} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-gray-100">{kibble.name}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-gray-400">
                    <IconEgg size={13} /> {kibble.eggSize}
                  </p>
                </div>
                <span aria-label={`Qualität ${kibble.quality} von 6`} className="flex shrink-0 gap-0.5">
                  {Array.from({ length: 6 }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i < kibble.quality ? 'bg-amber-400' : 'bg-gray-700'}`}
                    />
                  ))}
                </span>
              </div>

              <div className="space-y-4 p-4">
                {/* Rezept */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    <IconDrumstick size={14} /> Rezept
                  </h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {kibble.recipe.map((item) => (
                      <li key={item} className="rounded border border-gray-700 bg-gray-900/60 px-2 py-0.5 text-[11px] text-gray-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ei-Quellen */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    <IconEgg size={14} /> Typische Ei-Quellen
                  </h4>
                  <p className="text-sm text-gray-400">{kibble.eggSources.join(' · ')}</p>
                </div>

                {/* Zähmt */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-green-400/90">
                    <IconSparkles size={14} /> Bevorzugt von {tames.length} Kreaturen
                  </h4>
                  {tames.length === 0 ? (
                    <p className="text-sm text-gray-500">–</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tames.map((name) => (
                        <span key={name} className="rounded border border-green-900/60 bg-green-950/40 px-1.5 py-0.5 text-[11px] text-green-300/90">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
