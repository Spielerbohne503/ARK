import type { Difficulty } from '../types';

export type StatusFilter = 'all' | 'tamed' | 'open' | 'favorites';
export type DifficultyFilter = 'all' | Difficulty;
export type SortOrder = 'name' | 'difficulty' | 'recent';

interface FilterBarProps {
  status: StatusFilter;
  difficulty: DifficultyFilter;
  sort: SortOrder;
  resultCount: number;
  onStatus: (value: StatusFilter) => void;
  onDifficulty: (value: DifficultyFilter) => void;
  onSort: (value: SortOrder) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'tamed', label: 'Gezähmt' },
  { value: 'open', label: 'Offen' },
  { value: 'favorites', label: 'Favoriten' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string; dot?: string }[] = [
  { value: 'all', label: 'Jede Stufe' },
  { value: 'easy', label: 'Leicht', dot: 'bg-green-400' },
  { value: 'medium', label: 'Mittel', dot: 'bg-yellow-400' },
  { value: 'hard', label: 'Schwer', dot: 'bg-red-400' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'difficulty', label: 'Schwierigkeit' },
  { value: 'recent', label: 'Zuletzt gezähmt' },
];

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  activeClass,
}: {
  label: string;
  options: { value: T; label: string; dot?: string }[];
  value: T;
  onChange: (value: T) => void;
  activeClass: string;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-1.5">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              active
                ? activeClass
                : 'border-gray-800 bg-transparent text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {option.dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />}
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}

/** Filter- und Sortier-Leiste mit animierten Chips. */
export function FilterBar({
  status,
  difficulty,
  sort,
  resultCount,
  onStatus,
  onDifficulty,
  onSort,
}: FilterBarProps) {
  return (
    <section
      aria-label="Filter und Sortierung"
      className="flex flex-col gap-3 rounded-xl border border-gray-800/80 bg-ark-surface/60 p-3.5 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <ChipGroup
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatus}
          activeClass="border-green-500/60 bg-green-500/10 text-green-300 shadow-glow-green"
        />
        <span aria-hidden className="hidden h-5 w-px bg-gray-800 sm:block" />
        <ChipGroup
          label="Schwierigkeit"
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={onDifficulty}
          activeClass="border-gray-500 bg-white/5 text-gray-200"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800/60 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-gray-600">Sortierung</span>
          <ChipGroup
            label="Sortierung"
            options={SORT_OPTIONS}
            value={sort}
            onChange={onSort}
            activeClass="border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-glow-amber"
          />
        </div>
        <p className="font-mono text-xs tabular-nums text-gray-500">
          {resultCount} {resultCount === 1 ? 'Kreatur' : 'Kreaturen'}
        </p>
      </div>
    </section>
  );
}
