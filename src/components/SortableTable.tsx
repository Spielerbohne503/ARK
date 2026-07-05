import { useMemo, useState, type ReactNode } from 'react';
import { IconSortArrows, IconSortDown, IconSortUp } from './icons';

export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDir;
}

type Accessor<T> = (row: T) => string | number;

/**
 * Generische Tabellen-Sortierung: `toggle(key)` schaltet
 * unsortiert → aufsteigend → absteigend um.
 */
export function useTableSort<T>(
  rows: T[],
  accessors: Record<string, Accessor<T>>,
): { sorted: T[]; sort: SortState | null; toggle: (key: string) => void } {
  const [sort, setSort] = useState<SortState | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const accessor = accessors[sort.key];
    if (!accessor) return rows;
    const copy = [...rows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'de');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
    // accessors sind modul-konstant, bewusst nicht in den Deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  const toggle = (key: string) =>
    setSort((prev) =>
      prev?.key !== key ? { key, dir: 'asc' } : prev.dir === 'asc' ? { key, dir: 'desc' } : null,
    );

  return { sorted, sort, toggle };
}

interface SortableThProps {
  label: ReactNode;
  sortKey: string;
  sort: SortState | null;
  onToggle: (key: string) => void;
  align?: 'left' | 'right';
}

/** Klickbarer Spaltenkopf mit Sortier-Indikator. */
export function SortableTh({ label, sortKey, sort, onToggle, align = 'right' }: SortableThProps) {
  const active = sort?.key === sortKey;
  return (
    <th className={`pb-2 font-medium ${align === 'left' ? 'text-left' : 'text-right'}`}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        aria-label={`Nach ${typeof label === 'string' ? label : sortKey} sortieren`}
        className={`inline-flex items-center gap-0.5 uppercase tracking-widest transition-colors ${
          active ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {label}
        {active ? (
          sort!.dir === 'asc' ? <IconSortUp size={13} /> : <IconSortDown size={13} />
        ) : (
          <IconSortArrows size={13} className="opacity-50" />
        )}
      </button>
    </th>
  );
}
