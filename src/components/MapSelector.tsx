import { MAPS, type MapName } from '../types';

interface MapSelectorProps {
  selected: MapName;
  onChange: (map: MapName) => void;
}

/** Dropdown zur Map-Auswahl – natives <select> für beste Mobile-Bedienung. */
export function MapSelector({ selected, onChange }: MapSelectorProps) {
  return (
    <label className="relative block w-full sm:w-72">
      <span className="mb-1.5 block font-display text-xs uppercase tracking-widest text-gray-400">
        Map auswählen
      </span>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value as MapName)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-700 bg-ark-surface px-4 py-3 pr-10 font-body text-base text-gray-100 shadow-lg outline-none transition-colors duration-200 hover:border-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
      >
        {MAPS.map((map) => (
          <option key={map} value={map}>
            {map}
          </option>
        ))}
      </select>
      {/* Custom-Chevron, da appearance-none den nativen Pfeil entfernt */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-[42px] text-sm text-green-500"
      >
        ▼
      </span>
    </label>
  );
}
