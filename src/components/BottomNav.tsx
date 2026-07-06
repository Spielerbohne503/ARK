import { NAV_ITEMS, type ViewMode } from './nav';

interface BottomNavProps {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
}

/** Mobile Modus-Tab-Leiste (< lg), daumenfreundlich am unteren Rand fixiert. */
export function BottomNav({ viewMode, onViewMode }: BottomNavProps) {
  return (
    <nav
      aria-label="Bereiche"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-800/80 bg-ark-bg/90 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ mode, short, Icon }) => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onViewMode(mode)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-200 ${
                active ? 'text-green-300' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="relative">
                {active && (
                  <span
                    aria-hidden
                    className="absolute -inset-2 -top-2.5 rounded-full bg-green-500/10"
                  />
                )}
                <Icon size={20} className="relative" />
              </span>
              <span className="tracking-wide">{short}</span>
            </button>
          );
        })}
      </div>
      {/* Safe-Area-Ausgleich für Geräte mit Home-Indikator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
