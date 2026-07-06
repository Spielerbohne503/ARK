import { useRef } from 'react';
import { IconDownload, IconSkull, IconUpload } from './icons';
import { NAV_ITEMS, type ViewMode } from './nav';

interface SidebarProps {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  overallDone: number;
  overallTotal: number;
  overallPercent: number;
  overallPercentAnimated: number;
  onExport: () => void;
  onImport: (file: File) => void;
}

/**
 * Desktop-Navigations-Rail (≥ lg): Wortmarke, vertikale Modus-Nav,
 * persistenter Gesamt-Fortschritt sowie Backup & Credits (früher der Footer).
 */
export function Sidebar({
  viewMode,
  onViewMode,
  overallDone,
  overallTotal,
  overallPercent,
  overallPercentAnimated,
  onExport,
  onImport,
}: SidebarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-800/80 bg-gray-950/40 lg:flex">
      {/* feiner Licht-Rand rechts */}
      <span aria-hidden className="absolute inset-y-0 -right-px w-px bg-gradient-to-b from-transparent via-green-500/30 to-transparent" />

      {/* Wortmarke */}
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 shadow-glow-green">
          <IconSkull size={20} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold tracking-widest text-gray-50">ARK</p>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-green-400/90">
            Dino Tracker
          </p>
        </div>
      </div>

      {/* Modus-Navigation */}
      <nav aria-label="Bereiche" className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ mode, label, Icon }) => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onViewMode(mode)}
              aria-pressed={active}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-green-500/20 to-green-500/5 text-green-200 ring-1 ring-green-400/40'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {/* aktiver Balken links */}
              <span
                aria-hidden
                className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full transition-all duration-200 ${
                  active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-transparent'
                }`}
              />
              <Icon size={18} className={active ? 'text-green-300' : 'text-gray-500 group-hover:text-gray-300'} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Persistenter Gesamt-Fortschritt */}
      <div className="mx-3 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
        <div className="mb-2 flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.15em]">
          <span className="text-gray-500">Gesamt</span>
          <span className="font-mono tabular-nums text-green-300">
            {overallDone}/{overallTotal} · <span className="text-amber-300">{overallPercentAnimated}%</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={overallPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Gesamtfortschritt"
          className="h-2.5 overflow-hidden rounded-full border border-black/40 bg-gray-950/60 shadow-inner"
        >
          <div
            className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-amber-400 transition-all duration-700 ease-out ${
              overallPercent > 0 ? 'shadow-[0_0_12px_rgba(74,222,128,0.5)]' : ''
            }`}
            style={{ width: `${Math.max(overallPercent, 1.5)}%` }}
          >
            {overallPercent > 0 && (
              <span
                aria-hidden
                className="absolute inset-y-0 w-1/4 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            )}
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="mx-3 mb-3 flex gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-2 py-2 text-xs text-gray-300 transition-colors hover:border-green-600 hover:text-green-300"
        >
          <IconDownload size={15} />
          Export
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-2 py-2 text-xs text-gray-300 transition-colors hover:border-green-600 hover:text-green-300"
        >
          <IconUpload size={15} />
          Import
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Credits */}
      <p className="px-5 pb-5 text-[11px] leading-relaxed text-gray-600">
        Inoffizielles Fan-Projekt. Dossier-Artworks © Studio Wildcard via Ark Community Wiki
        (CC-BY-SA). Läuft komplett offline.
      </p>
    </aside>
  );
}
